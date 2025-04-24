const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { HealthData } = require('../models/schemas');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
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
    const healthData = await HealthData.find();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const healthData = await HealthData.findById(id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
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
    const healthData = await HealthData.findByIdAndUpdate(id, req.body, { new: true });
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
    const healthData = await HealthData.findByIdAndDelete(id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json({ message: 'Health data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;