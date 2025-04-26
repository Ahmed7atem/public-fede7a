const express = require('express');
const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Policy, Claim } = require('../models/schemas');
const bcrypt = require('bcryptjs');

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
exports.getAllEmployees = async (req, res) => {
  try {
    console.log('Getting all employees. User role:', req.user.role);
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
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Looking up employee with ID:', id);
    console.log('User role:', req.user ? req.user.role : 'unknown');
    
    // Log all employees first to check available IDs
    const allEmployees = await Employee.find().select('employeeId Policy_ID _id email').lean();
    console.log('Available employees:', JSON.stringify(allEmployees.slice(0, 5)));
    console.log(`Total employees in database: ${allEmployees.length}`);
    
    // First try direct match on employeeId
    let employee = await Employee.findOne({ employeeId: id }).select('-password').lean();
    
    if (!employee) {
      console.log('No employee found with employeeId:', id);
      // Try matching against Policy_ID
      employee = await Employee.findOne({ Policy_ID: id }).select('-password').lean();
      
      if (!employee) {
        console.log('No employee found with Policy_ID:', id);
        // Try converting to ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
          console.log('Trying ObjectId match for:', id);
          employee = await Employee.findOne({ _id: new mongoose.Types.ObjectId(id) }).select('-password').lean();
        }
      }
    }
    
    if (!employee) {
      console.log('Employee not found with any ID type');
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Found employee:', employee.employeeId);

    // Transform the response to match the expected format
    const transformedEmployee = {
      _id: employee._id,
      employeeId: employee.employeeId,
      age: employee.Age,
      gender: employee.Gender,
      weight: employee.Weight_kg,
      height: employee.Height_cm,
      bmi: employee.BMI,
      children: employee.Children,
      smoker: employee.Smoker === 'Yes',
      chronicDisease: employee.Chronic_Disease,
      chronicDiseasesCount: employee.Chronic_diseases_count,
      familyMedicalHistory: employee.family_medical_history,
      healthMetrics: {
        hemoglobin: employee.Hemoglobin,
        cholesterol: employee.Cholesterol,
        bloodSugar: employee.Blood_Sugar,
        creatinine: employee.Creatinine
      },
      policy: {
        id: employee.Policy_ID,
        number: employee.policyNumber,
        name: employee.Plan_Name,
        coverageDetails: employee.Coverage_Details,
        startDate: employee.Start_Date,
        endDate: employee.End_Date,
        claimedAmount: employee.Claimed_Amount
      },
      employment: {
        department: employee.Department,
        education: employee.Education,
        recruitmentChannel: employee.Recruitment_Channel,
        trainings: employee.No_of_Trainings,
        rating: employee.Previous_Year_Rating,
        lengthOfService: employee.Length_of_Service,
        kpisMet: employee.KPIs_Met_80 === '1'
      },
      scores: {
        training: employee.Avg_Training_Score,
        insurance: employee.Insurance_Score,
        smoker: employee.Smoker_Score,
        family: employee.Family_Score,
        lifestyle: employee.Lifestyle_Score,
        bmi: employee.BMI_Score,
        hemoglobin: employee.Hemoglobin_Score,
        sugar: employee.Sugar_Score,
        cholesterol: employee.Cholesterol_Score,
        creatinine: employee.Creatinine_Score,
        physical: employee.Physical_Score,
        wellness: employee.Wellness_Score
      },
      email: employee.email
    };

    res.json(transformedEmployee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      message: 'Error fetching employee',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    console.log('Creating new employee. User role:', req.user.role);
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
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    console.log('Updating employee. User role:', req.user.role);
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
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    console.log('Deleting employee. User role:', req.user.role);
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
};

// Get all employee data
exports.getAllEmployeeData = async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password')
      .lean();

    const employeeData = await Promise.all(employees.map(async (employee) => {
      // Get health data using employee.employeeId
      const healthData = await HealthData.findOne({ employeeId: employee.employeeId });
      
      // Get wearable data using employee.employeeId
      const wearableData = await WearableData.find({ employeeId: employee.employeeId })
        .sort({ timestamp: -1 })
        .limit(30);
      
      // Get sleep data using employee.employeeId
      const sleepData = await SleepData.find({ employeeId: employee.employeeId })
        .sort({ date: -1 })
        .limit(7);
      
      // Get policy using Policy_ID
      const policy = await Policy.findOne({ policyId: employee.Policy_ID });
      
      // Get claims using employee.employeeId
      const claims = await Claim.find({ employeeId: employee.employeeId });

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
};

module.exports = exports;