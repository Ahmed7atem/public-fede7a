const express = require('express');
const router = express.Router();
const {
  getAllPolicies,
  getPolicyById,
  getPolicyByEmployeeId
} = require('../controllers/policyController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/policies
// @desc    Get all policies
// @access  Private/Admin
router.get('/', protect, admin, getAllPolicies);

// @route   GET /api/policies/:id
// @desc    Get policy by ID
// @access  Private
router.get('/:id', protect, getPolicyById);

// @route   GET /api/policies/employee/:employeeId
// @desc    Get policy by employee ID
// @access  Private
router.get('/employee/:employeeId', protect, getPolicyByEmployeeId);

module.exports = router; 