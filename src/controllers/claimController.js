// controllers/claimController.js
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const SpecialClaim = require('../../models/SpecialClaim');

// Define Claim Schema
const claimSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  providerId: {
    type: String,
    required: true,
    ref: 'Provider'
  },
  serviceDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  attachment: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
claimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create Claim model
const Claim = mongoose.models.Claim || mongoose.model('Claim', claimSchema);

/**
 * @desc    Get all claims
 * @route   GET /api/claims
 * @access  Private/Admin
 */
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find().limit(10).lean();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
};

/**
 * @desc    Get claim by ID
 * @route   GET /api/claims/:id
 * @access  Private
 */
const getClaimById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const claim = await Claim.findOne({ patientId: employeeId }).lean();
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ message: 'Error fetching claim', error: error.message });
  }
};

/**
 * @desc    Get claims by employee ID
 * @route   GET /api/claims/employee/:employeeId
 * @access  Private
 */
const getClaimsByEmployeeId = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const claims = await Claim.find({ patientId: employeeId }).lean();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching employee claims:', error);
    res.status(500).json({ message: 'Error fetching employee claims', error: error.message });
  }
};

/**
 * @desc    Create a new claim
 * @route   POST /api/claims
 * @access  Private
 */
const createClaim = async (req, res) => {
  try {
    const claimData = {
      ...req.body,
      attachment: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    };
    
    const claim = new Claim(claimData);
    const savedClaim = await claim.save();
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ message: 'Error creating claim', error: error.message });
  }
};

/**
 * @desc    Create a new special claim
 * @route   POST /api/special-claims
 * @access  Private
 */
const createSpecialClaim = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Prepare claim data
    const claimData = {
      ...req.body,
      attachments: req.files ? req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      })) : [],
    };

    // Create and save special claim
    const specialClaim = new SpecialClaim(claimData);
    const savedSpecialClaim = await specialClaim.save();

    res.status(201).json(savedSpecialClaim);
  } catch (error) {
    console.error('Error creating special claim:', error);
    res.status(500).json({ message: 'Error creating special claim', error: error.message });
  }
};

/**
 * @desc    Update a claim
 * @route   PUT /api/claims/:id
 * @access  Private/Admin
 */
const updateClaim = async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ message: 'Error updating claim', error: error.message });
  }
};

/**
 * @desc    Delete a claim
 * @route   DELETE /api/claims/:id
 * @access  Private/Admin
 */
const deleteClaim = async (req, res) => {
  try {
    const claim = await Claim.findByIdAndDelete(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json({ message: 'Claim removed' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ message: 'Error deleting claim', error: error.message });
  }
};

/**
 * @desc    Get all special claims
 * @route   GET /api/claims/special
 * @access  Private/Admin
 */
const getSpecialClaims = async (req, res) => {
  try {
    const specialClaims = await SpecialClaim.find({})
      .sort({ createdAt: -1 });

    // Add pending fields to each claim
    const claimsWithPendingFields = specialClaims.map(claim => ({
      ...claim.toObject(),
      providerId: 'pending',
      patientAge: 'pending',
      providerSpecialty: 'pending',
      claimStatus: 'pending',
      patientIncome: 'pending',
      patientMaritalStatus: 'pending',
      patientEmploymentStatus: 'pending',
      claimType: 'pending',
      claimSubmissionMethod: 'pending',
      diagnosisDescription: 'pending',
      procedureDescription: 'pending'
    }));

    res.json({ specialClaims: claimsWithPendingFields });
  } catch (error) {
    console.error('Error fetching special claims:', error);
    res.status(500).json({ message: 'Error fetching special claims', error: error.message });
  }
};

/**
 * @desc    Get special claims by employee ID
 * @route   GET /api/claims/special/employee/:employeeId
 * @access  Private
 */
const getSpecialClaimsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const specialClaims = await SpecialClaim.find({ employeeId })
      .sort({ createdAt: -1 });

    // Add pending fields to each claim
    const claimsWithPendingFields = specialClaims.map(claim => ({
      ...claim.toObject(),
      providerId: 'pending',
      patientAge: 'pending',
      providerSpecialty: 'pending',
      claimStatus: 'pending',
      patientIncome: 'pending',
      patientMaritalStatus: 'pending',
      patientEmploymentStatus: 'pending',
      claimType: 'pending',
      claimSubmissionMethod: 'pending',
      diagnosisDescription: 'pending',
      procedureDescription: 'pending'
    }));

    res.json({ specialClaims: claimsWithPendingFields });
  } catch (error) {
    console.error('Error fetching special claims:', error);
    res.status(500).json({ message: 'Error fetching special claims', error: error.message });
  }
};

/**
 * @desc    Get all claims from a specific year
 * @route   GET /api/claims/year/:year
 * @access  Private/Admin
 */
const getClaimsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const collectionName = year === 'current' ? 'claims' : `claims_${year}`;
    
    // Get the collection for the specified year
    const ClaimModel = mongoose.models[collectionName] || mongoose.model(collectionName, claimSchema);
    
    const claims = await ClaimModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({ claims });
  } catch (error) {
    console.error(`Error fetching claims for year ${req.params.year}:`, error);
    res.status(500).json({ message: `Error fetching claims for year ${req.params.year}`, error: error.message });
  }
};

/**
 * @desc    Get claims by employee ID from a specific year
 * @route   GET /api/claims/year/:year/employee/:employeeId
 * @access  Private
 */
const getEmployeeClaimsByYear = async (req, res) => {
  try {
    const { year, employeeId } = req.params;
    const collectionName = year === 'current' ? 'claims' : `claims_${year}`;
    
    // Get the collection for the specified year
    const ClaimModel = mongoose.models[collectionName] || mongoose.model(collectionName, claimSchema);
    
    const claims = await ClaimModel.find({ patientId: employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ claims });
  } catch (error) {
    console.error(`Error fetching employee claims for year ${req.params.year}:`, error);
    res.status(500).json({ message: `Error fetching employee claims for year ${req.params.year}`, error: error.message });
  }
};

/**
 * @desc    Get all dependents
 * @route   GET /api/dependents
 * @access  Private/Admin
 */
const getAllDependents = async (req, res) => {
  try {
    const dependents = await mongoose.model('dependents').find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({ dependents });
  } catch (error) {
    console.error('Error fetching dependents:', error);
    res.status(500).json({ message: 'Error fetching dependents', error: error.message });
  }
};

/**
 * @desc    Get dependents by employee ID
 * @route   GET /api/dependents/employee/:employeeId
 * @access  Private
 */
const getDependentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const dependents = await mongoose.model('dependents').find({ employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ dependents });
  } catch (error) {
    console.error('Error fetching employee dependents:', error);
    res.status(500).json({ message: 'Error fetching employee dependents', error: error.message });
  }
};

module.exports = {
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
  getEmployeeClaimsByYear,
  getAllDependents,
  getDependentsByEmployeeId
};