const CampaignModel = require('../models/Campaign');
const MissionModel = require('../models/Mission');
const VolunteerApplicationModel = require('../models/VolunteerApplication');
const UserModel = require('../models/User');
const { notifyActiveAdmins, notifyUsers } = require('../services/notificationService');

const notifyUsersSafely = async (payload) => {
  try {
    await notifyUsers(payload);
  } catch (error) {
    console.error('Failed to send targeted notifications:', error.message);
  }
};

const notifyAdminsSafely = async (payload) => {
  try {
    await notifyActiveAdmins(payload);
  } catch (error) {
    console.error('Failed to send admin notifications:', error.message);
  }
};

const applyToMission = async (req, res, next) => {
  try {
    const { id: campaignId, missionId } = req.params;
    const { motivation } = req.body || {};

    const campaign = await CampaignModel.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Applications are only available for active campaigns.',
      });
    }

    const mission = await MissionModel.findById(missionId, req.user.id);
    if (!mission || Number(mission.campaign_id) !== Number(campaignId)) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found for this campaign.',
      });
    }

    if (mission.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This mission is not open for applications.',
      });
    }

    if (Number(mission.required_volunteers) > 0 && Number(mission.assigned_count || 0) >= Number(mission.required_volunteers)) {
      return res.status(400).json({
        success: false,
        message: 'This mission is already full.',
      });
    }

    const existingApplication = await VolunteerApplicationModel.findByUserAndMission(req.user.id, missionId);
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existingApplication.status} application for this mission.`,
      });
    }

    const application = await VolunteerApplicationModel.create({
      userId: req.user.id,
      missionId,
      motivation,
    });

    await Promise.all([
      notifyAdminsSafely({
        title: 'New mission application',
        message: `${req.user.name} applied to the mission "${mission.title}" in "${campaign.title}".`,
        type: 'application_submitted',
      }),
      (async () => {
        const campaignOwner = await UserModel.findById(campaign.created_by);

        if (!campaignOwner || campaignOwner.role === 'admin') {
          return 0;
        }

        return notifyUsersSafely({
          title: 'New mission application',
          message: `${req.user.name} applied to the mission "${mission.title}" in "${campaign.title}".`,
          type: 'application_submitted',
          userIds: [campaign.created_by],
        });
      })(),
    ]);

    const updatedMission = await MissionModel.findById(missionId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Mission application submitted successfully.',
      data: {
        application,
        mission: updatedMission,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyToMission };
