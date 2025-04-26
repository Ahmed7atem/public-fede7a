const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { HealthData } = require('../models/schemas');
const { Employee } = require('../models/schemas');

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
};

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  const heightInMeters = height / 100; // Convert cm to m
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};

// Get all health data
router.get('/', async (req, res) => {
  try {
    const healthData = await HealthData.find();
    const formattedHealthData = healthData.map(data => ({
      _id: data._id,
      employeeId: data.employeeId,
      weight: data.weight,
      height: data.height,
      bmi: data.bmi,
      bloodPressure: data.bloodPressure,
      cholesterol: data.cholesterol,
      bloodSugar: data.bloodSugar,
      hemoglobin: data.hemoglobin,
      creatinine: data.creatinine,
      chronicDisease: data.chronicDisease,
      chronicDiseaseCount: data.chronicDiseaseCount,
      familyMedicalHistory: data.familyMedicalHistory,
      recordDate: data.recordDate
    }));
    res.json(formattedHealthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const healthData = await HealthData.findOne({ employeeId: id });
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const healthData = await HealthData.find({ employeeId: req.params.employeeId });
    if (!healthData || healthData.length === 0) {
      return res.status(404).json({ message: 'Health data not found for this employee' });
    }
    res.json(healthData.map(data => ({
      _id: data._id,
      employeeId: data.employeeId,
      weight: data.weight,
      height: data.height,
      bmi: data.bmi,
      bloodPressure: data.bloodPressure,
      cholesterol: data.cholesterol,
      bloodSugar: data.bloodSugar,
      hemoglobin: data.hemoglobin,
      creatinine: data.creatinine,
      chronicDisease: data.chronicDisease,
      chronicDiseaseCount: data.chronicDiseaseCount,
      familyMedicalHistory: data.familyMedicalHistory,
      recordDate: data.recordDate
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new health data
router.post('/', async (req, res) => {
  try {
    const { employeeId, weight, height, bloodPressure, cholesterol, bloodSugar, hemoglobin, creatinine, chronicDisease, familyMedicalHistory } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(2) : null;
    const chronicDiseaseCount = chronicDisease ? chronicDisease.length : 0;

    const healthData = new HealthData({
      employeeId,
      weight,
      height,
      bmi,
      bloodPressure,
      cholesterol,
      bloodSugar,
      hemoglobin,
      creatinine,
      chronicDisease,
      chronicDiseaseCount,
      familyMedicalHistory,
      recordDate: new Date()
    });

    const newHealthData = await healthData.save();

    res.status(201).json({
      _id: newHealthData._id,
      employeeId: newHealthData.employeeId,
      weight: newHealthData.weight,
      height: newHealthData.height,
      bmi: newHealthData.bmi,
      bloodPressure: newHealthData.bloodPressure,
      cholesterol: newHealthData.cholesterol,
      bloodSugar: newHealthData.bloodSugar,
      hemoglobin: newHealthData.hemoglobin,
      creatinine: newHealthData.creatinine,
      chronicDisease: newHealthData.chronicDisease,
      chronicDiseaseCount: newHealthData.chronicDiseaseCount,
      familyMedicalHistory: newHealthData.familyMedicalHistory,
      recordDate: newHealthData.recordDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update health data
router.put('/:id', async (req, res) => {
  try {
    const { weight, height, bloodPressure, cholesterol, bloodSugar, hemoglobin, creatinine, chronicDisease, familyMedicalHistory } = req.body;
    
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }

    const bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(2) : healthData.bmi;
    const chronicDiseaseCount = chronicDisease ? chronicDisease.length : healthData.chronicDiseaseCount;

    healthData.weight = weight || healthData.weight;
    healthData.height = height || healthData.height;
    healthData.bmi = bmi;
    healthData.bloodPressure = bloodPressure || healthData.bloodPressure;
    healthData.cholesterol = cholesterol || healthData.cholesterol;
    healthData.bloodSugar = bloodSugar || healthData.bloodSugar;
    healthData.hemoglobin = hemoglobin || healthData.hemoglobin;
    healthData.creatinine = creatinine || healthData.creatinine;
    healthData.chronicDisease = chronicDisease || healthData.chronicDisease;
    healthData.chronicDiseaseCount = chronicDiseaseCount;
    healthData.familyMedicalHistory = familyMedicalHistory || healthData.familyMedicalHistory;

    const updatedHealthData = await healthData.save();

    res.json({
      _id: updatedHealthData._id,
      employeeId: updatedHealthData.employeeId,
      weight: updatedHealthData.weight,
      height: updatedHealthData.height,
      bmi: updatedHealthData.bmi,
      bloodPressure: updatedHealthData.bloodPressure,
      cholesterol: updatedHealthData.cholesterol,
      bloodSugar: updatedHealthData.bloodSugar,
      hemoglobin: updatedHealthData.hemoglobin,
      creatinine: updatedHealthData.creatinine,
      chronicDisease: updatedHealthData.chronicDisease,
      chronicDiseaseCount: updatedHealthData.chronicDiseaseCount,
      familyMedicalHistory: updatedHealthData.familyMedicalHistory,
      recordDate: updatedHealthData.recordDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete health data
router.delete('/:id', async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    await healthData.deleteOne();
    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;