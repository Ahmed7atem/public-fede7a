const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        detail: 'Email and password are required'
      });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        detail: 'No employee found with this email'
      });
    }

    const isValidPassword = await employee.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        detail: 'Incorrect password'
      });
    }

    // Log employee details to debug
    console.log('Login successful for:', {
      email: employee.email,
      role: employee.role,
      _id: employee._id
    });

    const token = jwt.sign(
      { employee: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return response with virtuals enabled
    res.json({ 
      employee: employee.toJSON(), // This will include the virtual 'id' field
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      detail: error.message 
    });
  }
};

exports.register = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body',
        detail: 'Request body must be a valid JSON object'
      });
    }

    const { name, email, password, role, age, gender, children, smoker } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        detail: 'Name, email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        detail: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        detail: 'Password must be at least 6 characters long'
      });
    }

    // Check for existing employee
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ 
        error: 'Email already registered',
        detail: 'This email address is already in use'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new employee
    const employee = new Employee({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      age,
      ageGroup: getAgeGroup(age),
      gender,
      children: children || 0,
      smoker: smoker || false
    });

    await employee.save();

    // Generate token
    const token = jwt.sign(
      { employee: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Prepare response
    const response = employee.toObject();
    delete response.password;
    
    res.status(201).json({ 
      employee: response,
      token,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      detail: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('Request object in getProfile:', {
      employee: req.employee,
      token: req.token
    });
    
    if (!req.employee || !req.employee._id) {
      console.error('No employee or employee._id in request');
      return res.status(401).json({ error: 'No employee information in request' });
    }

    // User is already attached to req.employee from the auth middleware
    // No need to query the database again
    const employee = req.employee;
    
    // Convert to object and remove password field
    const employeeData = employee.toObject ? employee.toObject() : { ...employee };
    delete employeeData.password;
    
    console.log('Returning employee profile:', employeeData);
    res.json(employeeData);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const employee = await Employee.findById(req.employee._id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, employee.password);
      if (!isValidPassword) return res.status(401).json({ error: 'Current password is incorrect' });
      employee.password = await bcrypt.hash(newPassword, 10);
    }

    employee.name = name;
    employee.email = email;
    await employee.save();

    const response = employee.toObject();
    delete response.password;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
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