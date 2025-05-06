const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload');
const {
  getAllClaims,
  getClaimById,
  getClaimsByEmployeeId,
  createClaim,
  updateClaim,
  deleteClaim
} = require('../controllers/claimController');

// @route   GET /api/claims
// @desc    Get all claims
// @access  Private/Admin
router.get('/', getAllClaims);

// @route   GET /api/claims/:id
// @desc    Get claim by ID
// @access  Private
router.get('/:id', getClaimById);

// @route   GET /api/claims/employee/:employeeId
// @desc    Get claims by employee ID
// @access  Private
router.get('/employee/:employeeId', getClaimsByEmployeeId);

// @route   POST /api/claims
// @desc    Create a new claim with attachment
// @access  Private
router.post('/', upload.single('attachment'), createClaim);

// @route   PUT /api/claims/:id
// @desc    Update a claim
// @access  Private/Admin
router.put('/:id', updateClaim);

// @route   DELETE /api/claims/:id
// @desc    Delete a claim
// @access  Private/Admin
router.delete('/:id', deleteClaim);

module.exports = router; 