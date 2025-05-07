const express = require('express');
const router = express.Router();
const {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts,
  getAllData,
  getAllEmployeesData
} = require('../controllers/analyticsController');

// @route   GET /api/analytics/employee/:id
// @desc    Get employee analytics
// @access  Public
router.get('/employee/:id', getEmployeeAnalytics);

// @route   GET /api/analytics/organization
// @desc    Get organization analytics
// @access  Public
router.get('/organization', getOrganizationAnalytics);

// @route   GET /api/analytics/alerts
// @desc    Get health alerts
// @access  Public
router.get('/alerts', getHealthAlerts);

// @route   GET /api/analytics/all
// @desc    Get comprehensive data for all employees
// @access  Public
router.get('/all', getAllData);

// @route   GET /api/analytics/employees
// @desc    Get all employee data
// @access  Public
router.get('/employees', getAllEmployeesData);

module.exports = router; 