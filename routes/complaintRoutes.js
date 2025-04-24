const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const complaintController = require('../controllers/complaintController');
const fileUploadService = require('../services/fileUploadService');

// Configure multer using the storage engine from the service
const upload = multer({ storage: fileUploadService.getMulterStorage() });

// GET /api/complaints/history - Get complaint history for current user
router.get('/history', auth, complaintController.getComplaintHistory);

// POST /api/complaints - Submit a new complaint ticket
router.post('/', auth, upload.array('attachments', 5), complaintController.submitComplaint);

// GET /api/complaints/:id - Get complaint ticket by ID
router.get('/:id', auth, complaintController.getComplaintById);

// PUT /api/complaints/:id/status - Update complaint status (admin only)
router.put('/:id/status', auth, complaintController.updateComplaintStatus);

// GET /api/complaints - Get all complaints (admin only)
router.get('/', auth, complaintController.getAllComplaints);

module.exports = router; 