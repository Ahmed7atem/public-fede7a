const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Provider } = require('../models/schemas');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get provider by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new provider
router.post('/', async (req, res) => {
  try {
    const provider = new Provider(req.body);
    const newProvider = await provider.save();
    res.status(201).json(newProvider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const provider = await Provider.findByIdAndUpdate(id, req.body, { new: true });
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete provider
router.delete('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const provider = await Provider.findByIdAndDelete(id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json({ message: 'Provider deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 