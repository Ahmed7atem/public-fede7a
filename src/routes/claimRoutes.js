// routes/claimRoutes.js
const express = require('express');
const router = express.Router();
const { singleUpload, multipleUpload } = require('../middlewares/fileUpload');
const { check } = require('express-validator');
const {
  getAllClaims,
  getClaimById,
  getClaimsByEmployeeId,
  createClaim,
  createSpecialClaim,
  updateClaim,
  deleteClaim,
  getSpecialClaims,
  getSpecialClaimsByEmployeeId,
  getClaimsByYear,
  getEmployeeClaimsByYear
} = require('../controllers/claimController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET /api/claims
// @desc    Get all claims
// @access  Private/Admin
router.get('/', getAllClaims);

// @route   GET /api/claims/special
// @desc    Get special claims with filtering options
// @access  Private/Admin
router.get('/special', protect, admin, getSpecialClaims);

// @route   GET /api/claims/:id
// @desc    Get claim by ID
// @access  Private
router.get('/:id', getClaimById);

// @route   GET /api/claims/employee/:employeeId
// @desc    Get claims by employee ID
// @access  Private
router.get('/employee/:employeeId', getClaimsByEmployeeId);

// @route   GET /api/claims/special/employee/:employeeId
// @desc    Get special claims by employee ID
// @access  Private
router.get('/special/employee/:employeeId', protect, getSpecialClaimsByEmployeeId);

// @route   GET /api/claims/year/:year
// @desc    Get claims by year
// @access  Private/Admin
router.get('/year/:year', protect, admin, getClaimsByYear);

// @route   GET /api/claims/year/:year/employee/:employeeId
// @desc    Get employee claims by year
// @access  Private
router.get('/year/:year/employee/:employeeId', protect, getEmployeeClaimsByYear);

// @route   POST /api/claims
// @desc    Create a new claim with attachment
// @access  Private
router.post('/', singleUpload, createClaim);

// @route   POST /api/special-claims
// @desc    Create a new special claim with multiple attachments
// @access  Private
router.post(
  '/special-claims',
  multipleUpload,
  [
    check('policyNumber').notEmpty().withMessage('Policy number is required'),
    check('policyHolderName').notEmpty().withMessage('Policy holder name is required'),
    check('employeeId').notEmpty().withMessage('Employee ID is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('number').notEmpty().withMessage('Contact number is required'),
    check('claimFor').notEmpty().withMessage('Claim for is required'),
    check('claimForId').notEmpty().withMessage('Claim for ID is required'),
    check('country').notEmpty().withMessage('Country is required'),
    check('claimAmount').isFloat({ min: 0 }).withMessage('Valid claim amount is required'),
    check('currency').notEmpty().withMessage('Currency is required'),
    check('dateOfTreatment').isISO8601().toDate().withMessage('Valid date of treatment is required'),
    check('paymentMethod').notEmpty().withMessage('Payment method is required'),
    check('bankName').notEmpty().withMessage('Bank name is required'),
    check('branchName').notEmpty().withMessage('Branch name is required'),
    check('accountNumber').notEmpty().withMessage('Account number is required'),
    check('swiftCode').notEmpty().withMessage('SWIFT code is required'),
    check('iban').notEmpty().withMessage('IBAN is required'),
  ],
  createSpecialClaim
);

// @route   PUT /api/claims/:id
// @desc    Update a claim
// @access  Private/Admin
router.put('/:id', updateClaim);

// @route   DELETE /api/claims/:id
// @desc    Delete a claim
// @access  Private/Admin
router.delete('/:id', deleteClaim);

module.exports = router;