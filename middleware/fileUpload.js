const multer = require('multer');
const fileUploadService = require('../services/fileUploadService');

// Configure multer for file uploads
const upload = multer({
  storage: fileUploadService.getMulterStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'text/html',
      'text/xml',
      'application/json',
      'application/xml'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('Invalid file type:', file.mimetype);
      cb(new Error('Invalid file type. Only images, PDFs, office documents, and text files are allowed.'));
    }
  }
});

module.exports = upload; 