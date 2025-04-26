const express = require('express');
const router = express.Router();
const {
  getAllSleepData,
  getSleepDataByEmployeeId,
  createSleepData,
  updateSleepData,
  deleteSleepData
} = require('../controllers/sleepController');

// @route   GET /api/sleep
// @desc    Get all sleep data
// @access  Private/Admin
router.get('/', getAllSleepData);

// @route   GET /api/sleep/employee/:employeeId
// @desc    Get sleep data by employee ID
// @access  Private
router.get('/employee/:employeeId', getSleepDataByEmployeeId);

// @route   POST /api/sleep
// @desc    Create sleep data
// @access  Private
router.post('/', createSleepData);

// @route   PUT /api/sleep/:id
// @desc    Update sleep data
// @access  Private
router.put('/:id', updateSleepData);

// @route   DELETE /api/sleep/:id
// @desc    Delete sleep data
// @access  Private
router.delete('/:id', deleteSleepData);

module.exports = router; 