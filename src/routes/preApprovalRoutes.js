const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllPreApprovals,
  getPreApprovalById,
  createPreApproval,
  updatePreApproval,
  getPreApprovalsByEmployeeId,
  deletePreApproval
} = require('../controllers/preApprovalController');
const { protect, admin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `pre-approval-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  }
});

// @route   GET /api/pre-approvals
// @desc    Get all pre-approval requests
// @access  Private/Admin
router.get('/', protect, admin, getAllPreApprovals);

// @route   GET /api/pre-approvals/:id
// @desc    Get pre-approval request by ID
// @access  Private
router.get('/:id', protect, getPreApprovalById);

// @route   GET /api/pre-approvals/employee/:employeeId
// @desc    Get pre-approval requests by employee ID
// @access  Private
router.get('/employee/:employeeId', protect, getPreApprovalsByEmployeeId);

// @route   POST /api/pre-approvals
// @desc    Create a new pre-approval request with optional attachments
// @access  Private
router.post('/', protect, upload.array('attachments', 5), createPreApproval);

// @route   PUT /api/pre-approvals/:id
// @desc    Update pre-approval request status
// @access  Private/Admin
router.put('/:id', protect, admin, updatePreApproval);

// @route   DELETE /api/pre-approvals/:id
// @desc    Delete pre-approval request
// @access  Private/Admin
router.delete('/:id', protect, admin, deletePreApproval);

module.exports = router; 