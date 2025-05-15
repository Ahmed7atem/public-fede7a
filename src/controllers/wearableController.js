const { WearableData } = require('../../models');

/**
 * @desc    Get all wearable data
 * @route   GET /api/wearables
 * @access  Private/Admin
 */
const getAllWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.find().lean();
    res.json(wearableData);
  } catch (error) {
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
    const wearableData = await WearableData.find({ employee: id }).lean();
    res.json(wearableData);
  } catch (error) {
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
    res.status(500).json({ message: 'Error deleting wearable data', error: error.message });
  }
};

/**
 * @desc    Get wearable data by ID
 * @route   GET /api/wearables/:id
 * @access  Private
 */
const getWearableDataById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const wearableData = await WearableData.findOne({ employee: employeeId }).lean();
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wearable data', error: error.message });
  }
};

module.exports = {
  getAllWearableData,
  getWearableDataByEmployeeId,
  createWearableData,
  updateWearableData,
  deleteWearableData,
  getWearableDataById
}; 