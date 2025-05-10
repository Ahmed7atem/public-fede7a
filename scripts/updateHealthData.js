const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const { Employee, HealthData } = require('../models');

const updateHealthData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing health data
    await HealthData.deleteMany({});
    console.log('Cleared existing health data');

    const results = [];
    const employees = await Employee.find().lean();
    console.log(`Found ${employees.length} employees in database`);

    // Read CSV file
    fs.createReadStream('data/FinalDataSet.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Read ${results.length} records from CSV`);

        // Process each employee
        for (let i = 0; i < employees.length; i++) {
          const employee = employees[i];
          const record = results[i]; // Match each employee with a health record sequentially
          
          if (!record) {
            console.log(`No health data available for employee: ${employee.employeeId}`);
            continue;
          }

          // Calculate scores
          const bmi = parseFloat(record.BMI) || 0;
          const bmiScore = bmi >= 18.5 && bmi <= 24.9 ? 0.7 : 
                          bmi >= 25 && bmi <= 29.9 ? 0.5 : 0.3;

          const hemoglobin = parseFloat(record.Hemoglobin) || 0;
          const hemoglobinScore = hemoglobin >= 12 && hemoglobin <= 16 ? 0.7 :
                                hemoglobin >= 10 && hemoglobin < 12 ? 0.5 : 0.3;

          const bloodSugar = parseFloat(record.Blood_Sugar) || 0;
          const sugarScore = bloodSugar >= 70 && bloodSugar <= 100 ? 0.9 :
                           bloodSugar > 100 && bloodSugar <= 125 ? 0.7 : 0.5;

          const cholesterol = parseFloat(record.Cholesterol) || 0;
          const cholesterolScore = cholesterol < 200 ? 0.7 :
                                 cholesterol >= 200 && cholesterol < 240 ? 0.5 : 0.3;

          const creatinine = parseFloat(record.Creatinine) || 0;
          const creatinineScore = creatinine >= 0.6 && creatinine <= 1.2 ? 1 :
                                creatinine > 1.2 && creatinine <= 1.5 ? 0.7 : 0.5;

          const healthData = new HealthData({
            employeeId: employee.employeeId,
            recordedAt: new Date(),
            weight: parseFloat(record.Weight_kg) || 0,
            height: parseFloat(record.Height_cm) || 0,
            bmi: bmi,
            hemoglobin: hemoglobin,
            cholesterol: cholesterol,
            bloodSugar: bloodSugar,
            creatinine: creatinine,
            chronicDisease: record.Chronic_Disease || 'None',
            chronicDiseaseCount: parseInt(record['Chronic diseases']) || 0,
            familyMedicalHistory: record.family_medical_history || 'None',
            claimedAmount: parseFloat(record.Claimed_Amount) || 0,
            insuranceScore: parseFloat(record.Insurance_Score) || 0,
            smokerScore: record.Smoker === 'Yes' ? 1 : 0,
            familyScore: parseFloat(record.Family_Score) || 0,
            lifestyleScore: parseFloat(record.Lifestyle_Score) || 0,
            bmiScore: bmiScore,
            hemoglobinScore: hemoglobinScore,
            sugarScore: sugarScore,
            cholesterolScore: cholesterolScore,
            creatinineScore: creatinineScore,
            physicalScore: parseFloat(record.Physical_Score) || 0,
            wellnessScore: parseFloat(record.Wellness_Score) || 0,
            version: '1.0',
            policy: {
              policyId: record.Policy_ID || '',
              planName: record.Plan_Name || '',
              coverageDetails: record.Coverage_Details || '',
              startDate: new Date(record.Start_Date) || new Date(),
              endDate: new Date(record.End_Date) || new Date()
            }
          });

          await healthData.save();
          console.log(`Created health data for employee: ${employee.employeeId} (${i + 1}/${employees.length})`);
        }

        console.log('Health data update completed');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateHealthData(); 