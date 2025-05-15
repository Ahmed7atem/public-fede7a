const mongoose = require('mongoose');
const ComplaintTicket = require('../../models/ComplaintTicket');

/**
 * @desc    Get all complaint tickets
 * @route   GET /api/complaints
 * @access  Private/Admin
 */
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: complaints,
      count: complaints.length
    });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
      error: error.message
    });
  }
};

/**
 * @desc    Get complaint ticket by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findById(req.params.id).lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaint',
      error: error.message
    });
  }
};

/**
 * @desc    Get complaint tickets by employee ID
 * @route   GET /api/complaints/employee/:employeeId
 * @access  Private
 */
const getComplaintsByEmployeeId = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find({ employeeId: req.params.employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: complaints,
      count: complaints.length
    });
  } catch (error) {
    console.error('Error fetching employee complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee complaints',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new complaint ticket
 * @route   POST /api/complaints
 * @access  Private
 */
const createComplaint = async (req, res) => {
  try {
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);

    // Extract form data
    const providerType = req.body.providerType;
    const description = req.body.description;
    const employeeId = req.body.employeeId;

    console.log('Extracted fields:', { providerType, description, employeeId });

    // Validate required fields
    if (!providerType || !employeeId) {
      console.log('Missing fields:', { providerType, employeeId });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'providerType and employeeId are required',
        receivedData: req.body
      });
    }

    const complaintData = {
      providerType,
      description,
      employeeId,
      attachment: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    };

    console.log('Creating complaint with data:', complaintData);

    const complaint = new ComplaintTicket(complaintData);
    const savedComplaint = await complaint.save();

    res.status(201).json({
      success: true,
      data: savedComplaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating complaint',
      error: error.message,
      details: error.stack
    });
  }
};

/**
 * @desc    Update a complaint ticket
 * @route   PUT /api/complaints/:id
 * @access  Private/Admin
 */
const updateComplaint = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating complaint',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a complaint ticket
 * @route   DELETE /api/complaints/:id
 * @access  Private/Admin
 */
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Complaint ticket removed'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting complaint',
      error: error.message
    });
  }
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  getComplaintsByEmployeeId,
  createComplaint,
  updateComplaint,
  deleteComplaint
}; 