const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import schemas
const { Employee, HealthData, WearableData } = require('../models/schemas');

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI;
    if (!mongoUri) {
      throw new Error('MongoDB connection URI is missing');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      ssl: true,
      authSource: 'admin'
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample employees
const createEmployees = async () => {
  try {
    // Clear existing employees
    await Employee.deleteMany({});
    console.log('Cleared existing employees');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminId = uuidv4();
    const admin = await Employee.create({
      _id: adminId,
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      gender: 'male',
      age: 35,
      children: 0,
      smoker: false,
      planName: 'Premium Health Plan',
      coverageDetails: 'Full coverage with dental and vision',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01')
    });
    console.log('Created admin user:', admin.email);

    // Create regular employee
    const employeePassword = await bcrypt.hash('employee123', 10);
    const employeeId = uuidv4();
    const employee = await Employee.create({
      _id: employeeId,
      name: 'John Doe',
      email: 'john@example.com',
      password: employeePassword,
      role: 'employee',
      department: 'Engineering',
      position: 'Software Engineer',
      gender: 'male',
      age: 28,
      children: 0,
      smoker: false,
      planName: 'Standard Health Plan',
      coverageDetails: 'Basic health coverage',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01')
    });
    console.log('Created employee:', employee.email);

    return { admin, employee };
  } catch (error) {
    console.error('Error creating employees:', error);
    throw error;
  }
};

// Create sample health data
const createHealthData = async (employee) => {
  try {
    // Clear existing health data
    await HealthData.deleteMany({});
    console.log('Cleared existing health data');

    // Create health data for employee
    const healthData = await HealthData.create({
      employee: employee._id,
      recordedAt: new Date(),
      weight: 75,
      height: 180,
      bmi: 23.1,
      hemoglobin: 14.5,
      cholesterol: 180,
      bloodSugar: 95,
      creatinine: 1.1,
      chronicDisease: 'None',
      familyMedicalHistory: 'No significant family history'
    });
    console.log('Created health data for employee');

    return healthData;
  } catch (error) {
    console.error('Error creating health data:', error);
    throw error;
  }
};

// Create sample wearable data
const createWearableData = async (employee) => {
  try {
    // Clear existing wearable data
    await WearableData.deleteMany({});
    console.log('Cleared existing wearable data');

    // Create 30 days of wearable data
    const wearableData = [];
    const startDate = new Date('2025-02-08');

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const data = {
        employee: employee._id,
        logDate: date,
        stepCount: Math.floor(Math.random() * 10000) + 5000,
        activeEnergyKj: Math.floor(Math.random() * 500) + 300,
        exerciseTimeMin: Math.floor(Math.random() * 60) + 30,
        standHours: Math.floor(Math.random() * 12) + 8,
        standTimeMin: Math.floor(Math.random() * 60) + 30,
        envAudioExposure: Math.floor(Math.random() * 80) + 40,
        flightsClimbed: Math.floor(Math.random() * 10) + 2,
        headphoneAudioExposure: Math.floor(Math.random() * 80) + 40,
        heartRateMin: Math.floor(Math.random() * 40) + 50,
        heartRateMax: Math.floor(Math.random() * 40) + 100,
        heartRateAvg: Math.floor(Math.random() * 40) + 70,
        heartRateVariability: Math.floor(Math.random() * 20) + 30,
        physicalEffortMet: Math.floor(Math.random() * 5) + 1,
        restingEnergyKj: Math.floor(Math.random() * 1000) + 500,
        restingHeartRate: Math.floor(Math.random() * 20) + 50,
        walkingRunningDistanceKm: Math.floor(Math.random() * 10) + 2,
        walkingHeartRateAvg: Math.floor(Math.random() * 40) + 80,
        walkingSpeedKmh: Math.floor(Math.random() * 5) + 3,
        walkingStepLengthCm: Math.floor(Math.random() * 20) + 60,
        sleepStart: i < 21 ? '22:00' : null,
        sleepEnd: i < 21 ? '06:00' : null,
        sleepQuality: i < 21 ? Math.floor(Math.random() * 100) : null,
        timeInBed: i < 21 ? Math.floor(Math.random() * 120) + 420 : null,
        heartRateSleep: i < 21 ? Math.floor(Math.random() * 20) + 50 : null,
        notes: i < 21 ? ['Good sleep', 'Stressful day', 'Worked out', 'Drank coffee'][Math.floor(Math.random() * 4)] : null
      };

      wearableData.push(data);
    }

    await WearableData.insertMany(wearableData);
    console.log('Created 30 days of wearable data');

    return wearableData;
  } catch (error) {
    console.error('Error creating wearable data:', error);
    throw error;
  }
};

// Main function to populate the database
const populateDatabase = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Create employees
    const { admin, employee } = await createEmployees();

    // Create health data for employee
    await createHealthData(employee);

    // Create wearable data for employee
    await createWearableData(employee);

    console.log('Database population completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
};

// Run the script
populateDatabase(); 