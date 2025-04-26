const express = require('express');
const router = express.Router();
const {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts,
  getAllData
} = require('../controllers/analyticsController');

// @route   GET /api/analytics/employee/:id
// @desc    Get employee analytics
// @access  Private/Admin
router.get('/employee/:id', getEmployeeAnalytics);

// @route   GET /api/analytics/organization
// @desc    Get organization analytics
// @access  Private/Admin
router.get('/organization', getOrganizationAnalytics);

// @route   GET /api/analytics/alerts
// @desc    Get health alerts
// @access  Private/Admin
router.get('/alerts', getHealthAlerts);

// @route   GET /api/analytics/all-data
// @desc    Get all data for analytics
// @access  Private/Admin
router.get('/all-data', getAllData);

// @route   GET /api/analytics/all
// @desc    Get comprehensive data for all employees
// @access  Private/Admin
router.get('/all', getAllData);

module.exports = router; 