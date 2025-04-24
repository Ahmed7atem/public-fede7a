const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const attachmentController = require('../controllers/attachmentController');
const { auth } = require('../middleware/auth');

// Upload files
router.post('/upload', 
  auth,
  upload.array('files', 5),
  attachmentController.uploadFiles
);

// Download a file
router.get('/download/:id',
  auth,
  attachmentController.downloadFile
);

// Get file metadata
router.get('/metadata/:id',
  auth,
  attachmentController.getFileMetadata
);

// Delete a file
router.delete('/:id',
  auth,
  attachmentController.deleteFile
);

// Get all attachments for a specific reference
router.get('/:type/:referenceId',
  auth,
  attachmentController.getAttachments
);

module.exports = router; 