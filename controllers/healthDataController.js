const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { HealthData } = require('../models/schemas');

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

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  const heightInMeters = height / 100; // Convert cm to m
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};

// Get all health data
router.get('/', async (req, res) => {
  try {
    const healthData = await HealthData.find().sort({ date: -1 });
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const healthData = await HealthData.findOne({ employeeId: id });
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.employeeId);
    const healthData = await HealthData.find({ employeeId }).sort({ date: -1 });
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new health data
router.post('/', async (req, res) => {
  try {
    const healthData = new HealthData(req.body);
    const newHealthData = await healthData.save();
    res.status(201).json(newHealthData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update health data
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const healthData = await HealthData.findOneAndUpdate(
      { _id: id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete health data
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const healthData = await HealthData.findOneAndDelete({ _id: id });
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;