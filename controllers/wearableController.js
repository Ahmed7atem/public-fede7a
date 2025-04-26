const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { WearableData } = require('../models/schemas');

// Improved helper function to handle both UUID and ObjectId
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

// Get all wearable data
router.get('/', async (req, res) => {
  try {
    const wearableData = await WearableData.find().sort({ date: -1 });
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// IMPORTANT: Employee routes must come before ID routes to avoid conflicts
// Get wearable data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    console.log(`Looking for wearable data with employee ID: ${req.params.employeeId}`);
    const id = req.params.employeeId;
    
    // Try multiple field names for the employee ID
    const wearableData = await WearableData.find({ 
      $or: [
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    }).sort({ date: -1 });
    
    console.log(`Found ${wearableData.length} wearable data records for employee: ${id}`);
    res.json(wearableData);
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get wearable logs by employee ID
router.get('/employee/:employeeId/logs', async (req, res) => {
  try {
    console.log(`Looking for wearable logs with employee ID: ${req.params.employeeId}`);
    const id = req.params.employeeId;
    const { startDate, endDate } = req.query;
    
    let query = { 
      $or: [
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await WearableData.find(query)
      .sort({ date: -1 })
      .select('date steps heartRate sleepHours caloriesBurned');

    if (!logs || logs.length === 0) {
      console.log(`No logs found for employee: ${id}`);
      return res.status(404).json({ message: 'No logs found for this employee' });
    }

    // Calculate daily averages
    const averages = {
      steps: logs.reduce((acc, log) => acc + (log.steps || 0), 0) / logs.length,
      heartRate: logs.reduce((acc, log) => acc + (log.heartRate || 0), 0) / logs.length,
      sleepHours: logs.reduce((acc, log) => acc + (log.sleepHours || 0), 0) / logs.length,
      caloriesBurned: logs.reduce((acc, log) => acc + (log.caloriesBurned || 0), 0) / logs.length
    };

    console.log(`Found ${logs.length} logs for employee: ${id}`);
    res.json({
      logs,
      averages,
      totalDays: logs.length
    });
  } catch (error) {
    console.error('Error fetching wearable logs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get wearable data by ID - must come after more specific routes
router.get('/:id', async (req, res) => {
  try {
    console.log(`Looking for wearable data with ID: ${req.params.id}`);
    const id = req.params.id;
    
    // Try to find by different ID formats
    const wearableData = await WearableData.findOne({ 
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
    
    if (!wearableData) {
      console.log(`No wearable data found for id: ${id}`);
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    
    console.log(`Found wearable data: ${JSON.stringify(wearableData)}`);
    res.json(wearableData);
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new wearable data
router.post('/', async (req, res) => {
  try {
    const wearableData = new WearableData(req.body);
    const newWearableData = await wearableData.save();
    res.status(201).json(newWearableData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create wearable log
router.post('/log', async (req, res) => {
  try {
    const { employeeId, date, steps, heartRate, sleepHours, caloriesBurned } = req.body;
    
    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    const log = new WearableData({
      employeeId,
      date: new Date(date),
      steps: steps || 0,
      heartRate: heartRate || 0,
      sleepHours: sleepHours || 0,
      caloriesBurned: caloriesBurned || 0
    });

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update wearable data
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const wearableData = await WearableData.findOneAndUpdate(
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
      { new: true, runValidators: true }
    );
    
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    
    res.json(wearableData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update wearable log
router.put('/log/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { steps, heartRate, sleepHours, caloriesBurned } = req.body;
    
    const log = await WearableData.findByIdAndUpdate(
      id,
      {
        steps,
        heartRate,
        sleepHours,
        caloriesBurned,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete wearable data
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const wearableData = await WearableData.findOneAndDelete({ 
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
    
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    
    res.json({ message: 'Wearable data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 