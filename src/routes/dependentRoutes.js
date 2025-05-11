const express = require('express');
const router = express.Router();
const {
  getAllDependents,
  getDependentsByEmployeeId
} = require('../controllers/dependentController');

// @route   GET /api/dependents
// @desc    Get all dependents
// @access  Public
router.get('/', getAllDependents);

// @route   GET /api/dependents/employee/:employeeId
// @desc    Get dependents by employee ID
// @access  Public
router.get('/employee/:employeeId', getDependentsByEmployeeId);

module.exports = router; 