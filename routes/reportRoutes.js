const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/health-summary/:employeeId', reportController.getHealthSummary);
router.get('/wearable-trends/:employeeId', reportController.getWearableTrends);
router.get('/sleep-analysis/:employeeId', reportController.getSleepAnalysis);
router.get('/recommendations/activity/:employeeId', reportController.getActivityRecommendations);
router.get('/health-alerts/:employeeId', reportController.getHealthAlerts);
router.post('/feedback', reportController.submitFeedbackTicket);

module.exports = router;