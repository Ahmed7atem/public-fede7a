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
      age: emp.Age,
      ageGroup: emp.Age_Group,
      gender: emp.Gender,
      weight: emp.Weight_kg,
      height: emp.Height_cm,
      bmi: emp.BMI,
      children: emp.Children,
      smoker: emp.Smoker,
      chronicDisease: emp.Chronic_Disease,
      chronicDiseaseCount: emp.Chronic_diseases_count,
      familyMedicalHistory: emp.family_medical_history,
      hemoglobin: emp.Hemoglobin,
      cholesterol: emp.Cholesterol,
      bloodSugar: emp.Blood_Sugar,
      creatinine: emp.Creatinine,
      policyId: emp.Policy_ID,
      planName: emp.Plan_Name,
      coverageDetails: emp.Coverage_Details,
      startDate: emp.Start_Date,
      endDate: emp.End_Date,
      claimedAmount: emp.Claimed_Amount,
      department: emp.Department,
      education: emp.Education,
      recruitmentChannel: emp.Recruitment_Channel,
      noOfTrainings: emp.No_of_Trainings,
      previousYearRating: emp.Previous_Year_Rating,
      lengthOfService: emp.Length_of_Service,
      kpisMet80: emp.KPIs_Met_80,
      avgTrainingScore: emp.Avg_Training_Score,
      insuranceScore: emp.Insurance_Score,
      smokerScore: emp.Smoker_Score,
      familyScore: emp.Family_Score,
      lifestyleScore: emp.Lifestyle_Score,
      bmiScore: emp.BMI_Score,
      hemoglobinScore: emp.Hemoglobin_Score,
      sugarScore: emp.Sugar_Score,
      cholesterolScore: emp.Cholesterol_Score,
      creatinineScore: emp.Creatinine_Score,
      physicalScore: emp.Physical_Score,
      wellnessScore: emp.Wellness_Score
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
      age: employee.Age,
      ageGroup: employee.Age_Group,
      gender: employee.Gender,
      weight: employee.Weight_kg,
      height: employee.Height_cm,
      bmi: employee.BMI,
      children: employee.Children,
      smoker: employee.Smoker,
      chronicDisease: employee.Chronic_Disease,
      chronicDiseaseCount: employee.Chronic_diseases_count,
      familyMedicalHistory: employee.family_medical_history,
      hemoglobin: employee.Hemoglobin,
      cholesterol: employee.Cholesterol,
      bloodSugar: employee.Blood_Sugar,
      creatinine: employee.Creatinine,
      policyId: employee.Policy_ID,
      planName: employee.Plan_Name,
      coverageDetails: employee.Coverage_Details,
      startDate: employee.Start_Date,
      endDate: employee.End_Date,
      claimedAmount: employee.Claimed_Amount,
      department: employee.Department,
      education: employee.Education,
      recruitmentChannel: employee.Recruitment_Channel,
      noOfTrainings: employee.No_of_Trainings,
      previousYearRating: employee.Previous_Year_Rating,
      lengthOfService: employee.Length_of_Service,
      kpisMet80: employee.KPIs_Met_80,
      avgTrainingScore: employee.Avg_Training_Score,
      insuranceScore: employee.Insurance_Score,
      smokerScore: employee.Smoker_Score,
      familyScore: employee.Family_Score,
      lifestyleScore: employee.Lifestyle_Score,
      bmiScore: employee.BMI_Score,
      hemoglobinScore: employee.Hemoglobin_Score,
      sugarScore: employee.Sugar_Score,
      cholesterolScore: employee.Cholesterol_Score,
      creatinineScore: employee.Creatinine_Score,
      physicalScore: employee.Physical_Score,
      wellnessScore: employee.Wellness_Score
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
        age: employee.Age,
        ageGroup: employee.Age_Group,
        gender: employee.Gender,
        weight: employee.Weight_kg,
        height: employee.Height_cm,
        bmi: employee.BMI,
        children: employee.Children,
        smoker: employee.Smoker,
        chronicDisease: employee.Chronic_Disease,
        chronicDiseaseCount: employee.Chronic_diseases_count,
        familyMedicalHistory: employee.family_medical_history,
        hemoglobin: employee.Hemoglobin,
        cholesterol: employee.Cholesterol,
        bloodSugar: employee.Blood_Sugar,
        creatinine: employee.Creatinine,
        policyId: employee.Policy_ID,
        planName: employee.Plan_Name,
        coverageDetails: employee.Coverage_Details,
        startDate: employee.Start_Date,
        endDate: employee.End_Date,
        claimedAmount: employee.Claimed_Amount,
        department: employee.Department,
        education: employee.Education,
        recruitmentChannel: employee.Recruitment_Channel,
        noOfTrainings: employee.No_of_Trainings,
        previousYearRating: employee.Previous_Year_Rating,
        lengthOfService: employee.Length_of_Service,
        kpisMet80: employee.KPIs_Met_80,
        avgTrainingScore: employee.Avg_Training_Score,
        insuranceScore: employee.Insurance_Score,
        smokerScore: employee.Smoker_Score,
        familyScore: employee.Family_Score,
        lifestyleScore: employee.Lifestyle_Score,
        bmiScore: employee.BMI_Score,
        hemoglobinScore: employee.Hemoglobin_Score,
        sugarScore: employee.Sugar_Score,
        cholesterolScore: employee.Cholesterol_Score,
        creatinineScore: employee.Creatinine_Score,
        physicalScore: employee.Physical_Score,
        wellnessScore: employee.Wellness_Score,
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