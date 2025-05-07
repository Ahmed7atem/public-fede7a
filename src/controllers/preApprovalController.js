const mongoose = require('mongoose');
const { PreApprovalClaim } = require('../../models');

/**
 * @desc    Get all pre-approval claims
 * @route   GET /api/pre-approvals
 * @access  Private/Admin
 */
const getAllPreApprovals = async (req, res) => {
  try {
    const preApprovals = await PreApprovalClaim.find().sort({ createdAt: -1 }).lean();
    res.json(preApprovals);
  } catch (error) {
    console.error('Error fetching pre-approvals:', error);
    res.status(500).json({ message: 'Error fetching pre-approvals', error: error.message });
  }
};

/**
 * @desc    Get pre-approval by ID
 * @route   GET /api/pre-approvals/:id
 * @access  Private
 */
const getPreApprovalById = async (req, res) => {
  try {
    const id = req.params.id;
    const preApproval = await PreApprovalClaim.findOne({ id }).lean();
    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval request not found' });
    }
    res.json(preApproval);
  } catch (error) {
    console.error('Error fetching pre-approval:', error);
    res.status(500).json({ message: 'Error fetching pre-approval', error: error.message });
  }
};

/**
 * @desc    Get pre-approvals by patient ID
 * @route   GET /api/pre-approvals/patient/:patientId
 * @access  Private
 */
const getPreApprovalsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const preApprovals = await PreApprovalClaim.find({ patientId }).sort({ createdAt: -1 }).lean();
    res.json(preApprovals);
  } catch (error) {
    console.error('Error fetching patient pre-approvals:', error);
    res.status(500).json({ message: 'Error fetching patient pre-approvals', error: error.message });
  }
};

/**
 * @desc    Create a new pre-approval request
 * @route   POST /api/pre-approvals
 * @access  Private
 */
const createPreApproval = async (req, res) => {
  try {
    const preApprovalData = {
      ...req.body,
      id: `PRE-${Date.now().toString().slice(-6)}`,
      documents: req.files ? req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      })) : []
    };
    
    const preApproval = new PreApprovalClaim(preApprovalData);
    const savedPreApproval = await preApproval.save();
    res.status(201).json(savedPreApproval);
  } catch (error) {
    console.error('Error creating pre-approval:', error);
    res.status(500).json({ message: 'Error creating pre-approval', error: error.message });
  }
};

/**
 * @desc    Update pre-approval status
 * @route   PUT /api/pre-approvals/:id/status
 * @access  Private/Admin
 */
const updatePreApprovalStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const preApproval = await PreApprovalClaim.findOneAndUpdate(
      { id: req.params.id },
      { 
        status,
        notes,
        processedAt: new Date(),
        processedBy: req.user.id // Assuming you have user info in request
      },
      { new: true }
    );
    
    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval request not found' });
    }
    
    res.json(preApproval);
  } catch (error) {
    console.error('Error updating pre-approval status:', error);
    res.status(500).json({ message: 'Error updating pre-approval status', error: error.message });
  }
};

module.exports = {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByPatientId,
  createPreApproval,
  updatePreApprovalStatus
}; 