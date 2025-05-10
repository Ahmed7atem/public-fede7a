const { HealthData } = require('../../models');
const mongoose = require('mongoose');

/**
 * @desc    Get all health data
 * @route   GET /api/health
 * @access  Private/Admin
 */
const getAllHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.find().lean();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health data', error: error.message });
  }
};

/**
 * @desc    Get health data for a specific year
 * @route   GET /api/health/year/:year
 * @access  Private/Admin
 */
const getHealthDataByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const collectionName = `healthdata_${year}`;
    
    // Get the model for the specific year
    const HealthDataModel = mongoose.model(collectionName, HealthData.schema);
    
    const healthData = await HealthDataModel.find().lean();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health data', error: error.message });
  }
};

/**
 * @desc    Get health data by employee ID
 * @route   GET /api/health/employee/:employeeId
 * @access  Private
 */
const getHealthDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    const healthData = await HealthData.findOne({ employeeId: id }).lean();
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found for this employee' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health data', error: error.message });
  }
};

/**
 * @desc    Create health data for an employee
 * @route   POST /api/health
 * @access  Private/Admin
 */
const createHealthData = async (req, res) => {
  try {
    const healthData = new HealthData(req.body);
    const savedHealthData = await healthData.save();
    res.status(201).json(savedHealthData);
  } catch (error) {
    res.status(500).json({ message: 'Error creating health data', error: error.message });
  }
};

/**
 * @desc    Update health data
 * @route   PUT /api/health/:id
 * @access  Private/Admin
 */
const updateHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: 'Error updating health data', error: error.message });
  }
};

/**
 * @desc    Delete health data
 * @route   DELETE /api/health/:id
 * @access  Private/Admin
 */
const deleteHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findByIdAndDelete(req.params.id);
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }
    res.json({ message: 'Health data removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting health data', error: error.message });
  }
};

module.exports = {
  getAllHealthData,
  getHealthDataByYear,
  getHealthDataByEmployeeId,
  createHealthData,
  updateHealthData,
  deleteHealthData
}; 