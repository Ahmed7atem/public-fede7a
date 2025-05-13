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
    const { employeeId, providerId, service, notes } = req.body;
    const preApproval = new PreApprovalClaim({
      employeeId,
      providerId,
      service,
      status: 'pending',
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const saved = await preApproval.save();
    res.status(201).json(saved);
  } catch (error) {
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
    const preApproval = await PreApprovalClaim.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    );
    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }
    res.json(preApproval);
  } catch (error) {
    res.status(500).json({ message: 'Error updating pre-approval', error: error.message });
  }
};

/**
 * @desc    Get pre-approvals by employee
 * @route   GET /api/pre-approvals/employee/:employeeId
 * @access  Private
 */
const getPreApprovalsByEmployeeId = async (req, res) => {
  try {
    const preApprovals = await PreApprovalClaim.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 }).lean();
    res.json(preApprovals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee pre-approvals', error: error.message });
  }
};

/**
 * @desc    Get pre-approvals by provider
 * @route   GET /api/pre-approvals/provider/:providerId
 * @access  Private
 */
const getPreApprovalsByProviderId = async (req, res) => {
  try {
    const preApprovals = await PreApprovalClaim.find({ providerId: req.params.providerId }).sort({ createdAt: -1 }).lean();
    res.json(preApprovals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider pre-approvals', error: error.message });
  }
};

/**
 * @desc    Delete pre-approval
 * @route   DELETE /api/pre-approvals/:id
 * @access  Private/Admin
 */
const deletePreApproval = async (req, res) => {
  try {
    const preApproval = await PreApprovalClaim.findByIdAndDelete(req.params.id);
    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }
    res.json({ message: 'Pre-approval deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting pre-approval', error: error.message });
  }
};

module.exports = {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByPatientId,
  createPreApproval,
  updatePreApprovalStatus,
  getPreApprovalsByEmployeeId,
  getPreApprovalsByProviderId,
  deletePreApproval
}; 