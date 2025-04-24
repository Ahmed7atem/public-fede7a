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
    const providers = await Provider.find().select('name type address contactInfo');
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get provider by name
router.get('/:name', async (req, res) => {
  try {
    const provider = await Provider.findOne({ name: req.params.name });
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
router.put('/:name', async (req, res) => {
  try {
    const provider = await Provider.findOneAndUpdate(
      { name: req.params.name },
      req.body,
      { new: true, runValidators: true }
    );
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete provider
router.delete('/:name', async (req, res) => {
  try {
    const provider = await Provider.findOneAndDelete({ name: req.params.name });
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 