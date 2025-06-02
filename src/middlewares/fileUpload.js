// middlewares/fileUpload.js
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

// Create GridFS storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          metadata: {
            originalName: file.originalname,
            uploadedBy: req.user?.id || 'anonymous',
            type: req.body.type || 'general',
            referenceId: req.body.referenceId || null,
            contentType: file.mimetype,
            uploadDate: new Date()
          }
        };
        resolve(fileInfo);
      });
    });
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and common document types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and common document types are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for all uploads
  }
});

module.exports = {
  singleUpload: upload.single('attachment'), // For Claim routes
  multipleUpload: upload.array('attachments', 5) // For SpecialClaim routes, max 5 files
};