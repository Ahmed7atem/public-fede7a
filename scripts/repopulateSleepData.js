const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { WearableData } = require('../models/schemas');
require('dotenv').config();

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

async function repopulateSleepData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_prediction');
    console.log('Connected to MongoDB');

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
    
    // Process each sleep record
    for (let i = 0; i < sleepData.length; i++) {
      const sleepRecord = sleepData[i];
      
      // Create a date for this entry
      const entryDate = new Date(startDate);
      entryDate.setDate(startDate.getDate() + i);
      
      // Format the date as YYYY-MM-DD for MongoDB query
      const dateStr = entryDate.toISOString().split('T')[0];
      
      // Find the corresponding wearable record
      const wearableRecord = await WearableData.findOne({
        employee: employeeId,
        logDate: {
          $gte: new Date(`${dateStr}T00:00:00.000Z`),
          $lt: new Date(`${dateStr}T23:59:59.999Z`)
        }
      });
      
      if (wearableRecord) {
        // Update the wearable record with sleep data
        wearableRecord.sleepStart = convertTo24Hour(sleepRecord.Start);
        wearableRecord.sleepEnd = convertTo24Hour(sleepRecord.End);
        wearableRecord.sleepQuality = parseSleepQuality(sleepRecord['Sleep quality']);
        wearableRecord.timeInBed = convertDurationToMinutes(sleepRecord['Time in bed']);
        wearableRecord.heartRateSleep = sleepRecord['Heart rate'] ? parseInt(sleepRecord['Heart rate']) : null;
        wearableRecord.notes = sleepRecord['Sleep Notes'] || null;
        
        await wearableRecord.save();
        console.log(`Updated sleep data for ${dateStr}`);
      } else {
        console.log(`No wearable record found for ${dateStr}`);
      }
    }

    console.log('Sleep data repopulation completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

repopulateSleepData(); 