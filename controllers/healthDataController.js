const { HealthData } = require('../models/schemas');

exports.getAllHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.find();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getHealthDataById = async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.createHealthData = async (req, res) => {
  try {
    const {
      employee,
      weight,
      height,
      bmi,
      hemoglobin,
      cholesterol,
      bloodSugar,
      creatinine,
      chronicDisease,
      chronicDiseaseCount,
      familyMedicalHistory
    } = req.body;

    if (!employee || !weight || !height) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const healthData = new HealthData({
      employee,
      weight,
      height,
      bmi: bmi || calculateBMI(weight, height),
      hemoglobin,
      cholesterol,
      bloodSugar,
      creatinine,
      chronicDisease,
      chronicDiseaseCount,
      familyMedicalHistory,
      recordedAt: new Date()
    });

    await healthData.save();

    res.status(201).json(healthData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updateHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }

    const {
      weight,
      height,
      hemoglobin,
      cholesterol,
      bloodSugar,
      creatinine,
      chronicDisease,
      chronicDiseaseCount,
      familyMedicalHistory
    } = req.body;

    if (weight) healthData.weight = weight;
    if (height) healthData.height = height;
    if (weight && height) healthData.bmi = calculateBMI(weight, height);
    if (hemoglobin) healthData.hemoglobin = hemoglobin;
    if (cholesterol) healthData.cholesterol = cholesterol;
    if (bloodSugar) healthData.bloodSugar = bloodSugar;
    if (creatinine) healthData.creatinine = creatinine;
    if (chronicDisease) healthData.chronicDisease = chronicDisease;
    if (chronicDiseaseCount) healthData.chronicDiseaseCount = chronicDiseaseCount;
    if (familyMedicalHistory) healthData.familyMedicalHistory = familyMedicalHistory;

    await healthData.save();

    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.deleteHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }

    await healthData.deleteOne();

    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};