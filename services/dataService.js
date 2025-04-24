const { HealthData, WearableData, Employee, SleepData } = require('../models/schemas');
const mongoose = require('mongoose');

// Helper function to normalize IDs for comparison
function normalizeId(id) {
  if (!id) return null;
  
  // If it's an ObjectId, convert to string
  if (typeof id === 'object' && id._id) {
    id = id._id.toString();
  } else if (typeof id === 'object') {
    id = id.toString();
  }

  // Remove hyphens and preserve full length
  return id.replace(/-/g, '');
}

// Get employee health data
exports.getEmployeeHealthData = async (employeeId) => {
  try {
    const normalizedId = normalizeId(employeeId);
    const healthData = await HealthData.findOne({ employee: normalizedId })
      .sort({ recordedAt: -1 });
    
    return healthData || null;
  } catch (error) {
    console.error('Error getting health data:', error);
    throw new Error(`Failed to get health data: ${error.message}`);
  }
};

// Get employee wearable data
exports.getEmployeeWearableData = async (employeeId, days = 30) => {
  try {
    const normalizedId = normalizeId(employeeId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const wearableData = await WearableData.find({
      employee: normalizedId,
      logDate: { $gte: startDate }
    }).sort({ logDate: -1 });

    return wearableData;
  } catch (error) {
    console.error('Error getting wearable data:', error);
    throw new Error(`Failed to get wearable data: ${error.message}`);
  }
};

// Save health data
exports.saveHealthData = async (employeeId, data) => {
  try {
    const normalizedId = normalizeId(employeeId);
    
    const healthData = new HealthData({
      ...data,
      employee: normalizedId,
      recordedAt: data.recordedAt || new Date()
    });

    await healthData.save();
    return healthData;
  } catch (error) {
    console.error('Error saving health data:', error);
    throw new Error(`Failed to save health data: ${error.message}`);
  }
};

// Save wearable data
exports.saveWearableData = async (employeeId, data) => {
  try {
    const normalizedId = normalizeId(employeeId);
    
    const wearableData = new WearableData({
      ...data,
      employee: normalizedId,
      logDate: data.logDate || new Date()
    });

    await wearableData.save();
    return wearableData;
  } catch (error) {
    console.error('Error saving wearable data:', error);
    throw new Error(`Failed to save wearable data: ${error.message}`);
  }
};

// Get aggregated wearable data
exports.getAggregatedWearableData = async (employeeId, days = 30) => {
  try {
    const normalizedId = normalizeId(employeeId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const aggregationResult = await WearableData.aggregate([
      {
        $match: {
          employee: normalizedId,
          logDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgStepCount: { $avg: '$stepCount' },
          avgActiveEnergyKj: { $avg: '$activeEnergyKj' },
          avgExerciseTimeMin: { $avg: '$exerciseTimeMin' },
          avgStandHours: { $avg: '$standHours' },
          avgSleepQuality: { $avg: '$sleepQuality' },
          avgTimeInBed: { $avg: '$timeInBed' },
          avgHeartRateSleep: { $avg: '$heartRateSleep' }
        }
      }
    ]);

    return aggregationResult.length > 0 ? aggregationResult[0] : null;
  } catch (error) {
    console.error('Error getting aggregated data:', error);
    throw new Error(`Failed to get aggregated wearable data: ${error.message}`);
  }
};

// Get data for all employees
exports.getAllEmployeesData = async () => {
  try {
    const employees = await Employee.find({});
    
    const employeeData = await Promise.all(
      employees.map(async (employee) => {
        // Get the employee ID as a string
        const employeeId = employee._id.toString();
        
        // Find the most recent health, wearable, and sleep data
        const [healthData, wearableData, sleepData] = await Promise.all([
          HealthData.findOne({ employee: employeeId }).sort({ recordedAt: -1 }),
          WearableData.findOne({ employee: employeeId }).sort({ logDate: -1 }),
          SleepData.findOne({ employee: employeeId }).sort({ startTime: -1 })
        ]);
        
        return {
          employee,
          healthData,
          wearableData,
          sleepData
        };
      })
    );
    
    return employeeData;
  } catch (error) {
    console.error('Error in getAllEmployeesData:', error);
    throw error;
  }
};