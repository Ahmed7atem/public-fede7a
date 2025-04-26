const mongoose = require('mongoose');

/**
 * @desc    Get all complaints
 * @route   GET /api/complaints
 * @access  Private/Admin
 */
const getAllComplaints = async (req, res) => {
  try {
    // Mock complaints data since we don't have a Complaint model yet
    const complaints = [
      {
        id: '1',
        subject: 'Service Issue',
        category: 'General',
        description: 'Issue with claim processing',
        status: 'Open',
        createdAt: '2024-04-15T10:30:00Z'
      },
      {
        id: '2',
        subject: 'Policy Concern',
        category: 'Policy',
        description: 'Need clarification on policy coverage',
        status: 'Resolved',
        response: 'Policy details have been clarified',
        createdAt: '2024-04-10T14:20:00Z',
        resolvedAt: '2024-04-12T09:15:00Z'
      }
    ];
    
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private/Admin
 */
const getComplaintById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Mock complaint data
    const complaint = {
      id,
      subject: 'Service Issue',
      category: 'General',
      description: 'Issue with claim processing',
      status: 'Open',
      createdAt: '2024-04-15T10:30:00Z'
    };
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ message: 'Error fetching complaint', error: error.message });
  }
};

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private
 */
const createComplaint = async (req, res) => {
  try {
    // Mock response for creating a complaint
    const newComplaint = {
      id: new mongoose.Types.ObjectId().toString(),
      ...req.body,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newComplaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Error creating complaint', error: error.message });
  }
};

/**
 * @desc    Update a complaint
 * @route   PUT /api/complaints/:id
 * @access  Private/Admin
 */
const updateComplaint = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Mock response for updating a complaint
    const updatedComplaint = {
      id,
      subject: 'Service Issue',
      category: 'General',
      description: 'Issue with claim processing',
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    if (req.body.status === 'Resolved' && !updatedComplaint.resolvedAt) {
      updatedComplaint.resolvedAt = new Date().toISOString();
    }
    
    res.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
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
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Error deleting complaint', error: error.message });
  }
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint
}; 