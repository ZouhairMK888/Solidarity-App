const CampaignModel = require('../models/Campaign');
const MissionModel = require('../models/Mission');

const allowedMissionStatuses = ['open', 'in_progress', 'completed', 'cancelled'];

const ensureCampaignAccess = (campaign, user) => {
  if (!campaign) {
    return { status: 404, message: 'Campaign not found.' };
  }

  if (user.role === 'organizer' && Number(campaign.created_by) !== Number(user.id)) {
    return { status: 403, message: 'You can only manage missions for campaigns you created.' };
  }

  return null;
};

const ensureMissionInCampaign = (mission, campaignId) => {
  if (!mission || Number(mission.campaign_id) !== Number(campaignId)) {
    return { status: 404, message: 'Mission not found for this campaign.' };
  }

  return null;
};

const normalizeRequiredVolunteers = (value) => {
  if (value === undefined || value === null || value === '') return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const getCampaignMissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    const missions = await MissionModel.findByCampaignId(id, req.user?.id);

    res.status(200).json({
      success: true,
      data: { missions },
    });
  } catch (error) {
    next(error);
  }
};

const createMission = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;
    const { title, description, required_volunteers, location, mission_date, status } = req.body;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Mission title is required.',
      });
    }

    const volunteersNeeded = normalizeRequiredVolunteers(required_volunteers);
    if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'required_volunteers must be a whole number greater than 0.',
      });
    }

    if (status && !allowedMissionStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mission status.',
      });
    }

    const missionId = await MissionModel.create(campaignId, {
      title,
      description,
      required_volunteers: volunteersNeeded,
      location,
      mission_date,
      status,
    });

    const mission = await MissionModel.findById(missionId);

    res.status(201).json({
      success: true,
      message: 'Mission created successfully.',
      data: { mission },
    });
  } catch (error) {
    next(error);
  }
};

const updateMission = async (req, res, next) => {
  try {
    const { id: campaignId, missionId } = req.params;
    const { title, description, required_volunteers, location, mission_date, status } = req.body;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const existingMission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(existingMission, campaignId);
    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Mission title is required.',
      });
    }

    const volunteersNeeded = normalizeRequiredVolunteers(required_volunteers);
    if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'required_volunteers must be a whole number greater than 0.',
      });
    }

    if (status && !allowedMissionStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mission status.',
      });
    }

    const mission = await MissionModel.update(missionId, {
      title,
      description,
      required_volunteers: volunteersNeeded,
      location,
      mission_date,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Mission updated successfully.',
      data: { mission },
    });
  } catch (error) {
    next(error);
  }
};

const updateMissionStatus = async (req, res, next) => {
  try {
    const { id: campaignId, missionId } = req.params;
    const { status } = req.body;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const existingMission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(existingMission, campaignId);
    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    if (!allowedMissionStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mission status.',
      });
    }

    const mission = await MissionModel.updateStatus(missionId, status);

    res.status(200).json({
      success: true,
      message: 'Mission status updated successfully.',
      data: { mission },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMission = async (req, res, next) => {
  try {
    const { id: campaignId, missionId } = req.params;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const existingMission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(existingMission, campaignId);
    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    await MissionModel.delete(missionId);

    res.status(200).json({
      success: true,
      message: 'Mission deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaignMissions,
  createMission,
  updateMission,
  updateMissionStatus,
  deleteMission,
};
