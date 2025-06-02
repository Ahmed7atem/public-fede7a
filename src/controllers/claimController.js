// controllers/claimController.js
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { Claim, SpecialClaim, Claim2023, Claim2024 } = require('../../models');

// Constants
const ITEMS_PER_PAGE = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
const ClaimModel = mongoose.models.Claim || mongoose.model('Claim', claimSchema);

/**
 * @desc    Get all claims
 * @route   GET /api/claims
 * @access  Private/Admin
 */
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error('Error fetching all claims:', error);
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
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid claim ID format' });
    }

    const claim = await Claim.findById(id).lean();
    
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
    const { employeeId } = req.params;
    const claims = await Claim.find({ employeeId })
      .sort({ createdAt: -1 })
      .lean();

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
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Validate file size if file is present
    if (req.file && req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 10MB'
      });
    }

    const claimData = {
      ...req.body,
      attachment: req.file ? {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer.toString('base64')
      } : null
    };
    
    const claim = new Claim(claimData);
    const savedClaim = await claim.save();

    res.status(201).json({
      success: true,
      data: savedClaim,
      message: 'Claim created successfully'
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating claim',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new special claim
 * @route   POST /api/claims/special
 * @access  Private
 */
const createSpecialClaim = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Validate file sizes
    if (req.files) {
      for (const file of req.files) {
        if (file.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} exceeds maximum size limit of 10MB`
          });
        }
      }
    }

    // Process uploaded files
    const processedAttachments = (req.files || []).map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date(),
      filePath: file.path || '',
      fileData: file.buffer ? file.buffer.toString('base64') : ''
    }));

    // Validate and parse numeric values
    const claimAmount = parseFloat(req.body.claimAmount);
    if (isNaN(claimAmount) || claimAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim amount',
        error: 'claimAmount must be a valid positive number'
      });
    }

    // Validate date
    const dateOfTreatment = new Date(req.body.dateOfTreatment);
    if (isNaN(dateOfTreatment.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date of treatment'
      });
    }

    const claimData = {
      policyNumber: req.body.policyNumber,
      policyHolderName: req.body.policyHolderName,
      employeeId: req.body.employeeId,
      email: req.body.email,
      number: req.body.number,
      claimFor: req.body.claimFor,
      claimForId: req.body.claimForId,
      country: req.body.country,
      claimAmount,
      currency: req.body.currency,
      dateOfTreatment,
      paymentMethod: req.body.paymentMethod,
      bankName: req.body.bankName,
      branchName: req.body.branchName,
      accountNumber: req.body.accountNumber,
      swiftCode: req.body.swiftCode,
      iban: req.body.iban,
      description: req.body.description,
      attachments: processedAttachments
    };

    const claim = new SpecialClaim(claimData);
    const savedClaim = await claim.save();

    res.status(201).json({
      success: true,
      data: savedClaim,
      message: 'Special claim created successfully'
    });
  } catch (error) {
    console.error('Error creating special claim:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating special claim',
      error: error.message
    });
  }
};

/**
 * @desc    Update a claim
 * @route   PUT /api/claims/:id
 * @access  Private/Admin
 */
const updateClaim = async (req, res) => {
  try {
    const claim = await ClaimModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const claim = await ClaimModel.findByIdAndDelete(req.params.id);
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
    console.log('Fetching special claims (Mongoose model)...');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Use the Mongoose model
    const claims = await SpecialClaim.find({}).lean();
    console.log('Claims found:', claims.length);
    if (claims.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No special claims found'
      });
    }
    res.status(200).json({
      success: true,
      data: claims,
      count: claims.length,
      message: 'Special claims retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching special claims:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching special claims', 
      error: error.message 
    });
  }
};

/**
 * @desc    Get special claims by employee ID
 * @route   GET /api/claims/special/employee/:employeeId
 * @access  Private
 */
const getSpecialClaimsByEmployeeId = async (req, res) => {
  try {
    const claims = await SpecialClaim.find({ employeeId: req.params.employeeId }).lean();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get claims by year
 * @route   GET /api/claims/year/:year
 * @access  Private/Admin
 */
const getClaimsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    
    // Validate year
    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 2000 || yearInt > new Date().getFullYear()) {
      return res.status(400).json({ message: 'Invalid year' });
    }
    
    let claims = [];
    
    // Determine which collection to use based on year
    if (yearInt === 2023) {
      claims = await Claim2023.find({}).sort({ claimDate: -1 }).lean();
    } else if (yearInt === 2024) {
      claims = await Claim2024.find({}).sort({ claimDate: -1 }).lean();
    } else {
      claims = await Claim.find({
        claimDate: {
          $gte: new Date(`${yearInt}-01-01`),
          $lte: new Date(`${yearInt}-12-31`)
        }
      }).sort({ claimDate: -1 }).lean();
    }
    
    res.json(claims);
  } catch (error) {
    console.error(`Error fetching ${req.params.year} claims:`, error);
    res.status(500).json({ message: `Error fetching ${req.params.year} claims`, error: error.message });
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
    
    // Validate year
    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 2000 || yearInt > new Date().getFullYear()) {
      return res.status(400).json({ message: 'Invalid year' });
    }
    
    let claims = [];
    
    // Determine which collection to use based on year
    if (yearInt === 2023) {
      claims = await Claim2023.find({ employeeId }).sort({ claimDate: -1 }).lean();
    } else if (yearInt === 2024) {
      claims = await Claim2024.find({ employeeId }).sort({ claimDate: -1 }).lean();
    } else {
      claims = await Claim.find({
        employeeId,
        claimDate: {
          $gte: new Date(`${yearInt}-01-01`),
          $lte: new Date(`${yearInt}-12-31`)
        }
      }).sort({ claimDate: -1 }).lean();
    }
    
    res.json(claims);
  } catch (error) {
    console.error(`Error fetching employee ${req.params.employeeId} claims for ${req.params.year}:`, error);
    res.status(500).json({ message: `Error fetching employee claims for ${req.params.year}`, error: error.message });
  }
};

/**
 * @desc    Get all dependents
 * @route   GET /api/dependents
 * @access  Private/Admin
 */
const getAllDependents = async (req, res) => {
  try {
    const dependents = await mongoose.model('Dependent').find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(dependents);
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
    const dependents = await mongoose.model('Dependent').find({ employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(dependents);
  } catch (error) {
    console.error('Error fetching employee dependents:', error);
    res.status(500).json({ message: 'Error fetching employee dependents', error: error.message });
  }
};

/**
 * @desc    Get claims for 2023
 * @route   GET /api/claims/2023
 * @access  Private/Admin
 */
const getClaims2023 = async (req, res) => {
  try {
    const claims = await Claim2023.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error('Error fetching 2023 claims:', error);
    res.status(500).json({ message: 'Error fetching 2023 claims', error: error.message });
  }
};

/**
 * @desc    Get claims for 2024
 * @route   GET /api/claims/2024
 * @access  Private/Admin
 */
const getClaims2024 = async (req, res) => {
  try {
    const claims = await Claim2024.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error('Error fetching 2024 claims:', error);
    res.status(500).json({ message: 'Error fetching 2024 claims', error: error.message });
  }
};

/**
 * @desc    Get claims by employee ID for 2023
 * @route   GET /api/claims/2023/employee/:employeeId
 * @access  Private
 */
const getClaimsByEmployeeId2023 = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const claims = await Claim2023.find({ 
      $or: [
        { patientId: employeeId },
        { employeeId: employeeId }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error('Error fetching 2023 employee claims:', error);
    res.status(500).json({ message: 'Error fetching 2023 employee claims', error: error.message });
  }
};

/**
 * @desc    Get claims by employee ID for 2024
 * @route   GET /api/claims/2024/employee/:employeeId
 * @access  Private
 */
const getClaimsByEmployeeId2024 = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const claims = await Claim2024.find({ 
      $or: [
        { patientId: employeeId },
        { employeeId: employeeId }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (error) {
    console.error('Error fetching 2024 employee claims:', error);
    res.status(500).json({ message: 'Error fetching 2024 employee claims', error: error.message });
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
  getDependentsByEmployeeId,
  getClaims2023,
  getClaims2024,
  getClaimsByEmployeeId2023,
  getClaimsByEmployeeId2024
};