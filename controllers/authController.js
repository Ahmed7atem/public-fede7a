const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { employee: employee.id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const response = employee.toObject();
    delete response.password;
    res.json({ employee: response, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      { employee: employee.id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Prepare response
    const response = employee.toObject();
    delete response.password;
    
    res.status(201).json({ 
      employee: {
        _id: employee._id,
        id: employee.id,
        name: employee.name,
        email: employee.email,
        age: employee.age,
        ageGroup: employee.ageGroup,
        gender: employee.gender,
        children: employee.children,
        smoker: employee.smoker,
        role: employee.role
      },
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
    const employee = await Employee.findById(req.employee._id).select('-password');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
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