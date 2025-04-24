const { Policy, PolicyDocument } = require('../models/schemas');
const path = require('path');
const fs = require('fs');

// Get all policy documents
const getDocuments = async (req, res) => {
  try {
    const documents = await PolicyDocument.find({ isActive: true });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy documents', error: error.message });
  }
};

// Get policy details for the logged-in user
const getPolicyDetails = async (req, res) => {
  try {
    const policy = await Policy.findOne({ employeeId: req.user.id });
    
    if (!policy) {
      return res.status(404).json({ message: 'No policy found for this user' });
    }
    
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy details', error: error.message });
  }
};

// Get policy by ID
const getPolicyById = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    // Check if the user has access to this policy
    if (req.user.role !== 'admin' && policy.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
  }
};

// Get all policy documents for a specific policy
const getPolicyDocuments = async (req, res) => {
  try {
    const policyId = req.params.policyId;
    
    // First check if policy exists and user has access
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    if (req.user.role !== 'admin' && policy.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const documents = await PolicyDocument.find({ 
      policyId: policyId, 
      isActive: true 
    });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy documents', error: error.message });
  }
};

// Get specific document type for a policy
const getPolicyDocumentByType = async (req, res) => {
  try {
    const policyId = req.params.policyId;
    const documentType = req.params.type;
    
    // Validate document type
    const validTypes = ['table-of-benefits', 'benefit-guide', 'insurance-certificate', 
                        'membership-card', 'treatment-guarantee-form', 'additional-information'];
    
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    // First check if policy exists and user has access
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    if (req.user.role !== 'admin' && policy.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const document = await PolicyDocument.findOne({ 
      policyId: policyId, 
      type: documentType,
      isActive: true 
    });
    
    if (!document) {
      return res.status(404).json({ message: `${documentType} document not found` });
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
    res.status(500).json({ message: 'Error fetching policy document', error: error.message });
  }
};

module.exports = {
  getDocuments,
  getPolicyDetails,
  getPolicyById,
  getPolicyDocuments,
  getPolicyDocumentByType
}; 