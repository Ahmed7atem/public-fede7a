const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { WearableData } = require('../models/schemas');
require('dotenv').config();

// Helper function to convert UUID to ObjectId
function convertToObjectId(uuid) {
  if (mongoose.Types.ObjectId.isValid(uuid)) {
    return new mongoose.Types.ObjectId(uuid);
  }
  // Remove hyphens and ensure it's a valid hex string
  const hexString = uuid.replace(/-/g, '');
  // Take the first 24 characters to create a valid ObjectId
  const validHex = hexString.substring(0, 24);
  return new mongoose.Types.ObjectId(validHex);
}

// Helper function to parse date in DD-MM-YY format
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('-').map(num => parseInt(num));
  return new Date(2000 + year, month - 1, day);
}

// Helper function to parse time in 12-hour format
function parseTime(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes, seconds] = time.split(':').map(num => parseInt(num));
  let adjustedHours = hours;
  
  if (period === 'PM' && hours !== 12) {
    adjustedHours = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    adjustedHours = 0;
  }
  
  return { hours: adjustedHours, minutes, seconds };
}

// Helper function to combine date and time
function combineDateAndTime(date, timeStr) {
  if (!timeStr) return null;
  
  const { hours, minutes, seconds } = parseTime(timeStr);
  const combined = new Date(date);
  combined.setHours(hours, minutes, seconds);
  return combined;
}

// Helper function to format date as key
function formatDateKey(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

// Helper function to convert time string (HH:MM) to minutes
function convertTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
  return hours * 60 + minutes;
}

// Helper function to convert time string (HH:MM:SS AM/PM) to 24-hour format
function convertTo24Hour(timeStr) {
  if (!timeStr) return null;
  
  const [time, period] = timeStr.split(' ');
  const [hours, minutes, seconds] = time.split(':').map(num => parseInt(num));
  
  let adjustedHours = hours;
  if (period === 'PM' && hours !== 12) {
    adjustedHours = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    adjustedHours = 0;
  }
  
  return `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper function to convert time duration (HH:MM) to minutes
function convertDurationToMinutes(durationStr) {
  if (!durationStr) return null;
  
  const [hours, minutes] = durationStr.split(':').map(num => parseInt(num));
  return hours * 60 + minutes;
}

// Helper function to parse sleep quality percentage
function parseSleepQuality(qualityStr) {
  if (!qualityStr) return null;
  
  // Remove the % sign and convert to number
  return parseInt(qualityStr.replace('%', ''));
}

// Helper function to format sleep notes
function formatSleepNotes(notesStr) {
  if (!notesStr) return null;
  
  // Split by colon and join with commas for better readability
  return notesStr.split(':').join(', ');
}

async function repopulateWearableData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_prediction');
    console.log('Connected to MongoDB');

    // Delete all existing wearable data
    await WearableData.deleteMany({});
    console.log('Deleted existing wearable data');

    // Read Apple Watch data
    const appleWatchData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/apple_watch_data.csv')
        .pipe(csv())
        .on('data', (data) => {
          appleWatchData.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${appleWatchData.length} Apple Watch records from CSV`);

    // Read sleep data
    const sleepData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/sleep_data.csv')
        .pipe(csv())
        .on('data', (data) => {
          sleepData.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${sleepData.length} sleep records from CSV`);

    // The correct employee ID (John Doe's ID)
    const employeeId = '8f7b7927-6c04-401a-ab0b-61000132f970';
    
    // Start date: February 8th, 2025
    const startDate = new Date('2025-02-08T00:00:00.000Z');
    
    // Create wearable data entries
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
        timeInBed: sleepRecord ? convertDurationToMinutes(sleepRecord['Time in bed']) : null,
        heartRateSleep: sleepRecord && sleepRecord['Heart rate'] ? parseInt(sleepRecord['Heart rate']) : null,
        notes: sleepRecord && sleepRecord['Sleep Notes'] ? formatSleepNotes(sleepRecord['Sleep Notes']) : null
      };
      
      wearableDataEntries.push(wearableRecord);
    }

    // Insert the data
    await WearableData.insertMany(wearableDataEntries);
    console.log(`Inserted ${wearableDataEntries.length} wearable data entries`);

    // Save the data to a JSON file for verification
    fs.writeFileSync(
      'data/health_prediction.wearabledatas.json',
      JSON.stringify(wearableDataEntries, null, 2)
    );
    console.log('Saved wearable data to JSON file');

    console.log('Repopulation completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

repopulateWearableData(); 