const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { SleepData } = require('../models/schemas');

// Improved helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  // If it's neither, return it as is (could be a string ID)
  return id;
};

// Get all sleep data
router.get('/', async (req, res) => {
  try {
    const sleepData = await SleepData.find();
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// IMPORTANT: Employee routes must come before ID routes to avoid conflicts
// Get sleep data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const id = req.params.employeeId;
    console.log(`Looking for sleep data with employee ID: ${id}`);
    console.log('User role:', req.user ? req.user.role : 'unknown');
    
    // Log available sleep data to debug
    const allSleepData = await SleepData.find().limit(5);
    console.log('Sample sleep data records:', JSON.stringify(allSleepData.slice(0, 2)));
    console.log('Sample employee field in sleep data:', allSleepData.length > 0 ? allSleepData[0].employee : 'No data');
    
    // Try multiple field names for the employee ID with improved logging
    const query = {
      $or: [
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    };
    
    console.log('Query:', JSON.stringify(query));
    
    const sleepData = await SleepData.find(query).sort({ date: -1 });
    
    console.log(`Found ${sleepData.length} sleep data records for employee: ${id}`);
    
    if (sleepData.length === 0) {
      return res.status(404).json({ message: 'Sleep data not found for this employee' });
    }
    
    res.json(sleepData);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ 
      message: 'Error fetching sleep data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get sleep data by date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const sleepData = await SleepData.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 });
    res.json(sleepData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sleep data by ID - must come after more specific routes
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Looking for sleep data with ID: ${id}`);
    console.log('User role:', req.user ? req.user.role : 'unknown');
    
    // Check if the ID is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    console.log(`Is valid ObjectId: ${isValidObjectId}`);
    
    // Try to find by different ID formats with detailed logging
    const query = {
      $or: [
        { _id: id },
        { employeeId: id },
        { employee: id }
      ]
    };
    
    // Add ObjectId versions if valid
    if (isValidObjectId) {
      const objectId = new mongoose.Types.ObjectId(id);
      query.$or.push({ _id: objectId });
      query.$or.push({ employeeId: objectId });
      query.$or.push({ employee: objectId });
    }
    
    console.log('Query:', JSON.stringify(query));
    
    const sleepData = await SleepData.findOne(query);
    
    if (!sleepData) {
      console.log(`No sleep data found for id: ${id}`);
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    
    console.log(`Found sleep data with _id: ${sleepData._id}`);
    res.json(sleepData);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ 
      message: 'Error fetching sleep data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new sleep data
router.post('/', async (req, res) => {
  try {
    const sleepData = new SleepData(req.body);
    const newSleepData = await sleepData.save();
    res.status(201).json(newSleepData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sleep data
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const sleepData = await SleepData.findOneAndUpdate(
      {
        $or: [
          { _id: id },
          { employeeId: id },
          { employee: id },
          // Also try to match if it's stored as string or ObjectId
          { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
          { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
          { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
        ]
      },
      req.body,
      { new: true }
    );
    
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    
    res.json(sleepData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sleep data
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const sleepData = await SleepData.findOneAndDelete({
      $or: [
        { _id: id },
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    });
    
    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }
    
    res.json({ message: 'Sleep data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 