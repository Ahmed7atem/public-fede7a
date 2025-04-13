const fs = require('fs');
const fastcsv = require('fast-csv');
const bcrypt = require('bcryptjs');
const { Employee, HealthData, WearableData } = require('../models/schemas');
const connectDB = require('../config/database');
require('dotenv').config();

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle different date formats
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  // Handle both DD-MM-YY and MM-DD-YY formats
  let day, month, year;
  
  // Check if first part is a valid day (1-31)
  if (parseInt(parts[0]) <= 31) {
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1; // Month is 0-based
  } else {
    // Assume MM-DD-YY format
    month = parseInt(parts[0]) - 1;
    day = parseInt(parts[1]);
  }
  
  year = parseInt('20' + parts[2]); // Assuming 20xx
  
  const date = new Date(year, month, day);
  return date;
}

async function migrateData() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    await Promise.all([
      Employee.deleteMany({}),
      HealthData.deleteMany({}),
      WearableData.deleteMany({})
    ]);

    // Load GP data
    const employees = [];
    const healthData = [];
    const wearableLogs = [];
    let firstEmployeeId = null;

    // Process GP data
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/GP-2025-full-data.csv')
        .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true }))
        .on('data', (row) => {
          if (!row.Patient_ID || !row.Age || !row.Gender) {
            console.warn('Skipping incomplete row:', row);
            return;
          }

          const employeeId = row.Patient_ID;
          if (!firstEmployeeId) {
            firstEmployeeId = employeeId;
          }
          const password = require('crypto').randomBytes(8).toString('hex');
          const hashedPassword = bcrypt.hashSync(password, 10);
          
          // Log the password for this employee
          console.log(`Employee ${employeeId} password: ${password}`);

          employees.push({
            _id: employeeId,
            name: `Employee ${employeeId}`,
            email: `${employeeId}@example.com`,
            age: parseInt(row.Age) || 0,
            gender: row.Gender || 'Unknown',
            password: hashedPassword,
            children: parseInt(row.children) || 0,
            smoker: row.smoker === 'yes',
            role: 'employee',
            planName: row.Insurance_Plan || 'Basic Plan',
            coverageDetails: row.Coverage_Details || 'Standard Coverage',
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          });

          healthData.push({
            employeeId: employeeId,
            recordedAt: new Date(),
            weight: parseFloat(row.Weight_kg) || 70.0,
            height: parseFloat(row.Height_cm) || 170.0,
            bmi: parseFloat(row.BMI) || 24.0,
            hemoglobin: parseFloat(row.Hemoglobin_g_dL) || 14.0,
            cholesterol: parseFloat(row.Cholesterol_mg_dL) || 180.0,
            bloodSugar: parseFloat(row.Blood_Sugar_mg_dL) || 100.0,
            creatinine: parseFloat(row.Creatinine_mg_dL) || 1.0,
            chronicDisease: row.Chronic_Disease || null,
            familyMedicalHistory: row.family_medical_history || null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process Apple Watch data
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/apple_watch_data.csv')
        .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true }))
        .on('data', (row) => {
          const logDate = parseDate(row.Date);
          if (!logDate) {
            console.warn('Invalid date in Apple Watch data:', row.Date);
            return;
          }

          wearableLogs.push({
            employeeId: firstEmployeeId,
            logDate: logDate,
            stepCount: parseInt(row.Steps) || 0,
            activeEnergyKj: parseFloat(row.Active_Energy_kJ) || 0,
            exerciseTimeMin: parseInt(row.Exercise_Time_min) || 0,
            standHours: parseInt(row.Stand_Hours) || 0,
            standTimeMin: parseInt(row.Stand_Time_min) || 0,
            envAudioExposure: parseFloat(row.Environmental_Audio_Exposure_dB) || null,
            flightsClimbed: parseFloat(row.Flights_Climbed) || null,
            headphoneAudioExposure: parseFloat(row.Headphone_Audio_Exposure_dB) || null,
            heartRateMin: parseInt(row.Heart_Rate_min) || null,
            heartRateMax: parseInt(row.Heart_Rate_max) || null,
            heartRateAvg: parseFloat(row.Heart_Rate_avg) || null,
            heartRateVariability: parseFloat(row.Heart_Rate_Variability_ms) || null,
            physicalEffortMet: parseFloat(row.Physical_Effort_MET) || null,
            restingEnergyKj: parseFloat(row.Resting_Energy_kJ) || null,
            restingHeartRate: parseFloat(row.Resting_Heart_Rate) || null,
            walkingRunningDistanceKm: parseFloat(row.Walking_Running_Distance_km) || 0,
            walkingHeartRateAvg: parseFloat(row.Walking_Heart_Rate_avg) || null,
            walkingSpeedKmh: parseFloat(row.Walking_Speed_kmh) || null,
            walkingStepLengthCm: parseFloat(row.Walking_Step_Length_cm) || null,
            sleepStart: row.Sleep_Start || null,
            sleepEnd: row.Sleep_End || null,
            sleepQuality: parseFloat(row.Sleep_Quality) || null,
            timeInBed: parseInt(row.Time_in_Bed_min) || null,
            heartRateSleep: parseInt(row.Heart_Rate_Sleep) || null,
            notes: row.Notes || null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process Sleep data
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/sleep_data.csv')
        .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true }))
        .on('data', (row) => {
          const logDate = parseDate(row.Date);
          if (!logDate) {
            console.warn('Invalid date in Sleep data:', row.Date);
            return;
          }

          // Parse sleep quality percentage
          const sleepQuality = row['Sleep quality'] ? 
            parseFloat(row['Sleep quality'].replace('%', '')) : null;

          // Parse time in bed
          const timeInBed = row['Time in bed'] ? 
            row['Time in bed'].split(':').reduce((acc, time) => (60 * acc) + +time, 0) : null;

          // Find existing wearable log for this date
          const existingLogIndex = wearableLogs.findIndex(log => 
            log.logDate && log.logDate.getTime() === logDate.getTime()
          );

          if (existingLogIndex !== -1) {
            // Update existing log with sleep data
            wearableLogs[existingLogIndex] = {
              ...wearableLogs[existingLogIndex],
              sleepStart: row.Start || null,
              sleepEnd: row.End || null,
              sleepQuality: sleepQuality,
              timeInBed: timeInBed,
              heartRateSleep: parseInt(row['Heart rate']) || null,
              notes: row['Sleep Notes'] || null
            };
          } else {
            // Create new log entry with sleep data
            wearableLogs.push({
              employeeId: firstEmployeeId,
              logDate: logDate,
              stepCount: 0,
              activeEnergyKj: 0,
              exerciseTimeMin: 0,
              standHours: 0,
              standTimeMin: 0,
              walkingRunningDistanceKm: 0,
              sleepStart: row.Start || null,
              sleepEnd: row.End || null,
              sleepQuality: sleepQuality,
              timeInBed: timeInBed,
              heartRateSleep: parseInt(row['Heart rate']) || null,
              notes: row['Sleep Notes'] || null
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert data into MongoDB
    await Promise.all([
      Employee.insertMany(employees),
      HealthData.insertMany(healthData),
      WearableData.insertMany(wearableLogs)
    ]);

    // Create admin user
    const adminPassword = 'admin1234';
    const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
    await Employee.create({
      _id: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      role: 'admin',
      age: 30,
      gender: 'Other',
      children: 0,
      smoker: false,
      planName: 'Admin Plan',
      coverageDetails: 'Full Coverage',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    });

    console.log('Admin user created with password:', adminPassword);
    console.log('Data migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData(); 