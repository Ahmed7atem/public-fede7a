const { Prediction } = require('../models/schemas');
const { predictHealthRisk } = require('../services/predictionService');

exports.getAllPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find().populate('employeeId', 'name email');
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('employeeId', 'name email');
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPrediction = async (req, res) => {
  try {
    const { employeeId, healthData } = req.body;
    if (!employeeId || !healthData) return res.status(400).json({ error: 'Employee ID and health data are required' });

    const predictionResult = await predictHealthRisk(healthData);
    const prediction = new Prediction({
      employeeId,
      healthData,
      prediction: predictionResult.prediction,
      confidence: predictionResult.confidence,
      factors: predictionResult.factors
    });

    await prediction.save();
    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePrediction = async (req, res) => {
  try {
    const { healthData } = req.body;
    if (!healthData) return res.status(400).json({ error: 'Health data is required' });

    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });

    const predictionResult = await predictHealthRisk(healthData);
    prediction.healthData = healthData;
    prediction.prediction = predictionResult.prediction;
    prediction.confidence = predictionResult.confidence;
    prediction.factors = predictionResult.factors;

    await prediction.save();
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findByIdAndDelete(req.params.id);
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};