const { Prediction } = require('../models/schemas');

exports.getAllPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.createPrediction = async (req, res) => {
  try {
    const {
      employee,
      predictionType,
      healthData,
      predictionValue
    } = req.body;

    if (!employee || !predictionType || !healthData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const prediction = new Prediction({
      employee,
      predictionType,
      healthData,
      predictionValue,
      predictedAt: new Date()
    });

    await prediction.save();

    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updatePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    const {
      predictionType,
      healthData,
      predictionValue
    } = req.body;

    if (predictionType) prediction.predictionType = predictionType;
    if (healthData) prediction.healthData = healthData;
    if (predictionValue !== undefined) prediction.predictionValue = predictionValue;

    await prediction.save();

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    await prediction.deleteOne();

    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};