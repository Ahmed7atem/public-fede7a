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
const { protect, admin } = require('../middleware/authMiddleware');

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

// Routes
router.get('/', protect, admin, getAllPreApprovals);
router.get('/:id', protect, getPreApprovalById);
router.get('/patient/:patientId', protect, getPreApprovalsByPatientId);
router.post('/', protect, upload.array('documents', 5), createPreApproval);
router.put('/:id/status', protect, admin, updatePreApprovalStatus);

module.exports = router; 