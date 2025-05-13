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

module.exports = {
  getAllPredictions,
  getPredictionById,
  getPredictionsByEmployeeId,
  getPredictionsByType
}; 