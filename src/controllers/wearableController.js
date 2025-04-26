const { WearableData } = require('../../models');

/**
 * @desc    Get all wearable data
 * @route   GET /api/wearables
 * @access  Private/Admin
 */
const getAllWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.find().limit(10).lean();
    res.json(wearableData);
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    res.status(500).json({ message: 'Error fetching wearable data', error: error.message });
  }
};

/**
 * @desc    Get wearable data by employee ID
 * @route   GET /api/wearables/employee/:employeeId
 * @access  Private
 */
const getWearableDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    console.log(`Looking for wearable data with employee ID: ${id}`);
    
    // Simple direct approach - exact match like the sleep controller
    const wearableData = await WearableData.find({ employee: id }).sort({ date: -1 }).lean();
    
    // Return whatever we found, even if empty
    res.json(wearableData);
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    res.status(500).json({ message: 'Error fetching wearable data', error: error.message });
  }
};

/**
 * @desc    Create wearable data for an employee
 * @route   POST /api/wearables
 * @access  Private
 */
const createWearableData = async (req, res) => {
  try {
    const wearableData = new WearableData(req.body);
    const savedWearableData = await wearableData.save();
    res.status(201).json(savedWearableData);
  } catch (error) {
    console.error('Error creating wearable data:', error);
    res.status(500).json({ message: 'Error creating wearable data', error: error.message });
  }
};

/**
 * @desc    Update wearable data
 * @route   PUT /api/wearables/:id
 * @access  Private
 */
const updateWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    
    res.json(wearableData);
  } catch (error) {
    console.error('Error updating wearable data:', error);
    res.status(500).json({ message: 'Error updating wearable data', error: error.message });
  }
};

/**
 * @desc    Delete wearable data
 * @route   DELETE /api/wearables/:id
 * @access  Private
 */
const deleteWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.findByIdAndDelete(req.params.id);
    
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    
    res.json({ message: 'Wearable data removed' });
  } catch (error) {
    console.error('Error deleting wearable data:', error);
    res.status(500).json({ message: 'Error deleting wearable data', error: error.message });
  }
};

module.exports = {
  getAllWearableData,
  getWearableDataByEmployeeId,
  createWearableData,
  updateWearableData,
  deleteWearableData
}; 