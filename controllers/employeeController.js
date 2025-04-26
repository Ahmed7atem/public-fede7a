const express = require('express');
const router = express.Router();
const { Employee, HealthData, WearableData, SleepData } = require('../models/schemas');
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

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({}, '-password');
    const formattedEmployees = employees.map(emp => ({
      employeeId: emp.id,
      _id: emp._id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      age: emp.age,
      gender: emp.gender,
      children: emp.children,
      smoker: emp.smoker,
      region: emp.region,
      bmi: emp.bmi,
      bloodPressure: emp.bloodPressure,
      diabetic: emp.diabetic,
      policyId: emp.policyId,
      charges: emp.charges
    }));
    res.json(formattedEmployees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id }, '-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({
      employeeId: employee.id,
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      age: employee.age,
      gender: employee.gender,
      children: employee.children,
      smoker: employee.smoker,
      region: employee.region,
      bmi: employee.bmi,
      bloodPressure: employee.bloodPressure,
      diabetic: employee.diabetic,
      policyId: employee.policyId,
      charges: employee.charges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const { id, name, email, password, role, age, gender, children, smoker } = req.body;
    
    if (!id || !name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingEmployee = await Employee.findOne({ $or: [{ email }, { id }] });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email or ID already registered' });
    }

    const employee = new Employee({
      id,
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

    const newEmployee = await employee.save();

    res.status(201).json({
      employeeId: newEmployee.id,
      _id: newEmployee._id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { name, email, age, gender, children, smoker, role } = req.body;
    
    const employee = await Employee.findOne({ id: req.params.id });
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

    const updatedEmployee = await employee.save();

    res.json({
      employeeId: updatedEmployee.id,
      _id: updatedEmployee._id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      role: updatedEmployee.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await employee.deleteOne();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all employee data with related information
router.get('/all/data', async (req, res) => {
  try {
    const employees = await Employee.find();
    const employeeData = await Promise.all(employees.map(async (employee) => {
      const healthData = await HealthData.find({ employeeId: employee.id });
      const wearableData = await WearableData.find({ employeeId: employee.id });
      const sleepData = await SleepData.find({ employeeId: employee.id });
      
      return {
        employeeId: employee.id,
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        age: employee.age,
        gender: employee.gender,
        children: employee.children,
        smoker: employee.smoker,
        region: employee.region,
        bmi: employee.bmi,
        bloodPressure: employee.bloodPressure,
        diabetic: employee.diabetic,
        policyId: employee.policyId,
        charges: employee.charges,
        healthData,
        wearableData,
        sleepData
      };
    }));

    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;