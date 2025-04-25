const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ComplaintTicket } = require('../models/schemas');

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
};

// Get all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find()
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ 
      message: 'Error fetching complaints',
      error: error.message 
    });
  }
});

// Get complaint by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const complaint = await ComplaintTicket.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ 
      message: 'Error fetching complaint',
      error: error.message 
    });
  }
});

// Create new complaint
router.post('/', async (req, res) => {
  try {
    const { subject, category, description, employeeId, attachments } = req.body;

    // Validate required fields
    if (!subject || !category || !description || !employeeId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['subject', 'category', 'description', 'employeeId']
      });
    }

    // Validate category
    const validCategories = ['Claim', 'Policy', 'Others'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category',
        validCategories
      });
    }

    const complaint = new ComplaintTicket({
      subject,
      category,
      description,
      employeeId,
      attachments: attachments || []
    });

    const newComplaint = await complaint.save();
    res.status(201).json(newComplaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(400).json({ 
      message: 'Error creating complaint',
      error: error.message 
    });
  }
});

// Update complaint
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const { status, response, attachments } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status',
          validStatuses
        });
      }
    }

    const updateData = { ...req.body };
    if (attachments) {
      updateData.$push = { attachments: { $each: attachments } };
    }

    const complaint = await ComplaintTicket.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(400).json({ 
      message: 'Error updating complaint',
      error: error.message 
    });
  }
});

// Delete complaint
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const complaint = await ComplaintTicket.findByIdAndDelete(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ 
      message: 'Error deleting complaint',
      error: error.message 
    });
  }
});

module.exports = router; 