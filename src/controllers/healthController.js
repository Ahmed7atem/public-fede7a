const mongoose = require('mongoose');

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
const HealthData = mongoose.models.HealthData || mongoose.model('HealthData', healthDataSchema);

/**
 * @desc    Get all health data
 * @route   GET /api/health
 * @access  Private/Admin
 */
const getAllHealthData = async (req, res) => {
  try {
    console.log('Getting all health data...');
    const healthData = await HealthData.find({}).lean();
    console.log(`Found ${healthData.length} health data records`);
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching all health data:', error);
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
    const { year } = req.params;
    console.log(`Getting health data for year: ${year}`);
    const currentYear = new Date().getFullYear().toString();
    
    // Determine which collection to use
    let collectionName;
    if (year === currentYear) {
      collectionName = 'healthdatas';
      console.log('Using current year collection:', collectionName);
    } else {
      collectionName = `healthdata_${year}`;
      console.log('Using historical collection:', collectionName);
    }
    
    // Check if collection exists
    console.log('Checking if collection exists...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    console.log('Available collections:', collectionNames);
    
    const collectionExists = collections.some(col => col.name === collectionName);
    console.log(`Collection ${collectionName} exists:`, collectionExists);
    
    if (!collectionExists) {
      console.log(`Collection ${collectionName} not found`);
      return res.status(404).json({
        success: false,
        message: `No health data found for year ${year}`
      });
    }

    console.log(`Creating model for collection: ${collectionName}`);
    const HealthDataModel = mongoose.model(collectionName, healthDataSchema);
    console.log('Fetching data...');
    const healthData = await HealthDataModel.find({}).lean();
    console.log(`Found ${healthData.length} records`);

    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    console.error('Error fetching health data by year:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health data',
      error: error.message
    });
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
    console.log(`Getting health data for employee: ${id}`);
    const healthData = await HealthData.find({ employeeId: id }).lean();
    console.log(`Found ${healthData.length} records for employee ${id}`);
    
    if (!healthData || healthData.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Health data not found for this employee' 
      });
    }
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
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
    const healthData = await HealthData.findOne({ employeeId }).lean();
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

/**
 * @desc    Get health data for 2020
 * @route   GET /api/health/2020
 * @access  Private/Admin
 */
const getHealthData2020 = async (req, res) => {
  try {
    const HealthData2020 = mongoose.model('healthdata_2020', healthDataSchema);
    const healthData = await HealthData2020.find({}).lean();
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching 2020 health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data for 2021
 * @route   GET /api/health/2021
 * @access  Private/Admin
 */
const getHealthData2021 = async (req, res) => {
  try {
    const HealthData2021 = mongoose.model('healthdata_2021', healthDataSchema);
    const healthData = await HealthData2021.find({}).lean();
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching 2021 health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data for 2022
 * @route   GET /api/health/2022
 * @access  Private/Admin
 */
const getHealthData2022 = async (req, res) => {
  try {
    const HealthData2022 = mongoose.model('healthdata_2022', healthDataSchema);
    const healthData = await HealthData2022.find({}).lean();
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching 2022 health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data for 2023
 * @route   GET /api/health/2023
 * @access  Private/Admin
 */
const getHealthData2023 = async (req, res) => {
  try {
    const HealthData2023 = mongoose.model('healthdata_2023', healthDataSchema);
    const healthData = await HealthData2023.find({}).lean();
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching 2023 health data',
      error: error.message
    });
  }
};

/**
 * @desc    Get health data for 2024
 * @route   GET /api/health/2024
 * @access  Private/Admin
 */
const getHealthData2024 = async (req, res) => {
  try {
    const HealthData2024 = mongoose.model('healthdata_2024', healthDataSchema);
    const healthData = await HealthData2024.find({}).lean();
    res.json({
      success: true,
      data: healthData,
      count: healthData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching 2024 health data',
      error: error.message
    });
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