const express = require('express');
const router = express.Router();
const { Employee } = require('../models/schemas');
// Remove encryption libraries
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

// Get profile route
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const isAdmin = authHeader === 'ADMIN_TOKEN';
    const email = isAdmin ? 'admin@medbond.com' : 'employee8f7b7927@example.com';
    
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: isAdmin ? 'admin' : 'employee'
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