const express = require('express');
const router = express.Router();
const {
  getAllHealthData,
  getHealthDataByYear,
  getHealthDataByEmployeeId,
  createHealthData,
  updateHealthData,
  deleteHealthData
} = require('../controllers/healthController');

// @route   GET /api/health
// @desc    Get all health data
// @access  Private/Admin
router.get('/', getAllHealthData);

// @route   GET /api/health/year/:year
// @desc    Get health data for a specific year
// @access  Private/Admin
router.get('/year/:year', getHealthDataByYear);

// @route   GET /api/health/employee/:employeeId
// @desc    Get health data by employee ID
// @access  Private
router.get('/employee/:employeeId', getHealthDataByEmployeeId);

// @route   POST /api/health
// @desc    Create health data
// @access  Private/Admin
router.post('/', createHealthData);

// @route   PUT /api/health/:id
// @desc    Update health data
// @access  Private/Admin
router.put('/:id', updateHealthData);

// @route   DELETE /api/health/:id
// @desc    Delete health data
// @access  Private/Admin
router.delete('/:id', deleteHealthData);

module.exports = router; 