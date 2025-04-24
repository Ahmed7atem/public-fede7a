const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Policy, PolicyDocument } = require('../models/schemas');
const path = require('path');
const fs = require('fs');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all policies
router.get('/', async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const policy = await Policy.findById(id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create policy
router.post('/', async (req, res) => {
  try {
    const policy = new Policy(req.body);
    const newPolicy = await policy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update policy
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const policy = await Policy.findByIdAndUpdate(id, req.body, { new: true });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete policy
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const policy = await Policy.findByIdAndDelete(id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all policy documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await PolicyDocument.find({ isActive: true });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get policy documents by policy ID
router.get('/:policyId/documents', async (req, res) => {
  try {
    const policyId = req.params.policyId;
    const documents = await PolicyDocument.find({ 
      policyId: policyId, 
      isActive: true 
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific document type for a policy
router.get('/:policyId/documents/:type', async (req, res) => {
  try {
    const { policyId, type } = req.params;
    
    // Validate document type
    const validTypes = ['table-of-benefits', 'benefit-guide', 'insurance-certificate', 
                        'membership-card', 'treatment-guarantee-form', 'additional-information'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    const document = await PolicyDocument.findOne({ 
      policyId: policyId, 
      type: type,
      isActive: true 
    });
    
    if (!document) {
      return res.status(404).json({ message: `${type} document not found` });
    }
    
    // If we're returning the file content, check if file exists
    const filePath = document.fileUrl;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Document file not found' });
    }
    
    // Serve the PDF file
    res.contentType('application/pdf');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 