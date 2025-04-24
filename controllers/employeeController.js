const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const HealthData = require('../models/schemas').HealthData;
const WearableData = require('../models/schemas').WearableData;
const SleepData = require('../models/schemas').SleepData;

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
    const employees = await Employee.find({}, '-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, '-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, age, gender, children, smoker } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already registered' });
    }

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

    res.status(201).json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, age, gender, children, smoker, role } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.age = age || employee.age;
    employee.ageGroup = age ? getAgeGroup(age) : employee.ageGroup;
    employee.gender = gender || employee.gender;
    employee.children = children !== undefined ? children : employee.children;
    employee.smoker = smoker !== undefined ? smoker : employee.smoker;
    employee.role = role || employee.role;

    await employee.save();

    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.deleteOne();

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

const getAllEmployeeData = async (req, res) => {
  try {
    const employees = await Employee.find();
    const employeeData = await Promise.all(employees.map(async (employee) => {
      const healthData = await HealthData.find({ employeeId: employee._id });
      const wearableData = await WearableData.find({ employeeId: employee._id });
      const sleepData = await SleepData.find({ employeeId: employee._id });
      
      return {
        ...employee.toObject(),
        healthData,
        wearableData,
        sleepData
      };
    }));

    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllEmployeeData
};