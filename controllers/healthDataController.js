const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { HealthData, Employee } = require('../models/schemas');

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

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  const heightInMeters = height / 100; // Convert cm to m
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};

// Get all health data
router.get('/', async (req, res) => {
  try {
    const healthData = await HealthData.find().lean();
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ 
      message: 'Error fetching health data',
      error: error.message 
    });
  }
});

// IMPORTANT: Employee routes must come before ID routes to avoid conflicts
// Get health data by employee ID
router.get('/employee/:id', async (req, res) => {
  try {
    console.log(`Looking for health data with employee ID: ${req.params.id}`);
    const id = req.params.id;
    
    // Try to find by different ID formats
    const healthData = await HealthData.findOne({ 
      $or: [
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    }).lean();
    
    if (!healthData) {
      console.log(`No health data found for employee: ${id}`);
      return res.status(404).json({ message: 'Health data not found' });
    }
    
    console.log(`Found health data: ${JSON.stringify(healthData)}`);
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ 
      message: 'Error fetching health data',
      error: error.message 
    });
  }
});

// Get health data by ID - must come after more specific routes
router.get('/:id', async (req, res) => {
  try {
    console.log(`Looking for health data with ID: ${req.params.id}`);
    const id = req.params.id;
    
    // Try to find by different ID formats
    const healthData = await HealthData.findOne({ 
      $or: [
        { _id: id },
        { employeeId: id },
        { employee: id },
        // Also try to match if it's stored as string or ObjectId
        { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employeeId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id },
        { employee: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
      ]
    }).lean();
    
    if (!healthData) {
      console.log(`No health data found for id: ${id}`);
      return res.status(404).json({ message: 'Health data not found' });
    }
    
    console.log(`Found health data: ${JSON.stringify(healthData)}`);
    res.json(healthData);
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ 
      message: 'Error fetching health data',
      error: error.message 
    });
  }
});

// Create new health data
router.post('/', async (req, res) => {
  try {
    const healthData = new HealthData(req.body);
    await healthData.save();
    res.status(201).json(healthData.toObject());
  } catch (error) {
    console.error('Error creating health data:', error);
    res.status(500).json({ 
      message: 'Error creating health data',
      error: error.message 
    });
  }
});

// Update health data
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const healthData = await HealthData.findOneAndUpdate(
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
    ).lean();
    
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }

    res.json(healthData);
  } catch (error) {
    console.error('Error updating health data:', error);
    res.status(500).json({ 
      message: 'Error updating health data',
      error: error.message 
    });
  }
});

// Delete health data
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const healthData = await HealthData.findOneAndDelete({ 
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
    
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found' });
    }

    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    console.error('Error deleting health data:', error);
    res.status(500).json({ 
      message: 'Error deleting health data',
      error: error.message 
    });
  }
});

module.exports = router;