const express = require('express');
const router = express.Router();
const { WearableData } = require('../models/schemas');

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
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create wearable data
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
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    Object.assign(wearableData, req.body);
    const updatedWearableData = await wearableData.save();
    res.json(updatedWearableData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete wearable data
router.delete('/:id', async (req, res) => {
  try {
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    await wearableData.deleteOne();
    res.json({ message: 'Wearable data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 