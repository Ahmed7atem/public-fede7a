const express = require('express');
const router = express.Router();
const {
  getAllComplaints,
  getComplaintById,
  getComplaintsByEmployeeId,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../controllers/complaintController');

// @route   GET /api/complaints
// @desc    Get all complaints
// @access  Private/Admin
router.get('/', getAllComplaints);

// @route   GET /api/complaints/employee/:employeeId
// @desc    Get complaints by employee ID
// @access  Private
router.get('/employee/:employeeId', getComplaintsByEmployeeId);

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get('/:id', getComplaintById);

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post('/', createComplaint);

// @route   PUT /api/complaints/:id
// @desc    Update a complaint
// @access  Private/Admin
router.put('/:id', updateComplaint);

// @route   DELETE /api/complaints/:id
// @desc    Delete a complaint
// @access  Private/Admin
router.delete('/:id', deleteComplaint);

module.exports = router; 