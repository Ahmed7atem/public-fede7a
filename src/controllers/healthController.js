const { HealthData } = require('../../models');

/**
 * @desc    Get all health data
 * @route   GET /api/health
 * @access  Private/Admin
 */
const getAllHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.find().limit(10).lean();
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
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
    console.log(`Looking for health data with employee ID: ${id}`);
    
    // First try direct match
    let healthData = await HealthData.findOne({ employee: id }).lean();
    console.log(`Result of direct match: ${healthData ? 'Found' : 'Not found'}`);
    
    // If no results, try different approaches
    if (!healthData) {
      // Try without dashes if ID has them
      if (id.includes('-')) {
        const idWithoutDashes = id.replace(/-/g, '');
        console.log(`Trying without dashes: ${idWithoutDashes}`);
        healthData = await HealthData.findOne({ employee: idWithoutDashes }).lean();
        console.log(`Results without dashes: ${healthData ? 'Found' : 'Not found'}`);
      }
      
      // Try case-insensitive regex
      if (!healthData) {
        console.log('Trying case-insensitive regex match');
        const regex = new RegExp(id, 'i');
        healthData = await HealthData.findOne({ employee: { $regex: regex } }).lean();
        console.log(`Results with regex: ${healthData ? 'Found' : 'Not found'}`);
      }
      
      // Try multiple field match
      if (!healthData) {
        console.log('Trying multiple field match');
        healthData = await HealthData.findOne({
          $or: [
            { employee: id },
            { employeeId: id }
          ]
        }).lean();
        console.log(`Results with multiple fields: ${healthData ? 'Found' : 'Not found'}`);
      }
    }
    
    if (!healthData) {
      return res.status(404).json({ 
        message: 'Health data not found for this employee',
        debug: { employeeIdProvided: id } 
      });
    }
    
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
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
    console.error('Error creating health data:', error);
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
    console.error('Error updating health data:', error);
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
    console.error('Error deleting health data:', error);
    res.status(500).json({ message: 'Error deleting health data', error: error.message });
  }
};

module.exports = {
  getAllHealthData,
  getHealthDataByEmployeeId,
  createHealthData,
  updateHealthData,
  deleteHealthData
}; 