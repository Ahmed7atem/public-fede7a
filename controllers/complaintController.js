const { ComplaintTicket } = require('../models/schemas');

// Get complaint history for current user
const getComplaintHistory = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find({ 
      employeeId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaint history', error: error.message });
  }
};

// Submit a new complaint ticket
const submitComplaint = async (req, res) => {
  try {
    const { subject, category, description } = req.body;
    
    if (!subject || !category || !description) {
      return res.status(400).json({ 
        message: 'Subject, category, and description are required' 
      });
    }
    
    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(file.path);
      });
    }
    
    // Create new complaint ticket
    const newComplaint = new ComplaintTicket({
      subject,
      category,
      description,
      employeeId: req.user.id,
      attachments: attachments
    });
    
    await newComplaint.save();
    
    res.status(201).json({
      message: 'Complaint ticket submitted successfully',
      ticket: newComplaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint ticket', error: error.message });
  }
};

// Get complaint ticket by ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await ComplaintTicket.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint ticket not found' });
    }
    
    // Check if the user has access to this complaint
    if (req.user.role !== 'admin' && complaint.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaint details', error: error.message });
  }
};

// Admin only: Update complaint status
const updateComplaintStatus = async (req, res) => {
  try {
    // Only admins can update complaint status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status, responseText } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const complaint = await ComplaintTicket.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint ticket not found' });
    }
    
    complaint.status = status;
    
    // Add response note if provided
    if (responseText) {
      complaint.responseNotes.push({
        text: responseText,
        createdBy: req.user.id,
        createdAt: new Date()
      });
    }
    
    await complaint.save();
    
    res.json({
      message: 'Complaint status updated successfully',
      ticket: complaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint status', error: error.message });
  }
};

// Admin only: Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

module.exports = {
  getComplaintHistory,
  submitComplaint,
  getComplaintById,
  updateComplaintStatus,
  getAllComplaints
}; 