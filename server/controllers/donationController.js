const CampaignModel = require('../models/Campaign');
const CampaignOrganizerModel = require('../models/CampaignOrganizer');
const DonationModel = require('../models/Donation');
const { notifyActiveAdmins, notifyUsers } = require('../services/notificationService');

const donationTypes = ['financial', 'material'];
const donationStatuses = ['pending', 'confirmed', 'rejected'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const parsePositiveAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ensureDonationAccess = async (donation, user) => {
  if (!donation) {
    return { status: 404, message: 'Donation not found.' };
  }

  const campaign = await CampaignModel.findById(donation.campaign_id);
  if (!await CampaignModel.canUserManage(campaign, user)) {
    return { status: 403, message: 'You can only manage donations for campaigns assigned to you.' };
  }

  return null;
};

const notifyDonationStakeholdersSafely = async ({ donation, actorName }) => {
  const isFinancial = donation.type === 'financial';
  const baseMessage = isFinancial
    ? `${donation.donor_name} offered a financial donation of ${formatAmount(donation.amount)} for "${donation.campaign_title}".`
    : `${donation.donor_name} offered material support for "${donation.campaign_title}".`;

  try {
    const campaignOrganizers = await CampaignOrganizerModel.findByCampaignId(donation.campaign_id);
    await notifyUsers({
      title: isFinancial ? 'New financial donation' : 'New material donation',
      message: isFinancial
        ? `${baseMessage} Reach out at ${donation.donor_email} to coordinate the next steps.`
        : `${baseMessage} Review the details and confirm with the donor at ${donation.donor_email}.`,
      type: 'donation_created',
      userIds: campaignOrganizers.length
        ? campaignOrganizers.map((organizer) => organizer.user_id)
        : [donation.campaign_owner_id],
    });
  } catch (error) {
    console.error('Failed to notify organizer about donation:', error.message);
  }

  try {
    await notifyActiveAdmins({
      title: isFinancial ? 'Donation pledge submitted' : 'Material donation submitted',
      message: actorName ? `${actorName} submitted a donation for "${donation.campaign_title}".` : baseMessage,
      type: 'donation_created',
    });
  } catch (error) {
    console.error('Failed to notify admins about donation:', error.message);
  }
};

const getManageableDonations = async (req, res, next) => {
  try {
    const { status, type, campaignId, search } = req.query;
    const donations = await DonationModel.findManageable({
      user: req.user,
      status: status && status !== 'all' ? status : undefined,
      type: type && type !== 'all' ? type : undefined,
      campaignId: campaignId && campaignId !== 'all' ? campaignId : undefined,
      search: search?.trim() || undefined,
    });
    const stats = await DonationModel.getStats({ user: req.user });

    res.status(200).json({
      success: true,
      data: { donations, stats },
    });
  } catch (error) {
    next(error);
  }
};

const createDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Donations are only available while a campaign is active.',
      });
    }

    const donor_name = normalizeText(req.body.donor_name) || req.user?.name || '';
    const donor_email = normalizeText(req.body.donor_email) || req.user?.email || '';
    const type = normalizeText(req.body.type).toLowerCase();
    const description = normalizeText(req.body.description);
    const amount = parsePositiveAmount(req.body.amount);

    if (!donor_name || !donor_email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Donor name, donor email, and donation type are required.',
      });
    }

    if (!emailPattern.test(donor_email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid donor email address.',
      });
    }

    if (!donationTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Donation type must be financial or material.',
      });
    }

    if (type === 'financial' && amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount for financial donations.',
      });
    }

    if (type === 'material' && !description) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the material support you want to offer.',
      });
    }

    const donationId = await DonationModel.create({
      donor_name,
      donor_email,
      type,
      amount: type === 'financial' ? amount : null,
      description: description || null,
      campaign_id: campaign.id,
      status: 'pending',
    });

    const donation = await DonationModel.findById(donationId);
    await notifyDonationStakeholdersSafely({
      donation,
      actorName: donor_name,
    });

    res.status(201).json({
      success: true,
      message: type === 'financial'
        ? 'Donation request submitted. Please coordinate directly with the organizer to complete the financial contribution.'
        : 'Material donation submitted successfully.',
      data: {
        donation,
        organizerContact: donation.type === 'financial'
          ? {
            name: donation.organizer_name,
            email: donation.organizer_email,
          }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDonation = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const existingDonation = await DonationModel.findById(donationId);
    const accessError = await ensureDonationAccess(existingDonation, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const donor_name = normalizeText(req.body.donor_name) || existingDonation.donor_name;
    const donor_email = normalizeText(req.body.donor_email) || existingDonation.donor_email;
    const type = normalizeText(req.body.type).toLowerCase() || existingDonation.type;
    const description = normalizeText(req.body.description);
    const status = normalizeText(req.body.status).toLowerCase() || existingDonation.status;

    if (!emailPattern.test(donor_email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid donor email address.',
      });
    }

    if (!donationTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Donation type must be financial or material.',
      });
    }

    if (!donationStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation status.',
      });
    }

    let amount = existingDonation.amount;
    if (type === 'financial') {
      amount = req.body.amount === undefined || req.body.amount === null || req.body.amount === ''
        ? parsePositiveAmount(existingDonation.amount)
        : parsePositiveAmount(req.body.amount);

      if (amount === null) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid amount for financial donations.',
        });
      }
    } else {
      amount = null;
      if (!description) {
        return res.status(400).json({
          success: false,
          message: 'Please describe the material support you want to offer.',
        });
      }
    }

    const donation = await DonationModel.update(donationId, {
      donor_name,
      donor_email,
      type,
      amount,
      description: description || null,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully.',
      data: { donation },
    });
  } catch (error) {
    next(error);
  }
};

const updateDonationStatus = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const { status } = req.body;

    if (!donationStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation status.',
      });
    }

    const existingDonation = await DonationModel.findById(donationId);
    const accessError = await ensureDonationAccess(existingDonation, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const donation = await DonationModel.updateStatus(donationId, status);

    res.status(200).json({
      success: true,
      message: 'Donation status updated successfully.',
      data: { donation },
    });
  } catch (error) {
    next(error);
  }
};

const deleteDonation = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const existingDonation = await DonationModel.findById(donationId);
    const accessError = await ensureDonationAccess(existingDonation, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    await DonationModel.delete(donationId);

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManageableDonations,
  createDonation,
  updateDonation,
  updateDonationStatus,
  deleteDonation,
};
