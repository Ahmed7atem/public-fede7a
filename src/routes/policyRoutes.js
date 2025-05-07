const express = require('express');
const router = express.Router();
const {
  getAllPolicies,
  getPolicyById,
  getPolicyByEmployeeId,
  createPolicy,
  updatePolicy,
  deletePolicy
} = require('../controllers/policyController');
const { protect, admin } = require('../middleware/auth');

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

// @route   POST /api/policies
// @desc    Create a new policy
// @access  Private/Admin
router.post('/', protect, admin, createPolicy);

// @route   PUT /api/policies/:id
// @desc    Update a policy
// @access  Private/Admin
router.put('/:id', protect, admin, updatePolicy);

// @route   DELETE /api/policies/:id
// @desc    Delete a policy
// @access  Private/Admin
router.delete('/:id', protect, admin, deletePolicy);

module.exports = router; 