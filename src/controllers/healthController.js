const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { 
  HealthData, 
  HealthData2020, 
  HealthData2021, 
  HealthData2022, 
  HealthData2023, 
  HealthData2024 
} = require('../../models');

// Constants
const ITEMS_PER_PAGE = 10;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2020;

// Define the health data schema
const healthDataSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: Date, required: true },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  temperature: Number,
  weight: Number,
  height: Number,
  bmi: Number,
  bloodSugar: Number,
  cholesterol: {
    total: Number,
    hdl: Number,
    ldl: Number
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the model only if it doesn't exist
const HealthDataModel = mongoose.models.HealthData || mongoose.model('HealthData', healthDataSchema);

/**
 * @desc    Get all health data with pagination
 * @route   GET /api/health
 * @access  Private/Admin
 */
const getAllHealthData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthDataModel.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthDataModel.countDocuments({})
    ]);

    res.json({
      success: true,
      data: healthData,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching all health data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data for a specific year
 * @route   GET /api/health/year/:year
 * @access  Private/Admin
 */
const getHealthDataByYear = async (req, res) => {
  try {
    const { year } = req.params;
    
    // Validate year format
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year format. Please use YYYY format.'
      });
    }

    // Validate year range
    const yearNum = parseInt(year);
    if (yearNum < MIN_YEAR || yearNum > CURRENT_YEAR) {
      return res.status(400).json({
        success: false,
        message: `Year must be between ${MIN_YEAR} and ${CURRENT_YEAR}`
      });
    }

    // Use the specific year function based on the year
    const yearModelMap = {
      '2020': HealthData2020,
      '2021': HealthData2021,
      '2022': HealthData2022,
      '2023': HealthData2023,
      '2024': HealthData2024
    };

    const Model = yearModelMap[year];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      Model.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments({})
    ]);

    res.json({
      success: true,
      data: healthData,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error in getHealthDataByYear:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health data by year',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data by employee ID with pagination
 * @route   GET /api/health/employee/:employeeId
 * @access  Private
 */
const getHealthDataByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthDataModel.find({ employeeId })
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthDataModel.countDocuments({ employeeId })
    ]);

    if (!healthData || healthData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health data not found for this employee'
      });
    }

    res.json({
      success: true,
      data: healthData,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching health data by employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data by ID
 * @route   GET /api/health/:id
 * @access  Private
 */
const getHealthDataById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const healthData = await HealthDataModel.findOne({ employeeId }).lean();
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
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
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Validate health metrics
    const {
      weight,
      height,
      bloodSugar,
      cholesterol,
      hemoglobin,
      creatinine
    } = req.body;

    // Validate numeric values
    const numericFields = {
      weight: { min: 20, max: 300 }, // kg
      height: { min: 50, max: 250 }, // cm
      bloodSugar: { min: 50, max: 500 }, // mg/dL
      cholesterol: { min: 100, max: 400 }, // mg/dL
      hemoglobin: { min: 5, max: 20 }, // g/dL
      creatinine: { min: 0.1, max: 10 } // mg/dL
    };

    for (const [field, range] of Object.entries(numericFields)) {
      const value = req.body[field];
      if (value !== undefined && (isNaN(value) || value < range.min || value > range.max)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} value. Must be between ${range.min} and ${range.max}`
        });
      }
    }

    const healthData = new HealthDataModel(req.body);
    const savedHealthData = await healthData.save();

    res.status(201).json({
      success: true,
      data: savedHealthData,
      message: 'Health data created successfully'
    });
  } catch (error) {
    console.error('Error creating health data:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating health data',
      error: error.message
    });
  }
};

/**
 * @desc    Update health data
 * @route   PUT /api/health/:id
 * @access  Private/Admin
 */
const updateHealthData = async (req, res) => {
  try {
    const healthData = await HealthDataModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const healthData = await HealthDataModel.findByIdAndDelete(req.params.id);
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
  getHealthDataById,
  createHealthData,
  updateHealthData,
  deleteHealthData
}; 