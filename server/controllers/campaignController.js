const fs = require('fs');
const path = require('path');
const CampaignModel = require('../models/Campaign');
const { notifyActiveAdmins, notifyActiveVolunteers } = require('../services/notificationService');

const notifyVolunteersSafely = async (payload) => {
  try {
    await notifyActiveVolunteers(payload);
  } catch (error) {
    console.error('Failed to send volunteer notifications:', error.message);
  }
};

const notifyAdminsSafely = async (payload) => {
  try {
    await notifyActiveAdmins(payload);
  } catch (error) {
    console.error('Failed to send admin notifications:', error.message);
  }
};

const deleteUploadedFile = (filePath) => {
  if (!filePath || !filePath.startsWith('/uploads/')) return;
  const relativeUploadPath = filePath.replace(/^\//, '');
  const absolutePath = path.join(__dirname, '..', relativeUploadPath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const ensureCampaignAccess = (campaign, user) => {
  if (!campaign) {
    return { status: 404, message: 'Campaign not found.' };
  }

  if (user.role === 'organizer' && campaign.created_by !== user.id) {
    return { status: 403, message: 'You can only manage campaigns you created.' };
  }

  return null;
};

const getAllCampaigns = async (req, res, next) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await CampaignModel.findAll({ status, search, page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    const missions = await CampaignModel.getMissions(id, req.user?.id);

    res.status(200).json({
      success: true,
      data: { campaign, missions },
    });
  } catch (error) {
    next(error);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    const { title, description, location, latitude, longitude, start_date, end_date, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const parsedLatitude = latitude === '' || latitude === undefined || latitude === null ? null : Number(latitude);
    const parsedLongitude = longitude === '' || longitude === undefined || longitude === null ? null : Number(longitude);
    const image_url = req.file ? `/uploads/campaigns/${req.file.filename}` : null;

    const campaignId = await CampaignModel.create({
      title,
      description,
      image_url,
      location,
      latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : null,
      longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : null,
      start_date, end_date, status,
      created_by: req.user.id,
    });

    const campaign = await CampaignModel.findById(campaignId);

    await notifyVolunteersSafely({
      title: 'New campaign available',
      message: `${req.user.name} created the campaign "${campaign.title}".`,
      type: 'campaign_created',
    });
    await notifyAdminsSafely({
      title: 'Campaign created',
      message: `${req.user.name} created the campaign "${campaign.title}".`,
      type: 'campaign_created',
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully.',
      data: { campaign },
    });
  } catch (error) {
    next(error);
  }
};

const getManageableCampaigns = async (req, res, next) => {
  try {
    const campaigns = await CampaignModel.findManageable({ user: req.user });

    res.status(200).json({
      success: true,
      data: { campaigns },
    });
  } catch (error) {
    next(error);
  }
};

const updateCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['draft', 'active', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign status.',
      });
    }

    const campaign = await CampaignModel.findById(id);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const updatedCampaign = await CampaignModel.updateStatus(id, status);

    await notifyVolunteersSafely({
      title: 'Campaign status changed',
      message: `${req.user.name} changed "${updatedCampaign.title}" to ${status}.`,
      type: 'campaign_status',
    });
    await notifyAdminsSafely({
      title: 'Campaign status changed',
      message: `${req.user.name} changed "${updatedCampaign.title}" to ${status}.`,
      type: 'campaign_status',
    });

    res.status(200).json({
      success: true,
      message: 'Campaign status updated successfully.',
      data: { campaign: updatedCampaign },
    });
  } catch (error) {
    next(error);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, location, latitude, longitude, start_date, end_date, status } = req.body;
    const allowedStatuses = ['draft', 'active', 'completed', 'cancelled'];

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign status.' });
    }

    const existingCampaign = await CampaignModel.findById(id);
    const accessError = ensureCampaignAccess(existingCampaign, req.user);
    if (accessError) {
      if (req.file) deleteUploadedFile(`/uploads/campaigns/${req.file.filename}`);
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const parsedLatitude = latitude === '' || latitude === undefined || latitude === null ? null : Number(latitude);
    const parsedLongitude = longitude === '' || longitude === undefined || longitude === null ? null : Number(longitude);
    const image_url = req.file ? `/uploads/campaigns/${req.file.filename}` : existingCampaign.image_url;

    const updatedCampaign = await CampaignModel.update(id, {
      title,
      description,
      image_url,
      location,
      latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : null,
      longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : null,
      start_date,
      end_date,
      status,
    });

    if (req.file && existingCampaign.image_url && existingCampaign.image_url !== image_url) {
      deleteUploadedFile(existingCampaign.image_url);
    }

    await notifyVolunteersSafely({
      title: 'Campaign updated',
      message: `${req.user.name} updated the campaign "${updatedCampaign.title}".`,
      type: 'campaign_updated',
    });
    await notifyAdminsSafely({
      title: 'Campaign updated',
      message: `${req.user.name} updated the campaign "${updatedCampaign.title}".`,
      type: 'campaign_updated',
    });

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully.',
      data: { campaign: updatedCampaign },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    await CampaignModel.delete(id);
    deleteUploadedFile(campaign.image_url);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  getManageableCampaigns,
  updateCampaignStatus,
  updateCampaign,
  deleteCampaign,
};
