const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Policy, Claim } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
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
    const employees = await Employee.find()
      .select('-password')
      .lean();

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      message: 'Error fetching employees',
      error: error.message 
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.id);
    
    const employee = await Employee.findOne({ 
      $or: [
        { _id: employeeId },
        { employeeId: employeeId }
      ]
    }).select('-password');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee.toObject());
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      message: 'Error fetching employee',
      error: error.message 
    });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const { email, password, ...employeeData } = req.body;
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const employee = new Employee({
      ...employeeData,
      email,
      password: hashedPassword
    });

    await employee.save();

    // Remove password from response
    const { password: _, ...newEmployee } = employee.toObject();

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ 
      message: 'Error creating employee',
      error: error.message 
    });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.id);
    const { password, ...updateData } = req.body;

    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const employee = await Employee.findOneAndUpdate(
      { 
        $or: [
          { _id: employeeId },
          { employeeId: employeeId }
        ]
      },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee.toObject());
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ 
      message: 'Error updating employee',
      error: error.message 
    });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.id);
    
    const employee = await Employee.findOneAndDelete({ 
      $or: [
        { _id: employeeId },
        { employeeId: employeeId }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      message: 'Error deleting employee',
      error: error.message 
    });
  }
});

// Get all employee data
router.get('/all/data', async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password')
      .lean();

    const employeeData = await Promise.all(employees.map(async (employee) => {
      // Get health data using employee.employeeId
      const healthData = await HealthData.findOne({ employee: employee.employeeId });
      
      // Get wearable data using employee.employeeId
      const wearableData = await WearableData.find({ employee: employee.employeeId })
        .sort({ timestamp: -1 })
        .limit(30);
      
      // Get sleep data using employee.employeeId
      const sleepData = await SleepData.find({ employee: employee.employeeId })
        .sort({ date: -1 })
        .limit(7);
      
      // Get policy using Policy_ID
      const policy = await Policy.findOne({ policyId: employee.Policy_ID });
      
      // Get claims using employee.employeeId
      const claims = await Claim.find({ employee: employee.employeeId });

      // Log the data for debugging
      console.log(`Employee ${employee.employeeId} data:`, {
        healthData: healthData ? 'Found' : 'Not found',
        wearableData: wearableData.length,
        sleepData: sleepData.length,
        policy: policy ? 'Found' : 'Not found',
        claims: claims.length
      });

      return {
        ...employee,
        healthData: healthData || null,
        wearableData: wearableData || [],
        sleepData: sleepData || [],
        policy: policy || null,
        claims: claims || []
      };
    }));

    // Log summary of data
    console.log('Data summary:', {
      totalEmployees: employees.length,
      employeesWithHealthData: employeeData.filter(e => e.healthData).length,
      employeesWithWearableData: employeeData.filter(e => e.wearableData.length > 0).length,
      employeesWithSleepData: employeeData.filter(e => e.sleepData.length > 0).length,
      employeesWithPolicy: employeeData.filter(e => e.policy).length,
      employeesWithClaims: employeeData.filter(e => e.claims.length > 0).length
    });

    res.json(employeeData);
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ 
      message: 'Error fetching employee data',
      error: error.message 
    });
  }
});

module.exports = router;