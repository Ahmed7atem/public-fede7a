const { Claim } = require('../models/schemas');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get all claims (admin sees all, employees see only their own)
const getClaims = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show claims belonging to the user
    if (req.user.role !== 'admin') {
      query.employeeId = req.user.id;
    }
    
    const claims = await Claim.find(query).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
};

// Get claim history (all claims for the current user)
const getClaimHistory = async (req, res) => {
  try {
    const claims = await Claim.find({ employeeId: req.user.id }).sort({ createdAt: -1 });
    
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claim history', error: error.message });
  }
};

// Get a specific claim by ID
const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    // Check if the user has access to this claim
    if (req.user.role !== 'admin' && claim.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claim details', error: error.message });
  }
};

// Submit a new claim
const submitClaim = async (req, res) => {
  try {
    const { providerType, claimDescription } = req.body;
    
    if (!providerType || !claimDescription) {
      return res.status(400).json({ message: 'Provider type and claim description are required' });
    }
    
    // Process file uploads if any
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push(file.path);
      });
    }
    
    // Create new claim
    const newClaim = new Claim({
      employeeId: req.user.id,
      provider: providerType,
      patient: req.user.name,
      claimAmount: req.body.claimAmount || 0,
      patientAge: req.user.age,
      providerSpecialty: req.body.providerSpecialty || '',
      patientMaritalStatus: req.body.patientMaritalStatus || '',
      patientEmploymentStatus: req.body.patientEmploymentStatus || '',
      claimType: req.body.claimType || 'General',
      diagnosisDescription: req.body.diagnosisDescription || claimDescription,
      procedureDescription: req.body.procedureDescription || '',
      documents: documents
    });
    
    await newClaim.save();
    
    res.status(201).json({ 
      message: 'Claim submitted successfully', 
      claim: newClaim 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting claim', error: error.message });
  }
};

// Submit a claim pre-approval
const submitPreApproval = async (req, res) => {
  try {
    const { providerType, category, dateTime, additionalDetails } = req.body;
    
    if (!providerType || !category || !dateTime) {
      return res.status(400).json({ 
        message: 'Provider type, category, and date/time are required' 
      });
    }
    
    // Process file uploads if any
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push(file.path);
      });
    }
    
    // Create new pre-approval claim
    const newClaim = new Claim({
      employeeId: req.user.id,
      provider: providerType,
      patient: req.user.name,
      claimAmount: 0, // Will be determined later
      patientAge: req.user.age,
      providerSpecialty: category,
      claimType: 'Pre-Approval',
      claimDate: new Date(dateTime),
      diagnosisDescription: additionalDetails || 'Pre-approval request',
      documents: documents,
      status: 'In Review'
    });
    
    await newClaim.save();
    
    res.status(201).json({ 
      message: 'Pre-approval request submitted successfully', 
      claim: newClaim 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting pre-approval', error: error.message });
  }
};

// Update claim status (admin only)
const updateClaimStatus = async (req, res) => {
  try {
    // Only admins can update claim status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const validStatuses = ['Submitted', 'In Review', 'Approved', 'Rejected', 'Additional Information Required'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    claim.status = status;
    // Optionally add notes or other updates
    
    await claim.save();
    
    res.json({ 
      message: 'Claim status updated successfully', 
      claim: claim 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating claim status', error: error.message });
  }
};

module.exports = {
  getClaims,
  getClaimHistory,
  getClaimById,
  submitClaim,
  submitPreApproval,
  updateClaimStatus
}; 