const { HealthData } = require('../models/schemas');
const mongoose = require('mongoose');

// Helper function to convert UUID to ObjectId
function convertToObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  // Convert UUID to ObjectId by taking first 24 chars after removing hyphens
  const hexId = id.replace(/-/g, '').substring(0, 24);
  if (!/^[0-9a-fA-F]{24}$/.test(hexId)) {
    throw new Error('Invalid ID format');
  }
  return new mongoose.Types.ObjectId(hexId);
}

// Get health data
exports.getHealthData = async (req, res) => {
  try {
    const employeeId = req.params.id || req.employee._id;
    
    const healthData = await HealthData.findOne({ employee: employeeId }).sort({ recordedAt: -1 });
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    console.error('Error in getHealthData:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add health data
exports.addHealthData = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    
    const healthData = new HealthData({
      ...req.body,
      employee: employeeId,
      recordedAt: new Date()
    });
    
    await healthData.save();
    res.status(201).json(healthData);
  } catch (error) {
    console.error('Error in addHealthData:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update health data
exports.updateHealthData = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.employee._id;
    
    const healthData = await HealthData.findOneAndUpdate(
      { _id: id, employee: employeeId },
      { $set: req.body },
      { new: true }
    );
    
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    console.error('Error in updateHealthData:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete health data
exports.deleteHealthData = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.employee._id;
    
    const healthData = await HealthData.findOneAndDelete({
      _id: id,
      employee: employeeId
    });
    
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    console.error('Error in deleteHealthData:', error);
    res.status(500).json({ message: error.message });
  }
};