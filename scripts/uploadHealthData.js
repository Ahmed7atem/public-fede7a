const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Create a dynamic schema for each year
const createHealthDataSchema = (year) => {
  return new mongoose.Schema({
    employeeId: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
    weight: Number,
    height: Number,
    bmi: Number,
    hemoglobin: Number,
    cholesterol: Number,
    bloodSugar: Number,
    creatinine: Number,
    chronicDisease: String,
    chronicDiseaseCount: Number,
    familyMedicalHistory: String,
    claimedAmount: Number,
    insuranceScore: Number,
    smokerScore: Number,
    familyScore: Number,
    lifestyleScore: Number,
    bmiScore: Number,
    hemoglobinScore: Number,
    sugarScore: Number,
    cholesterolScore: Number,
    creatinineScore: Number,
    physicalScore: Number,
    wellnessScore: Number,
    version: String,
    policy: Object
  }, { timestamps: true });
};

// Function to round numbers except for score fields
const processValue = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  
  // Don't round score fields
  if (fieldName.toLowerCase().includes('score')) {
    return parseFloat(value);
  }
  
  // Round other numerical values
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num);
};

const uploadHealthData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // First, let's validate that all files have consistent Patient_IDs
    const patientIds = new Set();
    const filePatientIds = {};

    // Read all Patient_IDs from all files first
    for (let year = 2020; year <= 2024; year++) {
      const filePath = `data/FinalDataSet_${year}.csv`;
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
      }

      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      filePatientIds[year] = new Set(results.map(r => r.Patient_ID).filter(Boolean));
      results.forEach(r => patientIds.add(r.Patient_ID));
    }

    // Validate consistency across files
    console.log('\nValidating Patient_ID consistency across files:');
    for (let year = 2020; year <= 2024; year++) {
      if (filePatientIds[year]) {
        const missingIds = [...patientIds].filter(id => !filePatientIds[year].has(id));
        const extraIds = [...filePatientIds[year]].filter(id => !patientIds.has(id));
        
        console.log(`\nYear ${year}:`);
        console.log(`Total records: ${filePatientIds[year].size}`);
        if (missingIds.length > 0) {
          console.log(`Missing ${missingIds.length} IDs that exist in other files`);
        }
        if (extraIds.length > 0) {
          console.log(`Has ${extraIds.length} IDs that don't exist in other files`);
        }
      }
    }

    // Now proceed with upload
    console.log('\nProceeding with upload...');
    
    // Process each year's data
    for (let year = 2020; year <= 2024; year++) {
      const collectionName = `healthdata_${year}`;
      const HealthDataModel = mongoose.model(collectionName, createHealthDataSchema(year));
      
      // Clear existing data for this year
      await HealthDataModel.deleteMany({});
      console.log(`\nCleared existing health data for ${year}`);

      const filePath = `data/FinalDataSet_${year}.csv`;
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
      }

      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      console.log(`Read ${results.length} records from ${filePath}`);

      // Process each record
      let successCount = 0;
      for (const record of results) {
        const employeeId = record.Patient_ID;
        if (!employeeId) {
          console.log('Skipping record - missing Patient_ID:', record);
          continue;
        }

        try {
          const healthData = new HealthDataModel({
            employeeId: employeeId.trim(), // Ensure no whitespace
            recordedAt: new Date(`${year}-01-01`),
            weight: processValue(record.Weight_kg, 'weight'),
            height: processValue(record.Height_cm, 'height'),
            bmi: processValue(record.BMI, 'bmi'),
            hemoglobin: processValue(record.Hemoglobin, 'hemoglobin'),
            cholesterol: processValue(record.Cholesterol, 'cholesterol'),
            bloodSugar: processValue(record.Blood_Sugar, 'bloodSugar'),
            creatinine: processValue(record.Creatinine, 'creatinine'),
            chronicDisease: record.Chronic_Disease || 'None',
            chronicDiseaseCount: processValue(record.Chronic_diseases, 'chronicDiseaseCount'),
            familyMedicalHistory: record.family_medical_history || 'None',
            claimedAmount: processValue(record.Claimed_Amount, 'claimedAmount'),
            insuranceScore: processValue(record.Insurance_Score, 'insuranceScore'),
            smokerScore: processValue(record.Smoker_Score, 'smokerScore'),
            familyScore: processValue(record.Family_Score, 'familyScore'),
            lifestyleScore: processValue(record.Lifestyle_Score, 'lifestyleScore'),
            bmiScore: processValue(record.BMI_Score, 'bmiScore'),
            hemoglobinScore: processValue(record.Hemoglobin_Score, 'hemoglobinScore'),
            sugarScore: processValue(record.Sugar_Score, 'sugarScore'),
            cholesterolScore: processValue(record.Cholesterol_Score, 'cholesterolScore'),
            creatinineScore: processValue(record.Creatinine_Score, 'creatinineScore'),
            physicalScore: processValue(record.Physical_Score, 'physicalScore'),
            wellnessScore: processValue(record.Wellness_Score, 'wellnessScore'),
            version: '1.0',
            policy: {
              policyId: record.Policy_ID || '',
              planName: record.Plan_Name || '',
              coverageDetails: record.Coverage_Details || '',
              startDate: new Date(record.Start_Date) || new Date(),
              endDate: new Date(record.End_Date) || new Date()
            }
          });

          const saved = await healthData.save();
          if (saved.employeeId !== employeeId.trim()) {
            console.error(`ID mismatch for record: Expected ${employeeId.trim()}, got ${saved.employeeId}`);
          }
          successCount++;
        } catch (error) {
          console.error(`Error saving record with ID ${employeeId}:`, error);
          console.log('Problematic record:', record);
        }
      }

      console.log(`Completed uploading health data for ${year}. Successfully uploaded ${successCount}/${results.length} records.`);
      
      // Verify the uploaded data
      const uploadedCount = await HealthDataModel.countDocuments();
      const distinctIds = await HealthDataModel.distinct('employeeId');
      console.log(`Verification - Collection ${collectionName}:`);
      console.log(`Total documents: ${uploadedCount}`);
      console.log(`Distinct employeeIds: ${distinctIds.length}`);
    }

    console.log('\nAll health data uploads completed');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the upload
uploadHealthData(); 