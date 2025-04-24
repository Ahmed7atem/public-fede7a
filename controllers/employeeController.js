const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
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

// Helper function to calculate age group
const getAgeGroup = (age) => {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    // Try to find by MongoDB _id first
    let employee = null;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      employee = await Employee.findById(req.params.id).select('-password');
    }
    
    // If not found, try to find by UUID id field
    if (!employee) {
      employee = await Employee.findOne({ id: req.params.id }).select('-password');
    }
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, age, gender, role, _id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      _id: _id || new mongoose.Types.ObjectId().toString(), // Use provided ID or generate a new one
      name,
      email,
      password: hashedPassword,
      age: age || 0,
      ageGroup: getAgeGroup(age || 0),
      gender: gender || 'Unknown',
      role: role || 'employee'
    });

    await employee.save();

    const response = employee.toObject();
    delete response.password;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, age, gender, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Try to find by MongoDB _id first
    let employee = null;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      employee = await Employee.findById(req.params.id);
    }
    
    // If not found, try to find by UUID id field
    if (!employee) {
      employee = await Employee.findOne({ id: req.params.id });
    }
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if email is being changed and if it already exists
    if (email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee && existingEmployee._id.toString() !== employee._id.toString()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    employee.name = name;
    employee.email = email;
    employee.age = age || 0;
    employee.gender = gender || 'Unknown';
    employee.role = role || 'employee';

    await employee.save();

    const response = employee.toObject();
    delete response.password;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    // Try to find and delete by MongoDB _id first
    let employee = null;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      employee = await Employee.findByIdAndDelete(req.params.id);
    }
    
    // If not found, try to find and delete by UUID id field
    if (!employee) {
      employee = await Employee.findOneAndDelete({ id: req.params.id });
    }
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;