// controllers/claimController.js
const mongoose = require('mongoose');
const { Claim } = require('../models');
const SpecialClaim = require('../models/SpecialClaim'); // Import the new model
const { validationResult } = require('express-validator');

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
    const id = req.params.id;
    const claim = await Claim.findOne({ id }).lean();
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

module.exports = {
  getAllClaims,
  getClaimById,
  getClaimsByEmployeeId,
  createClaim,
  createSpecialClaim, // Added new function
  updateClaim,
  deleteClaim
};