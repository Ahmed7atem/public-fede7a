const mongoose = require('mongoose');
const { ComplaintTicket } = require('../../models');
// const ComplaintTicket = require('../../models/ComplaintTicket');
// const Complaint = require('../../models/schemas').Complaint;

/**
 * @desc    Get all complaints
 * @route   GET /api/complaints
 * @access  Private/Admin
 */
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaint', error: error.message });
  }
};

/**
 * @desc    Get complaints by employee ID
 * @route   GET /api/complaints/employee/:employeeId
 * @access  Private
 */
const getComplaintsByEmployeeId = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private
 */
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const employeeId = req.user.employeeId;

    // Handle file upload
    let attachments = [];
    if (req.file) {
      // Store file metadata and data
      attachments.push({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        path: 'memory-storage',
        size: req.file.size,
        fileData: req.file.buffer.toString('base64')
      });
    }

    const complaint = await ComplaintTicket.create({
      subject: title,
      description,
      category,
      employeeId,
      attachments,
      status: 'Open'
    });

    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating complaint',
      error: error.message
    });
  }
};

/**
 * @desc    Update a complaint
 * @route   PUT /api/complaints/:id
 * @access  Private/Admin
 */
const updateComplaint = async (req, res) => {
  try {
    const { status, response } = req.body;
    const complaint = await ComplaintTicket.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status || complaint.status;
    complaint.response = response || complaint.response;
    complaint.updatedAt = Date.now();

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint', error: error.message });
  }
};

/**
 * @desc    Delete a complaint
 * @route   DELETE /api/complaints/:id
 * @access  Private/Admin
 */
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaint.remove();
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting complaint', error: error.message });
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