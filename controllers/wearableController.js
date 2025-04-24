const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WearableData = require('../models/WearableData');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all wearable data
router.get('/', async (req, res) => {
  try {
    const wearableData = await WearableData.find();
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get wearable data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findById(id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new wearable data
router.post('/', async (req, res) => {
  try {
    const wearableData = new WearableData(req.body);
    const newWearableData = await wearableData.save();
    res.status(201).json(newWearableData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update wearable data
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findByIdAndUpdate(id, req.body, { new: true });
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete wearable data
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findByIdAndDelete(id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json({ message: 'Wearable data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 