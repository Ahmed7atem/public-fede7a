const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      console.log(`Employee with email ${email} not found`);
      return res.status(404).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      console.log(`Password does not match for employee with email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token using _id (not id)
    const token = jwt.sign(
      { employee: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log(`Login successful for employee: ${employee._id}, role: ${employee.role}`);
    
    res.json({
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
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.register = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body - Must be a valid JSON object' });
    }

    const { name, email, password, role, age, gender, children, smoker } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields - Name, email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format - Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password too short - Must be at least 6 characters long' });
    }

    // Check for existing employee
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already registered - This email address is already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new employee
    const employee = new Employee({
      name,
      email,
      age,
      ageGroup: getAgeGroup(age),
      gender,
      password: hashedPassword,
      children: children || 0,
      smoker: smoker || false,
      role: role || 'employee'
    });

    await employee.save();

    // Generate token using _id (not id)
    const token = jwt.sign(
      { employee: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log(`Registration successful for employee: ${employee._id}, role: ${employee.role}`);

    // Prepare response
    const response = employee.toObject ? employee.toObject() : JSON.parse(JSON.stringify(employee));
    delete response.password;
    
    res.status(201).json({ 
      success: true,
      token,
      employee: response
    });
  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    
    // Check for duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('getProfile called with req.employee:', req.employee);
    
    if (!req.employee || !req.employee._id) {
      console.log('No employee found in request object');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Since auth middleware already fetched the employee and attached to req.employee,
    // we can just use that directly instead of fetching again
    const employee = req.employee;
    
    if (!employee) {
      console.log(`Employee with id ${req.employee._id} not found`);
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log(`Profile retrieved for employee: ${employee._id}`);
    
    // Return employee without password
    const employeeObj = employee.toObject();
    delete employeeObj.password;
    
    res.json({
      success: true,
      employee: employeeObj
    });
  } catch (error) {
    console.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const employee = await Employee.findById(req.employee._id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, employee.password);
      if (!isValidPassword) return res.status(401).json({ message: 'Current password is incorrect' });
      employee.password = await bcrypt.hash(newPassword, 10);
    }

    employee.name = name;
    employee.email = email;
    await employee.save();

    const response = employee.toObject();
    delete response.password;
    res.json({
      success: true,
      employee: response
    });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
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