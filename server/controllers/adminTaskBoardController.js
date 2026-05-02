const CampaignModel = require('../models/Campaign');
const MissionModel = require('../models/Mission');
const MissionTaskModel = require('../models/MissionTask');
const TaskAssignmentModel = require('../models/TaskAssignment');
const { notifyUsers } = require('../services/notificationService');

const normalizeTaskId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const notifyUsersSafely = async (payload) => {
  try {
    await notifyUsers(payload);
  } catch (error) {
    console.error('Failed to send task assignment notification:', error.message);
  }
};

const buildBoard = async (missionId) => {
  const tasks = await MissionTaskModel.findByMissionId(missionId);
  const assignments = (await TaskAssignmentModel.findByMissionId(missionId))
    .filter((assignment) => assignment.status !== 'cancelled');

  return {
    summary: {
      task_count: tasks.length,
      accepted_volunteers: assignments.length,
      assigned_to_tasks: assignments.filter((assignment) => assignment.task_id).length,
      unassigned_volunteers: assignments.filter((assignment) => !assignment.task_id).length,
    },
    unassigned_volunteers: assignments.filter((assignment) => !assignment.task_id),
    tasks: tasks.map((task) => ({
      ...task,
      volunteers: assignments.filter((assignment) => Number(assignment.task_id) === Number(task.id)),
    })),
  };
};

const getMissionTaskBoard = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const mission = await MissionModel.findById(missionId);

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

    const board = await buildBoard(missionId);

    res.status(200).json({
      success: true,
      data: {
        campaign,
        mission,
        ...board,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateMissionTaskAssignment = async (req, res, next) => {
  try {
    const { missionId, assignmentId } = req.params;
    const nextTaskId = normalizeTaskId(req.body.taskId);

    if (Number.isNaN(nextTaskId)) {
      return res.status(400).json({
        success: false,
        message: 'taskId must be a valid integer or null.',
      });
    }

    const mission = await MissionModel.findById(missionId);
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

    const assignment = await TaskAssignmentModel.findById(assignmentId);
    if (!assignment || Number(assignment.mission_id) !== Number(missionId)) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found for this mission.',
      });
    }

    if (assignment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled assignments cannot be moved.',
      });
    }

    let task = null;
    if (nextTaskId !== null) {
      task = await MissionTaskModel.findById(nextTaskId);
      if (!task || Number(task.mission_id) !== Number(missionId)) {
        return res.status(404).json({
          success: false,
          message: 'Task not found for this mission.',
        });
      }

      if (task.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Cancelled tasks cannot receive volunteers.',
        });
      }

      const taskAlreadySelected = Number(assignment.task_id) === Number(task.id);
      if (
        !taskAlreadySelected
        && Number(task.required_volunteers) > 0
        && Number(task.assigned_count || 0) >= Number(task.required_volunteers)
      ) {
        return res.status(400).json({
          success: false,
          message: 'This task is already full.',
        });
      }
    }

    const updatedAssignment = await TaskAssignmentModel.updatePlacement(assignmentId, {
      taskId: task ? task.id : null,
      assignedBy: req.user.id,
      roleInTask: task ? task.title : null,
    });

    await notifyUsersSafely({
      title: task ? 'New task assigned' : 'Task assignment updated',
      message: task
        ? `You have been assigned to "${task.title}" in the mission "${mission.title}" for "${campaign.title}".`
        : `Your task placement for the mission "${mission.title}" in "${campaign.title}" has been cleared for reassignment.`,
      type: 'task_assignment',
      userIds: [assignment.user_id],
    });

    res.status(200).json({
      success: true,
      message: task
        ? `Volunteer assigned to "${task.title}".`
        : 'Volunteer moved back to the unassigned pool.',
      data: {
        assignment: updatedAssignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMissionTaskBoard,
  updateMissionTaskAssignment,
};
