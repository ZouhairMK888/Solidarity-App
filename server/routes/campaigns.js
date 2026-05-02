const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  getManageableCampaigns,
  updateCampaignStatus,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const {
  getCampaignMissions,
  createMission,
  updateMission,
  updateMissionStatus,
  deleteMission,
} = require('../controllers/missionController');
const {
  getMissionTasks,
  createMissionTask,
  updateMissionTask,
  deleteMissionTask,
} = require('../controllers/missionTaskController');
const { applyToMission } = require('../controllers/missionApplicationController');
const {
  applyToOrganizeCampaign,
  getOrganizerApplications,
  reviewOrganizerApplication,
} = require('../controllers/organizerApplicationController');
const {
  getManageableDonations,
  createDonation,
  updateDonation,
  updateDonationStatus,
  deleteDonation,
} = require('../controllers/donationController');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const { uploadCampaignImage } = require('../middleware/upload');

router.get('/', getAllCampaigns);
router.get('/donations/manage', authenticate, getManageableDonations);
router.get('/organizer-applications/manage', authenticate, getOrganizerApplications);
router.get('/manage', authenticate, getManageableCampaigns);
router.get('/:id/missions', optionalAuthenticate, getCampaignMissions);
router.get('/:id/missions/:missionId/tasks', authenticate, getMissionTasks);
router.get('/:id', optionalAuthenticate, getCampaignById);
router.post('/', authenticate, authorize('admin', 'organizer'), uploadCampaignImage.single('image'), createCampaign);
router.post('/:id/organizer-applications', authenticate, applyToOrganizeCampaign);
router.post('/:id/missions', authenticate, createMission);
router.post('/:id/missions/:missionId/tasks', authenticate, createMissionTask);
router.post('/:id/missions/:missionId/apply', authenticate, authorize('volunteer'), applyToMission);
router.post('/:id/donations', optionalAuthenticate, createDonation);
router.put('/donations/:donationId', authenticate, updateDonation);
router.put('/:id', authenticate, uploadCampaignImage.single('image'), updateCampaign);
router.patch('/organizer-applications/:applicationId/status', authenticate, reviewOrganizerApplication);
router.patch('/donations/:donationId/status', authenticate, updateDonationStatus);
router.put('/:id/missions/:missionId', authenticate, updateMission);
router.put('/:id/missions/:missionId/tasks/:taskId', authenticate, updateMissionTask);
router.patch('/:id/status', authenticate, updateCampaignStatus);
router.patch('/:id/missions/:missionId/status', authenticate, updateMissionStatus);
router.delete('/donations/:donationId', authenticate, deleteDonation);
router.delete('/:id', authenticate, deleteCampaign);
router.delete('/:id/missions/:missionId', authenticate, deleteMission);
router.delete('/:id/missions/:missionId/tasks/:taskId', authenticate, deleteMissionTask);

module.exports = router;
