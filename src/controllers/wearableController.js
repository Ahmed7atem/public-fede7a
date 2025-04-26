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
    
    // Added for debugging - check what documents exist in the collection
    const allWearableData = await WearableData.find().limit(2).lean();
    console.log('First 2 wearable data documents:', JSON.stringify(allWearableData));
    
    // Added for debugging - try exact match by string
    const wearableData = await WearableData.find({ employee: id.toString() }).sort({ date: -1 }).lean();
    console.log(`Found ${wearableData.length} wearable data records`);
    
    if (wearableData.length === 0) {
      // Added for debugging - try different query approaches
      console.log('Trying alternative query approaches...');
      const regex = new RegExp(id, 'i');
      const alternativeQuery = await WearableData.find({ employee: { $regex: regex } }).limit(5).lean();
      console.log(`Alternative query found ${alternativeQuery.length} records`);
      
      return res.status(404).json({ 
        message: 'Wearable data not found for this employee',
        debug: {
          employeeId: id,
          sampleData: allWearableData.length > 0 ? allWearableData[0].employee : 'No sample data',
          alternativeQueryResults: alternativeQuery.length
        }
      });
    }
    
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