const { pool } = require('../config/database');
const CampaignModel = require('../models/Campaign');
const MissionModel = require('../models/Mission');
const TaskAssignmentModel = require('../models/TaskAssignment');
const VolunteerApplicationModel = require('../models/VolunteerApplication');
const { notifyUsers } = require('../services/notificationService');

const reviewableStatuses = ['accepted', 'rejected'];

const notifyUsersSafely = async (payload) => {
  try {
    await notifyUsers(payload);
  } catch (error) {
    console.error('Failed to send targeted notifications:', error.message);
  }
};

const getMissionApplications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const allowedFilters = ['all', 'pending', 'accepted', 'rejected', 'cancelled'];

    if (!allowedFilters.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status filter.',
      });
    }

    const applications = await VolunteerApplicationModel.findAllForAdmin({ status });

    res.status(200).json({
      success: true,
      data: { applications },
    });
  } catch (error) {
    next(error);
  }
};

const reviewMissionApplication = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { status } = req.body;

    if (!reviewableStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Applications can only be accepted or rejected here.',
      });
    }

    const application = await VolunteerApplicationModel.findById(id, connection);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending applications can be reviewed. This one is already ${application.status}.`,
      });
    }

    const mission = await MissionModel.findById(application.mission_id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found.',
      });
    }

    const campaign = await CampaignModel.findById(mission.campaign_id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.',
      });
    }

    if (status === 'accepted') {
      if (campaign.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Only missions inside active campaigns can accept volunteers.',
        });
      }

      if (!['open', 'in_progress'].includes(mission.status)) {
        return res.status(400).json({
          success: false,
          message: 'This mission is not currently accepting approved volunteers.',
        });
      }

      if (Number(mission.required_volunteers) > 0 && Number(mission.assigned_count || 0) >= Number(mission.required_volunteers)) {
        return res.status(400).json({
          success: false,
          message: 'This mission is already full.',
        });
      }
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const updatedApplication = await VolunteerApplicationModel.updateStatus(id, status, connection);
    let assignment = null;

    if (status === 'accepted') {
      const existingAssignment = await TaskAssignmentModel.findByUserAndMission(application.user_id, application.mission_id, connection);
      assignment = existingAssignment || await TaskAssignmentModel.create({
        userId: application.user_id,
        missionId: application.mission_id,
        assignedBy: req.user.id,
      }, connection);
    }

    await connection.commit();

    await notifyUsersSafely({
      title: status === 'accepted' ? 'Application accepted' : 'Application rejected',
      message: status === 'accepted'
        ? `Your request for the mission "${mission.title}" in "${campaign.title}" has been accepted.`
        : `Your request for the mission "${mission.title}" in "${campaign.title}" has been rejected.`,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      userIds: [application.user_id],
    });

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully.`,
      data: {
        application: updatedApplication,
        assignment,
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
  getMissionApplications,
  reviewMissionApplication,
};
