const { HealthData, WearableData } = require('../models/schemas');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const HEALTH_AFFAIRS_API_URL = process.env.HEALTH_AFFAIRS_API_URL || 'http://health-affairs-api.example.com/tickets';

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

exports.getHealthSummary = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If admin, allow viewing any employee's data
    let employeeId;
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
    
    const healthData = await HealthData.aggregate([
      {
        $match: {
          employee: employeeId
        }
      },
      {
        $group: {
          _id: null,
          avg_weight: { $avg: '$weight' },
          avg_height: { $avg: '$height' },
          avg_bmi: { $avg: '$bmi' },
          avg_hemoglobin: { $avg: '$hemoglobin' },
          avg_cholesterol: { $avg: '$cholesterol' },
          avg_blood_sugar: { $avg: '$bloodSugar' },
          avg_creatinine: { $avg: '$creatinine' }
        }
      }
    ]);
    
    if (healthData.length === 0) {
      return res.status(404).json({ error: 'No health data found for this employee' });
    }
    
    const summary = healthData[0];
    res.json({
      employee_id: req.params.employeeId || req.employee._id,
      avg_weight: summary.avg_weight ? summary.avg_weight.toFixed(2) : null,
      avg_height: summary.avg_height ? summary.avg_height.toFixed(2) : null,
      avg_bmi: summary.avg_bmi ? summary.avg_bmi.toFixed(2) : null,
      avg_hemoglobin: summary.avg_hemoglobin ? summary.avg_hemoglobin.toFixed(2) : null,
      avg_cholesterol: summary.avg_cholesterol ? summary.avg_cholesterol.toFixed(2) : null,
      avg_blood_sugar: summary.avg_blood_sugar ? summary.avg_blood_sugar.toFixed(2) : null,
      avg_creatinine: summary.avg_creatinine ? summary.avg_creatinine.toFixed(2) : null
    });
  } catch (error) {
    console.error('Error in getHealthSummary:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getWearableTrends = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If admin, allow viewing any employee's data
    let employeeId;
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
    
    const wearableData = await WearableData.aggregate([
      {
        $match: {
          employee: employeeId
        }
      },
      {
        $group: {
          _id: null,
          avg_step_count: { $avg: '$stepCount' },
          avg_sleep_quality: { $avg: '$sleepQuality' },
          avg_time_in_bed: { $avg: '$timeInBed' },
          avg_heart_rate: { $avg: '$heartRateSleep' }
        }
      }
    ]);
    
    if (wearableData.length === 0) {
      return res.status(404).json({ error: 'No wearable data found for this employee' });
    }
    
    const trends = wearableData[0];
    res.json({
      employee_id: req.params.employeeId || req.employee._id,
      avg_step_count: trends.avg_step_count ? trends.avg_step_count.toFixed(2) : null,
      avg_sleep_quality: trends.avg_sleep_quality ? trends.avg_sleep_quality.toFixed(2) : null,
      avg_time_in_bed: trends.avg_time_in_bed ? trends.avg_time_in_bed.toFixed(2) : null,
      avg_heart_rate: trends.avg_heart_rate ? trends.avg_heart_rate.toFixed(2) : null
    });
  } catch (error) {
    console.error('Error in getWearableTrends:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSleepAnalysis = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If admin, allow viewing any employee's data
    let employeeId;
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
    
    const sleepData = await WearableData.aggregate([
      {
        $match: {
          employee: employeeId,
          sleepQuality: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avg_sleep_quality: { $avg: '$sleepQuality' },
          avg_sleep_duration: { $avg: '$timeInBed' },
          min_sleep_quality: { $min: '$sleepQuality' },
          max_sleep_quality: { $max: '$sleepQuality' }
        }
      }
    ]);
    
    if (sleepData.length === 0) {
      return res.status(404).json({ error: 'No sleep data found for this employee' });
    }
    
    const analysis = sleepData[0];
    res.json({
      employee_id: req.params.employeeId || req.employee._id,
      avg_sleep_quality: analysis.avg_sleep_quality ? analysis.avg_sleep_quality.toFixed(2) : null,
      avg_sleep_duration: analysis.avg_sleep_duration ? analysis.avg_sleep_duration.toFixed(2) : null,
      min_sleep_quality: analysis.min_sleep_quality ? analysis.min_sleep_quality.toFixed(2) : null,
      max_sleep_quality: analysis.max_sleep_quality ? analysis.max_sleep_quality.toFixed(2) : null
    });
  } catch (error) {
    console.error('Error in getSleepAnalysis:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityRecommendations = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If admin, allow viewing any employee's data
    let employeeId;
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
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityData = await WearableData.aggregate([
      {
        $match: {
          employee: employeeId,
          logDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          avg_step_count: { $avg: '$stepCount' },
          avg_exercise_time: { $avg: '$exerciseTimeMin' }
        }
      }
    ]);
    
    if (activityData.length === 0) {
      return res.status(404).json({ error: 'No recent wearable data found for this employee' });
    }
    
    const data = activityData[0];
    const avgStepCount = data.avg_step_count || 0;
    const avgExerciseTime = data.avg_exercise_time || 0;
    const recommendations = [];
    
    if (avgStepCount < 8000) {
      recommendations.push('Increase daily steps to at least 8,000 to improve overall activity level.');
    }
    
    if (avgExerciseTime < 30) {
      recommendations.push('Aim for at least 30 minutes of exercise per day to improve cardiovascular health.');
    }
    
    res.json({
      employee_id: req.params.employeeId || req.employee._id,
      avg_step_count: avgStepCount.toFixed(2),
      avg_exercise_time: avgExerciseTime.toFixed(2),
      recommendations
    });
  } catch (error) {
    console.error('Error in getActivityRecommendations:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getHealthAlerts = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If admin, allow viewing any employee's data
    let employeeId;
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
    
    const healthData = await HealthData.findOne({ employee: employeeId })
      .sort({ recordedAt: -1 });
    
    if (!healthData) {
      return res.status(404).json({ error: 'No health data found for this employee' });
    }
    
    const alerts = [];
    
    // Check for high blood sugar
    if (healthData.bloodSugar > 126) {
      alerts.push({
        type: 'high_blood_sugar',
        message: 'Your blood sugar level is above the recommended range. Consider consulting a healthcare provider.'
      });
    }
    
    // Check for high cholesterol
    if (healthData.cholesterol > 200) {
      alerts.push({
        type: 'high_cholesterol',
        message: 'Your cholesterol level is above the recommended range. Consider dietary changes and consulting a healthcare provider.'
      });
    }
    
    // Check for high BMI
    if (healthData.bmi > 25) {
      alerts.push({
        type: 'high_bmi',
        message: 'Your BMI indicates you may be overweight. Consider increasing physical activity and consulting a nutritionist.'
      });
    }
    
    res.json({
      employee_id: req.params.employeeId || req.employee._id,
      alerts
    });
  } catch (error) {
    console.error('Error in getHealthAlerts:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.submitFeedbackTicket = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { message, category } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Submit feedback to external API
    const response = await axios.post(HEALTH_AFFAIRS_API_URL, {
      employee_id: req.employee._id,
      message,
      category: category || 'general',
      status: 'open',
      created_at: new Date().toISOString()
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error in submitFeedbackTicket:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;