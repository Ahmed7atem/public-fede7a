const { HealthData, WearableData, Employee } = require('../models/schemas');

// Get employee health data
exports.getEmployeeHealthData = async (employeeId) => {
  try {
    const healthData = await HealthData.findOne({ employeeId });
    return healthData || null;
  } catch (error) {
    console.error('Error getting health data:', error);
    throw error;
  }
};

// Get employee wearable data
exports.getEmployeeWearableData = async (employeeId) => {
  try {
    const wearableData = await WearableData.findOne({ employeeId });
    return wearableData || null;
  } catch (error) {
    console.error('Error getting wearable data:', error);
    throw error;
  }
};

// Save health data
exports.saveHealthData = async (employeeId, data) => {
  try {
    const healthData = new HealthData({
      ...data,
      employeeId
    });
    await healthData.save();
    return healthData;
  } catch (error) {
    console.error('Error saving health data:', error);
    throw error;
  }
};

// Save wearable data
exports.saveWearableData = async (employeeId, data) => {
  try {
    const wearableData = new WearableData({
      ...data,
      employeeId
    });
    await wearableData.save();
    return wearableData;
  } catch (error) {
    console.error('Error saving wearable data:', error);
    throw error;
  }
};

// Get all employees data
exports.getAllEmployeesData = async () => {
  try {
    const employees = await Employee.find({});
    return employees;
  } catch (error) {
    console.error('Error getting employees data:', error);
    throw error;
  }
};