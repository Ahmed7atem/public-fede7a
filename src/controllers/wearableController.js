const { WearableData } = require('../../models');

/**
 * @desc    Get all wearable data
 * @route   GET /api/wearables
 * @access  Private/Admin
 */
const getAllWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.find().limit(10).lean();
    console.log(`Found ${wearableData.length} total wearable records`);
    
    // Log the first record's employee ID format for debugging
    if (wearableData.length > 0) {
      console.log(`Sample wearable data - employee field format: ${wearableData[0].employee}`);
    }
    
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
    
    // We now know the field name is definitely 'employee' for wearable data
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
    
    console.log(`Executing targeted query for wearable data on 'employee' field`);
    const wearableData = await WearableData.find(query).sort({ date: -1 }).lean();
    console.log(`Found ${wearableData.length} wearable data records`);
    
    // Always return the array, even if empty (status 200)
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