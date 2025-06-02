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
    const preApproval = await PreApprovalClaim.findById(req.params.id).lean();
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
    const { employeeId, providerType, providerName, description, requestedDate } = req.body;

    // Validate required fields
    if (!employeeId || !providerType || !providerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, providerType, and providerName are required'
      });
    }

    // Process uploaded files
    const processedAttachments = (req.files || []).map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date(),
      fileData: file.buffer.toString('base64')
    }));

    // Create new pre-approval
    const preApproval = new PreApprovalClaim({
      employeeId,
      providerType,
      providerName,
      description,
      requestedDate: requestedDate ? new Date(requestedDate) : new Date(),
      attachments: processedAttachments,
      status: 'Pending'
    });

    const savedPreApproval = await preApproval.save();
    res.status(201).json({
      success: true,
      message: 'Pre-approval request created successfully',
      data: savedPreApproval
    });
  } catch (error) {
    console.error('Error creating pre-approval:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating pre-approval', 
      error: error.message 
    });
  }
};

/**
 * @desc    Update pre-approval status
 * @route   PUT /api/pre-approvals/:id
 * @access  Private/Admin
 */
const updatePreApproval = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Pending', 'Approved', 'Denied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Pending, Approved, Denied'
      });
    }

    const preApproval = await PreApprovalClaim.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!preApproval) {
      return res.status(404).json({ 
        success: false,
        message: 'Pre-approval not found' 
      });
    }

    res.json({
      success: true,
      message: 'Pre-approval status updated successfully',
      data: preApproval
    });
  } catch (error) {
    console.error('Error updating pre-approval:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating pre-approval', 
      error: error.message 
    });
  }
};

/**
 * @desc    Get pre-approvals by employee ID
 * @route   GET /api/pre-approvals/employee/:employeeId
 * @access  Private
 */
const getPreApprovalsByEmployeeId = async (req, res) => {
  try {
    const preApprovals = await PreApprovalClaim.find({ 
      employeeId: req.params.employeeId 
    })
    .select('-attachments') // Exclude attachments field
    .sort({ createdAt: -1 })
    .lean();

    if (preApprovals.length === 0) {
      return res.status(404).json({
        message: 'No pre-approvals found for this employee'
      });
    }

    res.json(preApprovals);
  } catch (error) {
    console.error('Error fetching employee pre-approvals:', error);
    res.status(500).json({ 
      message: 'Error fetching employee pre-approvals', 
      error: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'Pre-approval not found' 
      });
    }
    res.json({ 
      success: true,
      message: 'Pre-approval deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting pre-approval:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting pre-approval', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByPatientId,
  createPreApproval,
  updatePreApproval,
  getPreApprovalsByEmployeeId,
  getPreApprovalsByProviderId,
  deletePreApproval
}; 