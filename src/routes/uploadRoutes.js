const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../../api/middlewares/authMiddleware');
const {
  uploadFile,
  getFile,
  getFileMetadata,
  getFilesByType,
  deleteFile
} = require('../controllers/uploadController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload routes
router.post('/', protect, upload.single('file'), uploadFile);
router.get('/:id', protect, getFile);
router.get('/metadata/:id', protect, getFileMetadata);
router.get('/type/:type', protect, getFilesByType);
router.delete('/:id', protect, deleteFile);

module.exports = router; 