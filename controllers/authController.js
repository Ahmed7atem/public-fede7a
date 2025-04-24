const express = require('express');
const router = express.Router();
const { Employee } = require('../models/schemas');
// Remove encryption libraries
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { HealthData, WearableData, SleepData, Claim, Policy } = require('../models/schemas');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Simple token validation
    if (token !== 'ADMIN_TOKEN' && token !== 'EMPLOYEE_TOKEN') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // For demo purposes, we'll use a default user ID
    // In production, you would decode the token and get the user ID
    req.user = { id: 'default_user_id' };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Helper function to determine age group
const getAgeGroup = (age) => {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Simple password check
    const isAdmin = email === 'admin@medbond.com';
    const isMatch = isAdmin ? (password === 'adminPass2025') : (password === 'password123');
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Create simple token
    const token = isAdmin ? 'ADMIN_TOKEN' : 'EMPLOYEE_TOKEN';

    return res.json({
      success: true,
      token,
      employee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, age, gender, children, smoker } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing employee
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new employee
    const employee = new Employee({
      name,
      email,
      age,
      ageGroup: getAgeGroup(age),
      gender,
      password,
      children: children || 0,
      smoker: smoker || false,
      role: role || 'employee'
    });

    await employee.save();

    // Create simple token
    const token = role === 'admin' ? 'ADMIN_TOKEN' : 'EMPLOYEE_TOKEN';

    res.status(201).json({ 
      success: true,
      token,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Helper function to calculate health risk score
const calculateHealthRisk = (healthData, wearableData) => {
  let riskScore = 0;
  
  // BMI risk
  if (healthData?.bmi) {
    if (healthData.bmi < 18.5 || healthData.bmi >= 30) riskScore += 2;
    else if (healthData.bmi >= 25) riskScore += 1;
  }
  
  // Blood pressure risk
  if (healthData?.bloodPressure) {
    const [systolic, diastolic] = healthData.bloodPressure.split('/').map(Number);
    if (systolic >= 140 || diastolic >= 90) riskScore += 2;
    else if (systolic >= 130 || diastolic >= 85) riskScore += 1;
  }
  
  // Activity level risk
  if (wearableData) {
    if (wearableData.stepCount < 5000) riskScore += 1;
    if (wearableData.heartRate > 100) riskScore += 1;
    if (wearableData.sleepHours < 6) riskScore += 1;
  }
  
  return riskScore;
};

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.user.id);
    
    // Get all related data
    const [employee, healthData, wearableData, sleepData, claims, policy] = await Promise.all([
      Employee.findById(employeeId),
      HealthData.find({ employeeId }),
      WearableData.find({ employeeId }),
      SleepData.find({ employeeId }),
      Claim.find({ employeeId }),
      Policy.findOne({ employeeId })
    ]);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate health metrics
    const latestHealth = healthData[0] || {};
    const bmi = latestHealth.weight && latestHealth.height ? 
      (latestHealth.weight / ((latestHealth.height / 100) ** 2)).toFixed(2) : null;

    // Calculate wearable metrics
    const wearableStats = wearableData.reduce((acc, data) => ({
      totalSteps: (acc.totalSteps || 0) + (data.steps || 0),
      totalCalories: (acc.totalCalories || 0) + (data.caloriesBurned || 0),
      avgHeartRate: ((acc.avgHeartRate || 0) + (data.heartRate || 0)) / (acc.count || 1),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate sleep metrics
    const sleepStats = sleepData.reduce((acc, data) => ({
      totalSleepHours: (acc.totalSleepHours || 0) + (data.sleepHours || 0),
      avgSleepQuality: ((acc.avgSleepQuality || 0) + (data.sleepQuality || 0)) / (acc.count || 1),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate health risk
    const healthRisk = calculateHealthRisk(latestHealth, wearableData[0]);

    res.json({
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        joinDate: employee.joinDate
      },
      health: {
        latest: {
          weight: latestHealth.weight,
          height: latestHealth.height,
          bmi: bmi,
          bloodPressure: latestHealth.bloodPressure,
          cholesterol: latestHealth.cholesterol,
          bloodSugar: latestHealth.bloodSugar,
          lastUpdated: latestHealth.updatedAt
        },
        riskScore: healthRisk
      },
      wearable: {
        summary: {
          totalSteps: wearableStats.totalSteps,
          totalCalories: wearableStats.totalCalories,
          avgHeartRate: wearableStats.avgHeartRate ? wearableStats.avgHeartRate.toFixed(2) : null,
          lastUpdated: wearableData[0]?.date
        }
      },
      sleep: {
        summary: {
          totalSleepHours: sleepStats.totalSleepHours,
          avgSleepQuality: sleepStats.avgSleepQuality ? sleepStats.avgSleepQuality.toFixed(2) : null,
          lastUpdated: sleepData[0]?.date
        }
      },
      insurance: {
        policy: policy ? {
          policyNumber: policy.policyNumber,
          coverageType: policy.coverageType,
          startDate: policy.startDate,
          endDate: policy.endDate
        } : null,
        claims: claims.map(c => ({
          claimId: c._id,
          date: c.date,
          type: c.type,
          amount: c.amount,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('Error in profile endpoint:', error);
    res.status(500).json({ 
      message: 'Error fetching profile data',
      error: error.message 
    });
  }
});

// Update profile route
router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.name = name;
    employee.email = email;
    await employee.save();

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;