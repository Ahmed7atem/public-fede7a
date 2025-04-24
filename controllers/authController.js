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

// Get user profile with comprehensive data
router.get('/profile', auth, async (req, res) => {
  try {
    // For demo purposes, we'll get the first employee
    // In production, you would use req.user.id
    const employee = await Employee.findOne();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get health data
    const healthData = await HealthData.find({ employee: employee._id })
      .sort({ recordDate: -1 })
      .limit(1);

    // Get wearable data
    const wearableData = await WearableData.find({ employee: employee._id })
      .sort({ recordDate: -1 })
      .limit(1);

    // Get sleep data
    const sleepData = await SleepData.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(1);

    // Get claims data
    const claims = await Claim.find({ employeeId: employee._id })
      .sort({ submissionDate: -1 });

    // Get policy data
    const policy = await Policy.findOne({ employee: employee._id });

    // Calculate health metrics
    const latestHealth = healthData[0];
    const latestWearable = wearableData[0];
    const latestSleep = sleepData[0];

    const bmi = latestHealth ? calculateBMI(latestHealth.weight, latestHealth.height) : null;
    const bmiCategory = bmi ? getBMICategory(bmi) : null;
    const riskScore = calculateHealthRisk(latestHealth, latestWearable);

    res.json({
      personalInfo: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        dateOfBirth: employee.dateOfBirth,
        gender: employee.gender,
        age: employee.age,
        ageGroup: getAgeGroup(employee.age),
        maritalStatus: employee.maritalStatus,
        emergencyContact: employee.emergencyContact
      },
      employmentInfo: {
        employeeId: employee.employeeId,
        department: employee.department,
        role: employee.role,
        joiningDate: employee.joiningDate,
        employmentType: employee.employmentType,
        status: employee.status
      },
      healthMetrics: {
        height: latestHealth?.height,
        weight: latestHealth?.weight,
        bmi: bmi,
        bmiCategory: bmiCategory,
        bloodPressure: latestHealth?.bloodPressure,
        bloodSugar: latestHealth?.bloodSugar,
        cholesterol: latestHealth?.cholesterol,
        hemoglobin: latestHealth?.hemoglobin,
        creatinine: latestHealth?.creatinine,
        lastCheckup: latestHealth?.recordDate
      },
      activityMetrics: {
        steps: latestWearable?.stepCount,
        heartRate: latestWearable?.heartRate,
        calories: latestWearable?.calories,
        lastActivity: latestWearable?.recordDate
      },
      sleepMetrics: {
        duration: latestSleep?.sleepDuration,
        quality: latestSleep?.sleepQuality,
        lastRecord: latestSleep?.date
      },
      riskAssessment: {
        score: riskScore,
        level: riskScore < 2 ? 'Low' : riskScore < 4 ? 'Medium' : 'High',
        factors: [
          ...(bmi && (bmi < 18.5 || bmi >= 25) ? ['BMI'] : []),
          ...(latestHealth?.bloodPressure ? ['Blood Pressure'] : []),
          ...(latestWearable?.stepCount < 5000 ? ['Low Activity'] : []),
          ...(latestWearable?.heartRate > 100 ? ['Elevated Heart Rate'] : []),
          ...(latestSleep?.sleepDuration < 6 ? ['Insufficient Sleep'] : [])
        ]
      },
      insuranceInfo: {
        policyNumber: policy?.policyNumber,
        coverageType: policy?.coverageType,
        startDate: policy?.startDate,
        endDate: policy?.endDate,
        status: policy?.status
      },
      claimsHistory: {
        total: claims.length,
        approved: claims.filter(c => c.status === 'Approved').length,
        pending: claims.filter(c => c.status === 'Submitted').length,
        totalAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0),
        recentClaims: claims.slice(0, 5).map(claim => ({
          id: claim._id,
          claimId: claim.claimId,
          status: claim.status,
          amount: claim.claimAmount,
          submissionDate: claim.submissionDate,
          provider: claim.provider
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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