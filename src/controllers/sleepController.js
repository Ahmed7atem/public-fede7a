const { SleepData } = require('../../models');

/**
 * @desc    Get all sleep data
 * @route   GET /api/sleep
 * @access  Private/Admin
 */
const getAllSleepData = async (req, res) => {
  try {
    const sleepData = await SleepData.find().limit(10).lean();
    res.json(sleepData);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
  }
};

/**
 * @desc    Get sleep data by employee ID
 * @route   GET /api/sleep/employee/:employeeId
 * @access  Private
 */
const getSleepDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    console.log(`Looking for sleep data with employee ID: ${id}`);
    
    const sleepData = await SleepData.find({ employee: id }).sort({ startTime: -1 }).lean();
    
    if (sleepData.length === 0) {
      return res.status(404).json({ message: 'Sleep data not found for this employee' });
    }
    
    res.json(sleepData);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
  }
};

/**
 * @desc    Get sleep data by ID
 * @route   GET /api/sleep/:id
 * @access  Private
 */
const getSleepDataById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const sleepData = await SleepData.findOne({ employee: employeeId }).lean();
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
  }
};

/**
 * @desc    Create sleep data for an employee
 * @route   POST /api/sleep
 * @access  Private
 */
const createSleepData = async (req, res) => {
  try {
    const sleepData = new SleepData(req.body);
    const savedSleepData = await sleepData.save();
    res.status(201).json(savedSleepData);
  } catch (error) {
    console.error('Error creating sleep data:', error);
    res.status(500).json({ message: 'Error creating sleep data', error: error.message });
  }
};

/**
 * @desc    Update sleep data
 * @route   PUT /api/sleep/:id
 * @access  Private
 */
const updateSleepData = async (req, res) => {
  try {
    const sleepData = await SleepData.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    
    res.json(sleepData);
  } catch (error) {
    console.error('Error updating sleep data:', error);
    res.status(500).json({ message: 'Error updating sleep data', error: error.message });
  }
};

/**
 * @desc    Delete sleep data
 * @route   DELETE /api/sleep/:id
 * @access  Private
 */
const deleteSleepData = async (req, res) => {
  try {
    const sleepData = await SleepData.findByIdAndDelete(req.params.id);
    
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    
    res.json({ message: 'Sleep data removed' });
  } catch (error) {
    console.error('Error deleting sleep data:', error);
    res.status(500).json({ message: 'Error deleting sleep data', error: error.message });
  }
};

module.exports = {
  getAllSleepData,
  getSleepDataByEmployeeId,
  getSleepDataById,
  createSleepData,
  updateSleepData,
  deleteSleepData
}; 