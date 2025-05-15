// middlewares/fileUpload.js
const multer = require('multer');

// Use memory storage for all environments since we store files in MongoDB
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = {
  singleUpload: upload.single('attachment'), // For Claim routes
  multipleUpload: upload.array('attachments', 5) // For SpecialClaim routes, max 5 files
};