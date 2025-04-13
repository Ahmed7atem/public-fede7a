const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

// All report routes require authentication
router.get('/health-summary/:employeeId', auth, reportController.getHealthSummary);
router.get('/wearable-trends/:employeeId', auth, reportController.getWearableTrends);
router.get('/sleep-analysis/:employeeId', auth, reportController.getSleepAnalysis);
router.get('/recommendations/activity/:employeeId', auth, reportController.getActivityRecommendations);
router.get('/health-alerts/:employeeId', auth, reportController.getHealthAlerts);
router.post('/feedback', reportController.submitFeedbackTicket);

module.exports = router;