const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ComplaintTicket } = require('../models/schemas');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await ComplaintTicket.find();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
});

// Create new complaint
router.post('/', async (req, res) => {
  try {
    const complaint = new ComplaintTicket(req.body);
    const newComplaint = await complaint.save();
    res.status(201).json(newComplaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update complaint
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const complaint = await ComplaintTicket.findByIdAndUpdate(id, req.body, { new: true });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    res.json({ message: 'Complaint deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 