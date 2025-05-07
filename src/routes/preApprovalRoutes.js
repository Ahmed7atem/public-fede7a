const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByPatientId,
  createPreApproval,
  updatePreApprovalStatus
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

// @route   GET /api/pre-approvals/patient/:patientId
// @desc    Get pre-approval requests by patient ID
// @access  Private
router.get('/patient/:patientId', protect, getPreApprovalsByPatientId);

// @route   POST /api/pre-approvals
// @desc    Create a new pre-approval request with documents
// @access  Private
router.post('/', protect, upload.array('documents', 5), createPreApproval);

// @route   PUT /api/pre-approvals/:id/status
// @desc    Update pre-approval request status
// @access  Private/Admin
router.put('/:id/status', protect, admin, updatePreApprovalStatus);

module.exports = router; 