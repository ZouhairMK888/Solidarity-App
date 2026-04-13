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
const { applyToMission } = require('../controllers/missionApplicationController');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const { uploadCampaignImage } = require('../middleware/upload');

router.get('/', getAllCampaigns);
router.get('/manage', authenticate, authorize('admin', 'organizer'), getManageableCampaigns);
router.get('/:id/missions', optionalAuthenticate, getCampaignMissions);
router.get('/:id', optionalAuthenticate, getCampaignById);
router.post('/', authenticate, authorize('admin', 'organizer'), uploadCampaignImage.single('image'), createCampaign);
router.post('/:id/missions', authenticate, authorize('admin', 'organizer'), createMission);
router.post('/:id/missions/:missionId/apply', authenticate, authorize('volunteer'), applyToMission);
router.put('/:id', authenticate, authorize('admin', 'organizer'), uploadCampaignImage.single('image'), updateCampaign);
router.put('/:id/missions/:missionId', authenticate, authorize('admin', 'organizer'), updateMission);
router.patch('/:id/status', authenticate, authorize('admin', 'organizer'), updateCampaignStatus);
router.patch('/:id/missions/:missionId/status', authenticate, authorize('admin', 'organizer'), updateMissionStatus);
router.delete('/:id', authenticate, authorize('admin', 'organizer'), deleteCampaign);
router.delete('/:id/missions/:missionId', authenticate, authorize('admin', 'organizer'), deleteMission);

module.exports = router;
