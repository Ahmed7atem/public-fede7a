const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Import the Dependent model
const { Dependent } = require('../models/schemas');

// Helper function to parse dates
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Remove any whitespace
  dateStr = dateStr.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    // Validate the year is reasonable (between 1900 and current year + 5)
    const year = isoDate.getFullYear();
    const currentYear = new Date().getFullYear();
    if (year >= 1900 && year <= currentYear + 5) {
      return isoDate;
    }
  }

  // Try parsing different date formats
  const formats = [
    { regex: /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/, // MM/DD/YYYY or MM-DD-YYYY
      handler: (matches) => {
        const [_, month, day, year] = matches;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(fullYear, month - 1, day);
        return date;
      }
    },
    { regex: /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
      handler: (matches) => {
        const [_, year, month, day] = matches;
        const date = new Date(year, month - 1, day);
        return date;
      }
    }
  ];

  for (const format of formats) {
    const matches = dateStr.match(format.regex);
    if (matches) {
      const date = format.handler(matches);
      // Validate the date is reasonable
      const year = date.getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(date.getTime()) && year >= 1900 && year <= currentYear + 5) {
        return date;
      }
    }
  }

  console.warn(`Invalid date format: ${dateStr}`);
  return null;
}

async function populateDependents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing dependents
    await Dependent.deleteMany({});
    console.log('Cleared existing dependents collection');

    const results = [];
    let invalidDates = 0;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('/Volumes/MySSD/GP Code/public-fede7a/data/dependents_data.csv')
        .pipe(csv())
        .on('data', (data) => {
          // Parse dates
          const dateOfBirth = parseDate(data.Date_of_Birth);
          const policyStartDate = parseDate(data.Policy_Start_Date);
          const policyEndDate = parseDate(data.Policy_End_Date);

          // Count invalid dates
          if (!dateOfBirth || !policyStartDate || !policyEndDate) {
            invalidDates++;
          }

          // Transform the data to match our schema
          const dependent = {
            dependentId: uuidv4(), // Generate a unique ID
            employeeId: data.Employee_ID, // Map from Employee_ID to employeeId
            relation: data.Relation,
            gender: data.Gender,
            dateOfBirth: dateOfBirth,
            ageGroup: data.Age_Group,
            smoker: data.Smoker === 'Yes',
            chronicConditions: data.Chronic_Conditions,
            hasDisability: data.Has_Disability === 'Yes',
            dependentCoverage: data.Dependent_Coverage,
            coveredUnderPolicy: data.Covered_Under_Policy === 'Yes',
            policyStartDate: policyStartDate,
            policyEndDate: policyEndDate
          };
          results.push(dependent);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${results.length} dependents from CSV`);
    if (invalidDates > 0) {
      console.warn(`Found ${invalidDates} records with invalid dates`);
    }

    // Filter out records with invalid dates
    const validResults = results.filter(d => d.dateOfBirth && d.policyStartDate && d.policyEndDate);
    console.log(`Found ${validResults.length} valid records with proper dates`);

    // Insert all dependents
    await Dependent.insertMany(validResults);
    console.log(`Successfully inserted ${validResults.length} dependents`);

    // Verify the insertion
    const count = await Dependent.countDocuments();
    console.log(`Total dependents in collection: ${count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateDependents(); 