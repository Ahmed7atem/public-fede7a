const express = require('express');
const router = express.Router();
const {
  getAllWearableData,
  getWearableDataByEmployeeId,
  createWearableData,
  updateWearableData,
  deleteWearableData
} = require('../controllers/wearableController');

// @route   GET /api/wearables
// @desc    Get all wearable data
// @access  Private/Admin
router.get('/', getAllWearableData);

// @route   GET /api/wearables/employee/:employeeId
// @desc    Get wearable data by employee ID
// @access  Private
router.get('/employee/:employeeId', getWearableDataByEmployeeId);

// @route   POST /api/wearables
// @desc    Create wearable data
// @access  Private
router.post('/', createWearableData);

// @route   PUT /api/wearables/:id
// @desc    Update wearable data
// @access  Private
router.put('/:id', updateWearableData);

// @route   DELETE /api/wearables/:id
// @desc    Delete wearable data
// @access  Private
router.delete('/:id', deleteWearableData);

module.exports = router; 