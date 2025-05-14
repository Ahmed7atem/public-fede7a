const mongoose = require('mongoose');
const { Prediction } = require('../../models');

/**
 * @desc    Get all predictions
 * @route   GET /api/predictions
 * @access  Private/Admin
 */
const getAllPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find({})
      .sort({ predictedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error fetching all predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions',
      error: error.message
    });
  }
};

/**
 * @desc    Get prediction by ID
 * @route   GET /api/predictions/:id
 * @access  Private
 */
const getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = await Prediction.findById(id).lean();
    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }
    res.json({ success: true, data: prediction });
  } catch (error) {
    console.error('Error fetching prediction by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching prediction by ID', error: error.message });
  }
};

/**
 * @desc    Get predictions by employee ID
 * @route   GET /api/predictions/employee/:employeeId
 * @access  Private
 */
const getPredictionsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const predictions = await Prediction.find({ employeeId })
      .sort({ predictedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error fetching employee predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee predictions',
      error: error.message
    });
  }
};

/**
 * @desc    Get predictions by type
 * @route   GET /api/predictions/type/:type
 * @access  Private/Admin
 */
const getPredictionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const predictions = await Prediction.find({ predictionType: type })
      .sort({ predictedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error fetching predictions by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions by type',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new prediction
 * @route   POST /api/predictions
 * @access  Private
 */
const createPrediction = async (req, res) => {
  try {
    const {
      Patient_ID,
      Health_Status,
      Insurance_Consumption,
      Needs_Insurance_Update,
      Suggested_Plan,
      Recommendations,
      Message
    } = req.body;

    const prediction = await Prediction.create({
      employeeId: Patient_ID,
      predictedAt: new Date(),
      predictionType: 'health_assessment',
      predictionValue: Health_Status,
      confidence: 0.95,
      factors: Recommendations,
      additionalData: {
        insuranceConsumption: Insurance_Consumption,
        needsInsuranceUpdate: Needs_Insurance_Update,
        suggestedPlan: Suggested_Plan
      },
      customData: {
        message: Message
      }
    });

    res.status(201).json({
      Patient_ID,
      Health_Status,
      Insurance_Consumption,
      Needs_Insurance_Update,
      Suggested_Plan,
      Recommendations,
      Message
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prediction',
      error: error.message
    });
  }
};

module.exports = {
  getAllPredictions,
  getPredictionById,
  getPredictionsByEmployeeId,
  getPredictionsByType,
  createPrediction
}; 