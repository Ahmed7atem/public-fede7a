const { Prediction } = require('../models/schemas');
const { predictHealthRisk } = require('../services/predictionService');

const getAllPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find().populate('employee', 'name email');
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('employee', 'name email');
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPrediction = async (req, res) => {
  try {
    const { employee, predictionType, healthData } = req.body;
    if (!employee || !predictionType || !healthData) {
      return res.status(400).json({ error: 'Employee, prediction type, and health data are required' });
    }

    const predictionResult = await predictHealthRisk(healthData);
    const prediction = new Prediction({
      employee,
      predictedAt: new Date(),
      predictionType,
      predictionValue: predictionResult.predictionValue,
      confidence: predictionResult.confidence,
      factors: predictionResult.factors
    });

    await prediction.save();
    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePrediction = async (req, res) => {
  try {
    const { predictionType, healthData } = req.body;
    if (!predictionType || !healthData) {
      return res.status(400).json({ error: 'Prediction type and health data are required' });
    }

    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });

    const predictionResult = await predictHealthRisk(healthData);
    prediction.predictionType = predictionType;
    prediction.predictionValue = predictionResult.predictionValue;
    prediction.confidence = predictionResult.confidence;
    prediction.factors = predictionResult.factors;

    await prediction.save();
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findByIdAndDelete(req.params.id);
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction,
  deletePrediction
};