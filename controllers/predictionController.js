const express = require('express');
const router = express.Router();
const { Prediction } = require('../models/schemas');

// Get all predictions
router.get('/', async (req, res) => {
  try {
    const predictions = await Prediction.find();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get prediction by ID
router.get('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create prediction
router.post('/', async (req, res) => {
  try {
    const prediction = new Prediction(req.body);
    const newPrediction = await prediction.save();
    res.status(201).json(newPrediction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update prediction
router.put('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    Object.assign(prediction, req.body);
    const updatedPrediction = await prediction.save();
    res.json(updatedPrediction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete prediction
router.delete('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    await prediction.deleteOne();
    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;