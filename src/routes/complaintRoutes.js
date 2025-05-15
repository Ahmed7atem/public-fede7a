const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  getAllComplaints,
  getComplaintById,
  getComplaintsByEmployeeId,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../controllers/complaintController');

// Configure multer to use memory storage for all environments
// since we'll store files directly in MongoDB
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes
router.route('/')
  .get(protect, admin, getAllComplaints)
  .post(protect, upload.single('attachment'), createComplaint);

router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, admin, updateComplaint)
  .delete(protect, admin, deleteComplaint);

router.get('/employee/:employeeId', protect, getComplaintsByEmployeeId);

module.exports = router; 