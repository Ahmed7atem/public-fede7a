const { WearableData } = require('../models/schemas');
const mongoose = require('mongoose');

// Helper function to convert UUID to ObjectId
const convertToObjectId = (id) => {
  try {
    // If it's already a valid ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(id)) {
      return id;
    }
    
    // If it's a UUID, convert it to a consistent ObjectId
    // We'll use the first 24 characters of the UUID (removing hyphens)
    const uuidWithoutHyphens = id.replace(/-/g, '');
    const objectIdString = uuidWithoutHyphens.substring(0, 24);
    
    // Ensure it's a valid hex string
    if (!/^[0-9a-fA-F]{24}$/.test(objectIdString)) {
      throw new Error('Invalid ID format');
    }
    
    return new mongoose.Types.ObjectId(objectIdString);
  } catch (error) {
    throw new Error(`Invalid ID format: ${error.message}`);
  }
};

exports.getWearableLogsByEmployeeId = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let employeeId;
    
    // If admin, allow viewing any employee's data
    if (req.employee.role === 'admin') {
      if (!req.params.employeeId) {
        return res.status(400).json({ error: 'Employee ID is required for admin users' });
      }
      try {
        employeeId = convertToObjectId(req.params.employeeId);
      } catch (error) {
        return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
      }
    } else {
      // Regular employees can only view their own data
      try {
        employeeId = convertToObjectId(req.employee._id);
      } catch (error) {
        return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
      }
    }
    
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const wearableData = await WearableData.find({
      employee: employeeId,
      logDate: { $gte: startDate }
    }).sort({ logDate: -1 });
    
    res.json(wearableData);
  } catch (error) {
    console.error('Error in getWearableLogsByEmployeeId:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createWearableLog = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot create wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot create wearable data' });
    }
    
    const {
      logDate,
      stepCount,
      activeEnergyKj,
      exerciseTimeMin,
      standHours,
      standTimeMin,
      envAudioExposure,
      flightsClimbed,
      headphoneAudioExposure,
      heartRateMin,
      heartRateMax,
      heartRateAvg,
      heartRateVariability,
      physicalEffortMet,
      restingEnergyKj,
      restingHeartRate,
      walkingRunningDistanceKm,
      walkingHeartRateAvg,
      walkingSpeedKmh,
      walkingStepLengthCm,
      sleepStart,
      sleepEnd,
      sleepQuality,
      timeInBed,
      heartRateSleep,
      notes
    } = req.body;

    if (!logDate) {
      return res.status(400).json({ error: 'Log date is required' });
    }

    let employeeId;
    try {
      employeeId = convertToObjectId(req.employee._id);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }

    // Find the most recent log for this employee
    const previousLog = await WearableData.findOne({ employee: employeeId })
      .sort({ logDate: -1 });

    const wearableData = new WearableData({
      employee: employeeId,
      logDate: new Date(logDate),
      stepCount: stepCount != null ? parseInt(stepCount) : (previousLog ? previousLog.stepCount : 0),
      activeEnergyKj: activeEnergyKj != null ? parseFloat(activeEnergyKj) : (previousLog ? previousLog.activeEnergyKj : 0),
      exerciseTimeMin: exerciseTimeMin != null ? parseInt(exerciseTimeMin) : (previousLog ? previousLog.exerciseTimeMin : 0),
      standHours: standHours != null ? parseInt(standHours) : (previousLog ? previousLog.standHours : 0),
      standTimeMin: standTimeMin != null ? parseInt(standTimeMin) : (previousLog ? previousLog.standTimeMin : 0),
      envAudioExposure: envAudioExposure != null ? parseFloat(envAudioExposure) : null,
      flightsClimbed: flightsClimbed != null ? parseFloat(flightsClimbed) : null,
      headphoneAudioExposure: headphoneAudioExposure != null ? parseFloat(headphoneAudioExposure) : null,
      heartRateMin: heartRateMin != null ? parseInt(heartRateMin) : null,
      heartRateMax: heartRateMax != null ? parseInt(heartRateMax) : null,
      heartRateAvg: heartRateAvg != null ? parseFloat(heartRateAvg) : null,
      heartRateVariability: heartRateVariability != null ? parseFloat(heartRateVariability) : null,
      physicalEffortMet: physicalEffortMet != null ? parseFloat(physicalEffortMet) : null,
      restingEnergyKj: restingEnergyKj != null ? parseFloat(restingEnergyKj) : null,
      restingHeartRate: restingHeartRate != null ? parseFloat(restingHeartRate) : null,
      walkingRunningDistanceKm: walkingRunningDistanceKm != null ? parseFloat(walkingRunningDistanceKm) : (previousLog ? previousLog.walkingRunningDistanceKm : 0),
      walkingHeartRateAvg: walkingHeartRateAvg != null ? parseFloat(walkingHeartRateAvg) : null,
      walkingSpeedKmh: walkingSpeedKmh != null ? parseFloat(walkingSpeedKmh) : null,
      walkingStepLengthCm: walkingStepLengthCm != null ? parseFloat(walkingStepLengthCm) : null,
      sleepStart: sleepStart || null,
      sleepEnd: sleepEnd || null,
      sleepQuality: sleepQuality != null ? parseFloat(sleepQuality) : null,
      timeInBed: timeInBed != null ? parseInt(timeInBed) : null,
      heartRateSleep: heartRateSleep != null ? parseInt(heartRateSleep) : null,
      notes: notes || null
    });

    await wearableData.save();
    res.status(201).json(wearableData);
  } catch (error) {
    console.error('Error in createWearableLog:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateWearableLog = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot update wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot update wearable data' });
    }
    
    let employeeId;
    try {
      employeeId = convertToObjectId(req.employee._id);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
    
    let wearableDataId;
    try {
      wearableDataId = convertToObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({ error: `Invalid wearable data ID: ${error.message}` });
    }
    
    const wearableData = await WearableData.findOne({
      _id: wearableDataId,
      employee: employeeId
    });

    if (!wearableData) {
      return res.status(404).json({ error: 'Wearable data not found' });
    }

    const updatedWearableData = await WearableData.findByIdAndUpdate(
      wearableDataId,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedWearableData);
  } catch (error) {
    console.error('Error in updateWearableLog:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWearableLog = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot delete wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot delete wearable data' });
    }
    
    let employeeId;
    try {
      employeeId = convertToObjectId(req.employee._id);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
    
    let wearableDataId;
    try {
      wearableDataId = convertToObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({ error: `Invalid wearable data ID: ${error.message}` });
    }
    
    const wearableData = await WearableData.findOne({
      _id: wearableDataId,
      employee: employeeId
    });

    if (!wearableData) {
      return res.status(404).json({ error: 'Wearable data not found' });
    }

    await WearableData.findByIdAndDelete(wearableDataId);
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteWearableLog:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;