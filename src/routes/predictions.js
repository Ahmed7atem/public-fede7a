const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  getAllPredictions,
  getPredictionsByEmployeeId,
  getPredictionsByType
} = require('../controllers/predictionController');
const { Prediction } = require('../../models');

// @route   GET /api/predictions
// @desc    Get all predictions
// @access  Private/Admin
router.get('/', protect, admin, getAllPredictions);

// @route   GET /api/predictions/employee/:employeeId
// @desc    Get predictions by employee ID
// @access  Private
router.get('/employee/:employeeId', protect, getPredictionsByEmployeeId);

// @route   GET /api/predictions/type/:type
// @desc    Get predictions by type
// @access  Private/Admin
router.get('/type/:type', protect, admin, getPredictionsByType);

// @route   PUT /api/predictions/:employeeId
// @desc    Update prediction by employeeId
// @access  Private/Admin
router.put('/:employeeId', protect, admin, async (req, res) => {
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

module.exports = router; 