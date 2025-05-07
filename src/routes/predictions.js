const express = require('express');
const router = express.Router();
const { Prediction } = require('../../models');

// Update prediction by employeeId
router.put('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { predictionType, predictionValue, confidence, factors } = req.body;

    // Validate required fields
    if (!predictionType || !predictionValue || confidence === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: predictionType, predictionValue, and confidence are required'
      });
    }

    // Create new prediction
    const newPrediction = new Prediction({
      employeeId: employeeId,
      predictionType,
      predictionValue,
      confidence,
      factors: factors || [],
      predictedAt: new Date()
    });

    // Save the prediction
    const savedPrediction = await newPrediction.save();

    res.status(201).json({
      success: true,
      message: 'Prediction added successfully',
      data: savedPrediction
    });
  } catch (error) {
    console.error('Error adding prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding prediction',
      error: error.message
    });
  }
});

// Get predictions by employeeId
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const predictions = await Prediction.find({ employeeId: employeeId })
      .sort({ predictedAt: -1 });

    res.status(200).json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions',
      error: error.message
    });
  }
});

module.exports = router; 