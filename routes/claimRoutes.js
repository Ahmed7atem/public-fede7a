const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const claimController = require('../controllers/claimController');
const fileUploadService = require('../services/fileUploadService'); // Import the service
const { auth } = require('../middleware/auth'); // Ensure auth is destructured if needed

// Configure multer using the storage engine from the service
const upload = multer({ storage: fileUploadService.getMulterStorage() });

// GET /api/claims/history - Get claim history for current user
router.get('/history',
  auth,
  claimController.getClaimHistory
);

// POST /api/claims/pre-approval - Submit claim pre-approval
router.post('/pre-approval',
  auth,
  upload.array('documents', 5),
  claimController.submitPreApproval
);

// POST /api/claims - Submit claim with attachments
router.post('/',
  auth,
  upload.array('documents', 5),
  claimController.submitClaim
);

// GET /api/claims - Get all claims
router.get('/',
  auth,
  claimController.getClaims
);

// GET /api/claims/:id - Get claim by ID
router.get('/:id',
  auth,
  claimController.getClaimById
);

// PUT /api/claims/:id/status - Update claim status
router.put('/:id/status',
  auth,
  claimController.updateClaimStatus
);

module.exports = router; 