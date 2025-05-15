const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllComplaints,
  getComplaintById,
  getComplaintsByEmployeeId,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../controllers/complaintController');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `complaint-${Date.now()}${path.extname(file.originalname)}`);
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
}).single('attachment');

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
router.post('/', (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type',
        error: err.message
      });
    }
    next();
  });
}, createComplaint);

// @route   PUT /api/complaints/:id
// @desc    Update a complaint
// @access  Private/Admin
router.put('/:id', updateComplaint);

// @route   DELETE /api/complaints/:id
// @desc    Delete a complaint
// @access  Private/Admin
router.delete('/:id', deleteComplaint);

module.exports = router; 