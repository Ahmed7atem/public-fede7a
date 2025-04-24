const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const claimController = require('../controllers/claimController');
const fileUploadService = require('../services/fileUploadService'); // Import the service
const { auth } = require('../middleware/auth'); // Ensure auth is destructured if needed

// Configure multer using the storage engine from the service
const upload = multer({ storage: fileUploadService.getMulterStorage() });

// Submit claim with attachments
router.post('/',
  auth,
  upload.array('files', 5), // Now this should work
  claimController.submitClaim
);

// Get all claims
router.get('/',
  auth,
  claimController.getClaims
);

// Get claim by ID
router.get('/:id',
  auth,
  claimController.getClaimById
);

// Update claim status
router.put('/:id/status',
  auth,
  claimController.updateClaimStatus
);

module.exports = router; 