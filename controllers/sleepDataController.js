const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { SleepData } = require('../models/schemas');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all sleep data
router.get('/', async (req, res) => {
  try {
    const sleepData = await SleepData.find();
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sleep data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const sleepData = await SleepData.findById(id);
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new sleep data
router.post('/', async (req, res) => {
  try {
    const sleepData = new SleepData(req.body);
    const newSleepData = await sleepData.save();
    res.status(201).json(newSleepData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sleep data
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const sleepData = await SleepData.findByIdAndUpdate(id, req.body, { new: true });
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    res.json(sleepData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sleep data
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const sleepData = await SleepData.findByIdAndDelete(id);
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    res.json({ message: 'Sleep data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sleep data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.employeeId);
    const sleepData = await SleepData.find({ employee: employeeId })
      .sort({ date: -1 });
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sleep data by date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const sleepData = await SleepData.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 });
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 