const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import schemas
const { Employee, HealthData, WearableData } = require('../models/schemas');

// Local MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/health_prediction';

// Helper function to convert time string (HH:MM) to minutes
function convertTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
  return hours * 60 + minutes;
}

// Helper function to convert time string to 24-hour format
function convertTo24Hour(timeStr) {
  if (!timeStr) return null;
  
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(num => parseInt(num));
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

// Helper function to parse sleep quality percentage
function parseSleepQuality(qualityStr) {
  if (!qualityStr) return null;
  return parseInt(qualityStr.replace('%', ''));
}

// Helper function to format sleep notes
function formatSleepNotes(notes) {
  if (!notes) return null;
  return notes.split(',').map(note => note.trim()).join(', ');
}

async function populateLocalDB() {
  try {
    // Connect to local MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to local MongoDB');

    // Clear existing data
    await Employee.deleteMany({ role: { $ne: 'admin' } }); // Preserve admin users
    await HealthData.deleteMany({});
    await WearableData.deleteMany({});
    console.log('Cleared existing data (preserved admin users)');

    // Read and process GP data (employees and health data)
    const employees = [];
    const healthData = [];
    
    // Read GP data first
    const gpData = await new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream('data/GP-2025-full-data.csv')
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });

    // Process GP data and create employees and health records
    console.log(`Processing ${gpData.length} GP records...`);
    
    for (const row of gpData) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Create employee with all required fields
        const employee = {
          _id: row.Patient_ID,
          name: `Patient ${row.Patient_ID.substring(0, 8)}`,
          email: `patient${row.Patient_ID.substring(0, 8)}@example.com`,
          password: hashedPassword,
          role: 'employee',
          gender: row.Gender.toLowerCase(),
          age: parseInt(row.Age),
          children: parseInt(row.children),
          smoker: row.smoker === 'yes',
          planName: row.Plan_Name,
          coverageDetails: row.Coverage_Details,
          startDate: new Date(row.Start_Date),
          endDate: new Date(row.End_Date)
        };
        employees.push(employee);

        // Create health data
        const health = {
          employee: row.Patient_ID,
          weight: parseFloat(row.Weight_kg),
          height: parseFloat(row.Height_cm),
          bmi: parseFloat(row.BMI),
          hemoglobin: parseFloat(row.Hemoglobin_g_dL),
          cholesterol: parseFloat(row.Cholesterol_mg_dL),
          bloodSugar: parseFloat(row.Blood_Sugar_mg_dL),
          creatinine: parseFloat(row.Creatinine_mg_dL),
          chronicDisease: row.Chronic_Disease || 'None',
          familyHistory: row.family_medical_history || 'None',
          recordedAt: new Date()
        };
        healthData.push(health);
      } catch (error) {
        console.error(`Error processing GP record:`, error);
        console.error('Problematic row:', row);
      }
    }

    // Save employees and health data
    console.log(`Inserting ${employees.length} employees...`);
    await Employee.insertMany(employees, { ordered: false });
    console.log(`Inserting ${healthData.length} health records...`);
    await HealthData.insertMany(healthData, { ordered: false });
    console.log(`Inserted ${employees.length} employees and health records`);

    // Read Apple Watch data
    const appleWatchData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/apple_watch_data.csv')
        .pipe(csv())
        .on('data', (row) => appleWatchData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // Read sleep data
    const sleepData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/sleep_data.csv')
        .pipe(csv())
        .on('data', (row) => sleepData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process wearable data for each employee
    for (const employee of employees) {
      const employeeId = employee._id;
      
      // Only create wearable data for John Doe
      if (employeeId !== '8f7b7927-6c04-401a-ab0b-61000132f970') {
        continue; // Skip other employees
      }
      
      const startDate = new Date('2025-02-08');
      const wearableDataEntries = [];

      // Process each day
      for (let i = 0; i < Math.max(appleWatchData.length, sleepData.length); i++) {
        // Create a new date for each entry, starting from startDate
        const entryDate = new Date(startDate);
        entryDate.setDate(startDate.getDate() + i);
        
        // Get Apple Watch data for this day (if available)
        const appleWatchRecord = i < appleWatchData.length ? appleWatchData[i] : null;
        
        // Get sleep data for this day (if available)
        const sleepRecord = i < sleepData.length ? sleepData[i] : null;
        
        // Create a combined record
        const wearableRecord = {
          employee: employeeId,
          logDate: entryDate,
          // Apple Watch data
          stepCount: appleWatchRecord ? parseInt(appleWatchRecord['Step Count (steps)']) || 0 : 0,
          activeEnergyKj: appleWatchRecord ? parseFloat(appleWatchRecord['Active Energy (kJ)']) || 0 : 0,
          exerciseTimeMin: appleWatchRecord ? parseInt(appleWatchRecord['Apple Exercise Time (min)']) || 0 : 0,
          standHours: appleWatchRecord ? parseInt(appleWatchRecord['Apple Stand Hour (hours)']) || 0 : 0,
          standTimeMin: appleWatchRecord ? parseInt(appleWatchRecord['Apple Stand Time (min)']) || 0 : 0,
          envAudioExposure: appleWatchRecord ? parseFloat(appleWatchRecord['Environmental Audio Exposure (dBASPL)']) || null : null,
          flightsClimbed: appleWatchRecord ? parseFloat(appleWatchRecord['Flights Climbed (count)']) || null : null,
          headphoneAudioExposure: appleWatchRecord ? parseFloat(appleWatchRecord['Headphone Audio Exposure (dBASPL)']) || null : null,
          heartRateMin: appleWatchRecord ? parseInt(appleWatchRecord['Heart Rate [Min] (bpm)']) || null : null,
          heartRateMax: appleWatchRecord ? parseInt(appleWatchRecord['Heart Rate [Max] (bpm)']) || null : null,
          heartRateAvg: appleWatchRecord ? parseFloat(appleWatchRecord['Heart Rate [Avg] (bpm)']) || null : null,
          heartRateVariability: appleWatchRecord ? parseFloat(appleWatchRecord['Heart Rate Variability (ms)']) || null : null,
          physicalEffortMet: appleWatchRecord ? parseFloat(appleWatchRecord['Physical Effort (MET)']) || null : null,
          restingEnergyKj: appleWatchRecord ? parseFloat(appleWatchRecord['Resting Energy (kJ)']) || null : null,
          restingHeartRate: appleWatchRecord ? parseFloat(appleWatchRecord['Resting Heart Rate (bpm)']) || null : null,
          walkingRunningDistanceKm: appleWatchRecord ? parseFloat(appleWatchRecord['Walking + Running Distance (km)']) || 0 : 0,
          walkingHeartRateAvg: appleWatchRecord ? parseFloat(appleWatchRecord['Walking Heart Rate Average (bpm)']) || null : null,
          walkingSpeedKmh: appleWatchRecord ? parseFloat(appleWatchRecord['Walking Speed (km/hr)']) || null : null,
          walkingStepLengthCm: appleWatchRecord ? parseFloat(appleWatchRecord['Walking Step Length (cm)']) || null : null,
          
          // Sleep data
          sleepStart: sleepRecord ? convertTo24Hour(sleepRecord.Start) : null,
          sleepEnd: sleepRecord ? convertTo24Hour(sleepRecord.End) : null,
          sleepQuality: sleepRecord ? parseSleepQuality(sleepRecord['Sleep quality']) : null,
          timeInBed: sleepRecord ? convertTimeToMinutes(sleepRecord['Time in bed']) : null,
          heartRateSleep: sleepRecord && sleepRecord['Heart rate'] ? parseInt(sleepRecord['Heart rate']) : null,
          notes: sleepRecord && sleepRecord['Sleep Notes'] ? formatSleepNotes(sleepRecord['Sleep Notes']) : null
        };
        
        wearableDataEntries.push(wearableRecord);
      }

      // Insert the wearable data
      await WearableData.insertMany(wearableDataEntries);
      console.log(`Inserted ${wearableDataEntries.length} wearable data entries for employee ${employeeId}`);
    }

    console.log('Database population completed successfully');
    await mongoose.disconnect();
    console.log('Disconnected from local MongoDB');

  } catch (error) {
    console.error('Error populating database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the population script
populateLocalDB(); 