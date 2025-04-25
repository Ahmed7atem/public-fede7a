const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Claim } = require('../models/schemas');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
};

// Get all claims
router.get('/', async (req, res) => {
  try {
    // Get all claims with related data
    const claims = await Claim.find()
      .populate('employeeId', 'name email department')
      .populate('provider', 'name specialty')
      .sort({ date: -1 });

    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ 
      message: 'Error fetching claims',
      error: error.message 
    });
  }
});

// Get claim by ID
router.get('/:id', async (req, res) => {
  try {
    const claimId = convertToObjectId(req.params.id);
    
    // Find claim by ID with related data
    const claim = await Claim.findOne({ _id: claimId })
      .populate('employeeId', 'name email department')
      .populate('provider', 'name specialty');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Error fetching claim details:', error);
    res.status(500).json({ 
      message: 'Error fetching claim details',
      error: error.message 
    });
  }
});

// Get claims by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId; // Keep as string for UUID
    
    // Find all claims for the employee using employeeId field
    const claims = await Claim.find({ employeeId })
      .populate('provider', 'name specialty')
      .sort({ date: -1 });

    res.json(claims);
  } catch (error) {
    console.error('Error fetching employee claims:', error);
    res.status(500).json({ 
      message: 'Error fetching employee claims',
      error: error.message 
    });
  }
});

// Create a new claim
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      provider,
      claimAmount,
      claimedAmount,
      department,
      date,
      status
    } = req.body;

    // Validate required fields
    if (!employeeId || !provider || !claimAmount || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newClaim = new Claim({
      employeeId,
      provider,
      claimAmount,
      claimedAmount,
      department,
      date: date || new Date(),
      status: status || 'Pending'
    });

    const savedClaim = await newClaim.save();
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ 
      message: 'Error creating claim',
      error: error.message 
    });
  }
});

// Update a claim
router.put('/:id', async (req, res) => {
  try {
    const claimId = convertToObjectId(req.params.id);
    const updates = req.body;

    // Find and update the claim
    const updatedClaim = await Claim.findOneAndUpdate(
      { _id: claimId },
      updates,
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email department')
     .populate('provider', 'name specialty');

    if (!updatedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ 
      message: 'Error updating claim',
      error: error.message 
    });
  }
});

// Delete a claim
router.delete('/:id', async (req, res) => {
  try {
    const claimId = convertToObjectId(req.params.id);
    
    const deletedClaim = await Claim.findOneAndDelete({ _id: claimId });
    
    if (!deletedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ 
      message: 'Error deleting claim',
      error: error.message 
    });
  }
});

module.exports = router; 