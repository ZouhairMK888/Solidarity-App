const CampaignModel = require('../models/Campaign');
const MissionModel = require('../models/Mission');
const MissionTaskModel = require('../models/MissionTask');

const allowedTaskStatuses = ['todo', 'in_progress', 'completed', 'cancelled'];

const ensureCampaignAccess = (campaign, user) => {
  if (!campaign) {
    return { status: 404, message: 'Campaign not found.' };
  }

  if (user.role === 'organizer' && Number(campaign.created_by) !== Number(user.id)) {
    return { status: 403, message: 'You can only manage tasks for campaigns you created.' };
  }

  return null;
};

const ensureMissionInCampaign = (mission, campaignId) => {
  if (!mission || Number(mission.campaign_id) !== Number(campaignId)) {
    return { status: 404, message: 'Mission not found for this campaign.' };
  }

  return null;
};

const ensureTaskInMission = (task, missionId) => {
  if (!task || Number(task.mission_id) !== Number(missionId)) {
    return { status: 404, message: 'Task not found for this mission.' };
  }

  return null;
};

const normalizeRequiredVolunteers = (value) => {
  if (value === undefined || value === null || value === '') return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const getMissionTasks = async (req, res, next) => {
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

    const mission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(mission, campaignId);

    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    const tasks = await MissionTaskModel.findByMissionId(missionId);

    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

const createMissionTask = async (req, res, next) => {
  try {
    const { id: campaignId, missionId } = req.params;
    const { title, description, required_volunteers, status } = req.body;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const mission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(mission, campaignId);

    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const volunteersNeeded = normalizeRequiredVolunteers(required_volunteers);
    if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'required_volunteers must be a whole number greater than 0.',
      });
    }

    if (status && !allowedTaskStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status.',
      });
    }

    const task = await MissionTaskModel.create(missionId, {
      title,
      description,
      required_volunteers: volunteersNeeded,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

const updateMissionTask = async (req, res, next) => {
  try {
    const { id: campaignId, missionId, taskId } = req.params;
    const { title, description, required_volunteers, status } = req.body;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const mission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(mission, campaignId);

    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    const existingTask = await MissionTaskModel.findById(taskId);
    const taskError = ensureTaskInMission(existingTask, missionId);

    if (taskError) {
      return res.status(taskError.status).json({
        success: false,
        message: taskError.message,
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const volunteersNeeded = normalizeRequiredVolunteers(required_volunteers);
    if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'required_volunteers must be a whole number greater than 0.',
      });
    }

    if (status && !allowedTaskStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status.',
      });
    }

    const task = await MissionTaskModel.update(taskId, {
      title,
      description,
      required_volunteers: volunteersNeeded,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMissionTask = async (req, res, next) => {
  try {
    const { id: campaignId, missionId, taskId } = req.params;

    const campaign = await CampaignModel.findById(campaignId);
    const accessError = ensureCampaignAccess(campaign, req.user);

    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.message,
      });
    }

    const mission = await MissionModel.findById(missionId);
    const missionError = ensureMissionInCampaign(mission, campaignId);

    if (missionError) {
      return res.status(missionError.status).json({
        success: false,
        message: missionError.message,
      });
    }

    const existingTask = await MissionTaskModel.findById(taskId);
    const taskError = ensureTaskInMission(existingTask, missionId);

    if (taskError) {
      return res.status(taskError.status).json({
        success: false,
        message: taskError.message,
      });
    }

    await MissionTaskModel.delete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMissionTasks,
  createMissionTask,
  updateMissionTask,
  deleteMissionTask,
};
