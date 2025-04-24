const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// Custom error class for file size errors
class FileSizeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FileSizeError';
    this.status = 413; // Payload Too Large
  }
}

// Custom error class for file type errors
class FileTypeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FileTypeError';
    this.status = 415; // Unsupported Media Type
  }
}

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
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
            uploadDate: new Date(),
            contentType: file.mimetype
          }
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit (leaving 1MB buffer)
  },
  fileFilter: (req, file, cb) => {
    // Check file size
    if (file.size > 15 * 1024 * 1024) {
      return cb(new FileSizeError('File size exceeds 15MB limit'));
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new FileTypeError('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
    
    cb(null, true);
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof FileSizeError) {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds 15MB limit',
      maxSize: '15MB'
    });
  }
  
  if (err instanceof FileTypeError) {
    return res.status(415).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.',
      allowedTypes: ['JPEG', 'PNG', 'GIF', 'PDF']
    });
  }
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: err.message
    });
  }
  
  next(err);
};

module.exports = { upload, handleUploadError }; 