const { pool } = require('../config/database');
const CampaignModel = require('../models/Campaign');
const CampaignOrganizerModel = require('../models/CampaignOrganizer');
const OrganizerApplicationModel = require('../models/OrganizerApplication');
const { notifyActiveAdmins, notifyUsers } = require('../services/notificationService');

const reviewableStatuses = ['accepted', 'rejected'];

const notifyAdminsSafely = async (payload) => {
  try {
    await notifyActiveAdmins(payload);
  } catch (error) {
    console.error('Failed to send admin notifications:', error.message);
  }
};

const notifyUsersSafely = async (payload) => {
  try {
    await notifyUsers(payload);
  } catch (error) {
    console.error('Failed to send targeted notifications:', error.message);
  }
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const applyToOrganizeCampaign = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;
    const motivation = normalizeText(req.body?.motivation);
    const experience = normalizeText(req.body?.experience);

    const campaign = await CampaignModel.findById(campaignId, req.user.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    if (req.user.role !== 'volunteer') {
      return res.status(400).json({
        success: false,
        message: 'Only volunteer accounts can apply to become campaign organizers.',
      });
    }

    if (await CampaignOrganizerModel.isActiveOrganizer(campaignId, req.user.id)) {
      return res.status(409).json({
        success: false,
        message: 'You are already an organizer for this campaign.',
      });
    }

    if (!motivation) {
      return res.status(400).json({
        success: false,
        message: 'Please explain why you want to organize this campaign.',
      });
    }

    const existingApplication = await OrganizerApplicationModel.findByUserAndCampaign(req.user.id, campaignId);
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existingApplication.status} organizer application for this campaign.`,
      });
    }

    const application = await OrganizerApplicationModel.create({
      userId: req.user.id,
      campaignId,
      motivation,
      experience,
    });

    await Promise.all([
      notifyAdminsSafely({
        title: 'New organizer application',
        message: `${req.user.name} applied to organize "${campaign.title}".`,
        type: 'organizer_application_submitted',
      }),
      notifyUsersSafely({
        title: 'New organizer application',
        message: `${req.user.name} applied to become an organizer for "${campaign.title}".`,
        type: 'organizer_application_submitted',
        userIds: campaign.organizers?.map((organizer) => organizer.user_id) || [campaign.created_by],
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Organizer application submitted successfully.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizerApplications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const allowedFilters = ['all', 'pending', 'accepted', 'rejected', 'cancelled'];

    if (!allowedFilters.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organizer application status filter.',
      });
    }

    const applications = await OrganizerApplicationModel.findManageable({
      user: req.user,
      status,
    });

    res.status(200).json({
      success: true,
      data: { applications },
    });
  } catch (error) {
    next(error);
  }
};

const reviewOrganizerApplication = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!reviewableStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Organizer applications can only be accepted or rejected here.',
      });
    }

    const application = await OrganizerApplicationModel.findById(applicationId, connection);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Organizer application not found.',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending organizer applications can be reviewed. This one is already ${application.status}.`,
      });
    }

    const campaign = await CampaignModel.findById(application.campaign_id);
    if (!await CampaignModel.canUserManage(campaign, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You can only review organizer applications for campaigns you manage.',
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const updatedApplication = await OrganizerApplicationModel.updateStatus(
      applicationId,
      status,
      req.user.id,
      connection
    );
    let organizer = null;

    if (status === 'accepted') {
      organizer = await CampaignOrganizerModel.upsert({
        campaignId: application.campaign_id,
        userId: application.user_id,
        role: 'organizer',
      }, connection);
    }

    await connection.commit();

    await notifyUsersSafely({
      title: status === 'accepted' ? 'Organizer application accepted' : 'Organizer application rejected',
      message: status === 'accepted'
        ? `You are now an organizer for "${application.campaign_title}".`
        : `Your organizer application for "${application.campaign_title}" was rejected.`,
      type: status === 'accepted' ? 'organizer_application_accepted' : 'organizer_application_rejected',
      userIds: [application.user_id],
    });

    res.status(200).json({
      success: true,
      message: `Organizer application ${status} successfully.`,
      data: {
        application: updatedApplication,
        organizer,
      },
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  applyToOrganizeCampaign,
  getOrganizerApplications,
  reviewOrganizerApplication,
};
