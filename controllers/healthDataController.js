const express = require('express');
const router = express.Router();
const { HealthData } = require('../models/schemas');

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
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
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create health data
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
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    Object.assign(healthData, req.body);
    const updatedHealthData = await healthData.save();
    res.json(updatedHealthData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete health data
router.delete('/:id', async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    await healthData.deleteOne();
    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;