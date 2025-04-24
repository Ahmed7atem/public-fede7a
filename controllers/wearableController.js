const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { WearableData } = require('../models/schemas');

// Helper function to handle both UUID and ObjectId
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
  throw new Error('Invalid ID format');
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

// Get wearable data by ID
router.get('/:id', async (req, res) => {
  try {
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findOne({ _id: id });
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get wearable data by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.employeeId);
    const wearableData = await WearableData.find({ employeeId }).sort({ date: -1 });
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get wearable logs by employee ID
router.get('/employee/:employeeId/logs', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.employeeId);
    const { startDate, endDate } = req.query;
    
    let query = { employeeId };
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
      return res.status(404).json({ message: 'No logs found for this employee' });
    }

    // Calculate daily averages
    const averages = {
      steps: logs.reduce((acc, log) => acc + (log.steps || 0), 0) / logs.length,
      heartRate: logs.reduce((acc, log) => acc + (log.heartRate || 0), 0) / logs.length,
      sleepHours: logs.reduce((acc, log) => acc + (log.sleepHours || 0), 0) / logs.length,
      caloriesBurned: logs.reduce((acc, log) => acc + (log.caloriesBurned || 0), 0) / logs.length
    };

    res.json({
      logs,
      averages,
      totalDays: logs.length
    });
  } catch (error) {
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
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findOneAndUpdate(
      { _id: id },
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
    const id = convertToObjectId(req.params.id);
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
    const id = convertToObjectId(req.params.id);
    const wearableData = await WearableData.findOneAndDelete({ _id: id });
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json({ message: 'Wearable data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 