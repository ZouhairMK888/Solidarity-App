const express = require('express');
const router = express.Router();
const {
  getOverview,
  getUsers,
  createOrganizer,
  updateUserStatus,
  updateUserRole,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const {
  getMissionApplications,
  reviewMissionApplication,
} = require('../controllers/adminApplicationController');
const {
  getMissionTaskBoard,
  updateMissionTaskAssignment,
} = require('../controllers/adminTaskBoardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/mission-applications', getMissionApplications);
router.get('/missions/:missionId/task-board', getMissionTaskBoard);
router.post('/organizers', createOrganizer);
router.patch('/mission-applications/:id/status', reviewMissionApplication);
router.patch('/missions/:missionId/assignments/:assignmentId', updateMissionTaskAssignment);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
