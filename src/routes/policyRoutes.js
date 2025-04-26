const express = require('express');
const router = express.Router();
const {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy
} = require('../controllers/policyController');

// @route   GET /api/policies
// @desc    Get all policies
// @access  Private/Admin
router.get('/', getAllPolicies);

// @route   GET /api/policies/:id
// @desc    Get policy by ID
// @access  Private
router.get('/:id', getPolicyById);

// @route   POST /api/policies
// @desc    Create a new policy
// @access  Private/Admin
router.post('/', createPolicy);

// @route   PUT /api/policies/:id
// @desc    Update a policy
// @access  Private/Admin
router.put('/:id', updatePolicy);

// @route   DELETE /api/policies/:id
// @desc    Delete a policy
// @access  Private/Admin
router.delete('/:id', deletePolicy);

module.exports = router; 