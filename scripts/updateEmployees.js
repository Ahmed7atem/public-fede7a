const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Define the schema based on the example record
const employeeSchema = new mongoose.Schema({
  Age: String,
  Age_Group: String,
  Gender: String,
  Weight_kg: String,
  Height_cm: String,
  BMI: String,
  Children: String,
  Smoker: String,
  Chronic_Disease: String,
  Chronic_diseases_count: String,
  family_medical_history: String,
  Hemoglobin: String,
  Cholesterol: String,
  Blood_Sugar: String,
  Creatinine: String,
  Policy_ID: String,
  Plan_Name: String,
  Coverage_Details: String,
  Start_Date: String,
  End_Date: String,
  Claimed_Amount: String,
  Department: String,
  Education: String,
  Recruitment_Channel: String,
  No_of_Trainings: String,
  Previous_Year_Rating: String,
  Length_of_Service: String,
  KPIs_Met_80: String,
  Avg_Training_Score: String,
  Insurance_Score: String,
  Smoker_Score: String,
  Family_Score: String,
  Lifestyle_Score: String,
  BMI_Score: String,
  Hemoglobin_Score: String,
  Sugar_Score: String,
  Cholesterol_Score: String,
  Creatinine_Score: String,
  Physical_Score: String,
  Wellness_Score: String,
  email: String,
  password: String,
  policyNumber: String,
  employeeId: String
});

const Employee = mongoose.model('Employee', employeeSchema);

// Function to generate a random password
function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

// Function to generate a policy number
function generatePolicyNumber() {
  return `MED${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

async function updateEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define the CSV file path
    const csvFilePath = '/Volumes/MySSD/GP Code/public-fede7a/data/FinalDataSet.csv';
    
    // Verify the file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    console.log(`Reading CSV file from: ${csvFilePath}`);

    // First, let's read the CSV headers to see what fields we have
    const headers = await new Promise((resolve, reject) => {
      const headers = [];
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          headers.push(...Object.keys(data));
          return false; // Stop after first row
        })
        .on('end', () => resolve(headers))
        .on('error', reject);
    });

    console.log('Available fields in CSV:', headers);

    // Read and process CSV file
    const results = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          // Generate missing fields
          const employeeId = uuidv4();
          const email = `employee${employeeId.slice(0, 8)}@example.com`;
          const password = generatePassword();
          const policyNumber = generatePolicyNumber();

          // Create the record with all fields
          const record = {
            ...data,
            email,
            password,
            policyNumber,
            employeeId
          };

          // Add default values for score fields if not present
          const scoreFields = [
            'Insurance_Score', 'Smoker_Score', 'Family_Score', 'Lifestyle_Score',
            'BMI_Score', 'Hemoglobin_Score', 'Sugar_Score', 'Cholesterol_Score',
            'Creatinine_Score', 'Physical_Score', 'Wellness_Score'
          ];

          scoreFields.forEach(field => {
            if (!record[field]) {
              record[field] = '0';
            }
          });

          results.push(record);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Processed ${results.length} records from CSV`);

    if (results.length === 0) {
      throw new Error('No valid records found in CSV file');
    }

    // Clear existing collection
    await Employee.deleteMany({});
    console.log('Cleared existing collection');

    // Insert new data
    const insertResult = await Employee.insertMany(results);
    console.log(`Successfully inserted ${insertResult.length} records`);

    // Verify the update
    const count = await Employee.countDocuments();
    console.log(`Total records in collection: ${count}`);

  } catch (error) {
    console.error('Error updating employees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update
updateEmployees(); 