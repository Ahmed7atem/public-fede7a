const express = require('express');
const router = express.Router();
const {
  getAllDependents,
  getDependentsByEmployeeId
} = require('../controllers/claimController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET /api/dependents
// @desc    Get all dependents
// @access  Private/Admin
router.get('/', protect, admin, getAllDependents);

// @route   GET /api/dependents/employee/:employeeId
// @desc    Get dependents by employee ID
// @access  Private
router.get('/employee/:employeeId', protect, getDependentsByEmployeeId);

module.exports = router; 