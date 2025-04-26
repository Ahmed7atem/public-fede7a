const { HealthData } = require('../../models');

/**
 * @desc    Get all health data
 * @route   GET /api/health
 * @access  Private/Admin
 */
const getAllHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.find().limit(10).lean();
    console.log(`Found ${healthData.length} total health records`);
    
    // Log the first record's employee ID format for debugging
    if (healthData.length > 0) {
      console.log(`Sample health data - employee field format: ${healthData[0].employee}`);
    }
    
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
    
    // We now know the field name is definitely 'employee' for health data
    // Build a targeted query with variations of the ID format
    const query = {
      $or: [
        // Try exact match
        { employee: id },
        
        // Try without dashes
        { employee: id.replace(/-/g, '') },
        
        // Try case-insensitive regex as fallback
        { employee: { $regex: new RegExp(id, 'i') } }
      ]
    };
    
    console.log(`Executing targeted query for health data on 'employee' field`);
    const healthData = await HealthData.findOne(query).lean();
    console.log(`Health data found: ${healthData ? 'Yes' : 'No'}`);
    
    // Always return the result, even if null (status 200)
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