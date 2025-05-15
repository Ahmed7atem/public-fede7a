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

// Validation ranges
const VALIDATION_RANGES = {
  bloodPressure: {
    systolic: { min: 60, max: 200 },
    diastolic: { min: 40, max: 120 }
  },
  heartRate: { min: 40, max: 200 },
  temperature: { min: 35, max: 42 },
  weight: { min: 20, max: 300 },
  height: { min: 50, max: 250 },
  bloodSugar: { min: 50, max: 500 },
  cholesterol: {
    total: { min: 100, max: 400 },
    hdl: { min: 20, max: 100 },
    ldl: { min: 50, max: 200 }
  }
};

// Helper function for consistent error responses
const errorResponse = (res, status, message, error = null) => {
  const response = {
    success: false,
    message
  };
  if (error) {
    response.error = error.message;
  }
  return res.status(status).json(response);
};

// Helper function for validation
const validateHealthMetrics = (data) => {
  const errors = [];
  
  // Validate blood pressure
  if (data.bloodPressure) {
    if (data.bloodPressure.systolic) {
      const { min, max } = VALIDATION_RANGES.bloodPressure.systolic;
      if (data.bloodPressure.systolic < min || data.bloodPressure.systolic > max) {
        errors.push(`Systolic pressure must be between ${min} and ${max}`);
      }
    }
    if (data.bloodPressure.diastolic) {
      const { min, max } = VALIDATION_RANGES.bloodPressure.diastolic;
      if (data.bloodPressure.diastolic < min || data.bloodPressure.diastolic > max) {
        errors.push(`Diastolic pressure must be between ${min} and ${max}`);
      }
    }
  }

  // Validate other metrics
  for (const [field, range] of Object.entries(VALIDATION_RANGES)) {
    if (field !== 'bloodPressure' && field !== 'cholesterol' && data[field]) {
      if (data[field] < range.min || data[field] > range.max) {
        errors.push(`${field} must be between ${range.min} and ${range.max}`);
      }
    }
  }

  return errors;
};

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
      HealthData.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData.countDocuments({})
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
    return errorResponse(res, 500, 'Error fetching health data', error);
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
      return errorResponse(res, 400, 'Invalid year format. Please use YYYY format.');
    }

    // Validate year range
    const yearNum = parseInt(year);
    if (yearNum < MIN_YEAR || yearNum > CURRENT_YEAR) {
      return errorResponse(res, 400, `Year must be between ${MIN_YEAR} and ${CURRENT_YEAR}`);
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
      return errorResponse(res, 400, 'Invalid year');
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
    return errorResponse(res, 500, 'Error fetching health data by year', error);
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
    
    if (!employeeId) {
      return errorResponse(res, 400, 'Employee ID is required');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData.find({ employeeId })
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData.countDocuments({ employeeId })
    ]);

    if (!healthData || healthData.length === 0) {
      return errorResponse(res, 404, 'Health data not found for this employee');
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
    return errorResponse(res, 500, 'Error fetching health data', error);
  }
};

/**
 * @desc    Get health data by ID
 * @route   GET /api/health/:id
 * @access  Private
 */
const getHealthDataById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid health data ID');
    }

    const healthData = await HealthData.findById(id).lean();
    if (!healthData) {
      return errorResponse(res, 404, 'Health data not found');
    }

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Error fetching health data by ID:', error);
    return errorResponse(res, 500, 'Error fetching health data', error);
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
      return errorResponse(res, 400, 'Validation error', errors.array());
    }

    // Validate health metrics
    const validationErrors = validateHealthMetrics(req.body);
    if (validationErrors.length > 0) {
      return errorResponse(res, 400, 'Invalid health metrics', validationErrors);
    }

    const healthData = new HealthData(req.body);
    const savedHealthData = await healthData.save();

    res.status(201).json({
      success: true,
      data: savedHealthData,
      message: 'Health data created successfully'
    });
  } catch (error) {
    console.error('Error creating health data:', error);
    return errorResponse(res, 500, 'Error creating health data', error);
  }
};

/**
 * @desc    Update health data
 * @route   PUT /api/health/:id
 * @access  Private/Admin
 */
const updateHealthData = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid health data ID');
    }

    // Validate health metrics
    const validationErrors = validateHealthMetrics(req.body);
    if (validationErrors.length > 0) {
      return errorResponse(res, 400, 'Invalid health metrics', validationErrors);
    }

    const healthData = await HealthData.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!healthData) {
      return errorResponse(res, 404, 'Health data not found');
    }

    res.json({
      success: true,
      data: healthData,
      message: 'Health data updated successfully'
    });
  } catch (error) {
    console.error('Error updating health data:', error);
    return errorResponse(res, 500, 'Error updating health data', error);
  }
};

/**
 * @desc    Delete health data
 * @route   DELETE /api/health/:id
 * @access  Private/Admin
 */
const deleteHealthData = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid health data ID');
    }

    const healthData = await HealthData.findByIdAndDelete(id);
    if (!healthData) {
      return errorResponse(res, 404, 'Health data not found');
    }

    res.json({
      success: true,
      message: 'Health data removed successfully'
    });
  } catch (error) {
    console.error('Error deleting health data:', error);
    return errorResponse(res, 500, 'Error deleting health data', error);
  }
};

// Year-specific health data functions
const getHealthData2020 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData2020.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData2020.countDocuments({})
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
    console.error('Error fetching 2020 health data:', error);
    return errorResponse(res, 500, 'Error fetching 2020 health data', error);
  }
};

const getHealthData2021 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData2021.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData2021.countDocuments({})
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
    console.error('Error fetching 2021 health data:', error);
    return errorResponse(res, 500, 'Error fetching 2021 health data', error);
  }
};

const getHealthData2022 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData2022.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData2022.countDocuments({})
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
    console.error('Error fetching 2022 health data:', error);
    return errorResponse(res, 500, 'Error fetching 2022 health data', error);
  }
};

const getHealthData2023 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData2023.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData2023.countDocuments({})
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
    console.error('Error fetching 2023 health data:', error);
    return errorResponse(res, 500, 'Error fetching 2023 health data', error);
  }
};

const getHealthData2024 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const [healthData, total] = await Promise.all([
      HealthData2024.find({})
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthData2024.countDocuments({})
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
    console.error('Error fetching 2024 health data:', error);
    return errorResponse(res, 500, 'Error fetching 2024 health data', error);
  }
};

module.exports = {
  getAllHealthData,
  getHealthDataByYear,
  getHealthDataByEmployeeId,
  getHealthDataById,
  createHealthData,
  updateHealthData,
  deleteHealthData,
  getHealthData2020,
  getHealthData2021,
  getHealthData2022,
  getHealthData2023,
  getHealthData2024
}; 