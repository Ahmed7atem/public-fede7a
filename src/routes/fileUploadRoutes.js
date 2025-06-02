const express = require('express');
const router = express.Router();
const { protect } = require('../../api/middlewares/authMiddleware');
const {
  upload,
  uploadFile,
  getAllFiles,
  getFilesByType,
  getFilesByEmployeeId,
  getFileById,
  deleteFile,
  updateFileMetadata
} = require('../controllers/fileUploadController');

// Upload a file
router.post('/', protect, upload.single('file'), uploadFile);

// Get all files
router.get('/', protect, getAllFiles);

// Get files by type
router.get('/type/:type', protect, getFilesByType);

// Get files by employee ID
router.get('/employee/:employeeId', protect, getFilesByEmployeeId);

// Update file metadata
router.patch('/:id', protect, updateFileMetadata);

// Delete file
router.delete('/:id', protect, deleteFile);

// Get file by ID (must be last to avoid conflicts)
router.get('/:id', protect, getFileById);

module.exports = router; 