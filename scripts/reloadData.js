const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const { Employee, HealthData } = require('../models');

const reloadData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await HealthData.deleteMany({});
    console.log('Cleared existing data');

    const results = [];
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/FinalDataSet.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${results.length} records from CSV`);

    // Process each record
    for (const record of results) {
      // Use the Patient_ID from the CSV as employeeId
      const employeeId = record.Patient_ID;

      // Create employee record
      const employee = new Employee({
        employeeId,
        email: `employee${employeeId}@example.com`, // Generate dummy email
        password: Math.random().toString(36).slice(-8), // Generate random password
        Age: record.Age,
        Age_Group: record.Age_Group,
        Gender: record.Gender,
        Weight_kg: record.Weight_kg,
        Height_cm: record.Height_cm,
        BMI: record.BMI,
        Children: record.Children,
        Smoker: record.Smoker,
        Chronic_Disease: record.Chronic_Disease,
        Chronic_diseases_count: record['Chronic diseases'],
        family_medical_history: record.family_medical_history,
        Hemoglobin: record.Hemoglobin,
        Cholesterol: record.Cholesterol,
        Blood_Sugar: record.Blood_Sugar,
        Creatinine: record.Creatinine,
        Policy_ID: record.Policy_ID,
        Plan_Name: record.Plan_Name,
        Coverage_Details: record.Coverage_Details,
        Start_Date: record.Start_Date,
        End_Date: record.End_Date,
        Claimed_Amount: record.Claimed_Amount,
        Department: record.Department,
        Education: record.Education,
        Recruitment_Channel: record.Recruitment_Channel,
        No_of_Trainings: record.No_of_Trainings,
        Previous_Year_Rating: record.Previous_Year_Rating,
        Length_of_Service: record.Length_of_Service,
        KPIs_Met_80: record.KPIs_Met_80,
        Avg_Training_Score: record.Avg_Training_Score,
        Insurance_Score: record.Insurance_Score,
        Smoker_Score: record.Smoker_Score,
        Family_Score: record.Family_Score,
        Lifestyle_Score: record.Lifestyle_Score,
        BMI_Score: record.BMI_Score,
        Hemoglobin_Score: record.Hemoglobin_Score,
        Sugar_Score: record.Sugar_Score,
        Cholesterol_Score: record.Cholesterol_Score,
        Creatinine_Score: record.Creatinine_Score,
        Physical_Score: record.Physical_Score,
        Wellness_Score: record.Wellness_Score,
        policyNumber: record.Policy_ID // Use original policy ID
      });

      // Create health data record with same employeeId
      const healthData = new HealthData({
        employeeId,
        recordedAt: new Date(),
        weight: parseFloat(record.Weight_kg) || 0,
        height: parseFloat(record.Height_cm) || 0,
        bmi: parseFloat(record.BMI) || 0,
        hemoglobin: parseFloat(record.Hemoglobin) || 0,
        cholesterol: parseFloat(record.Cholesterol) || 0,
        bloodSugar: parseFloat(record.Blood_Sugar) || 0,
        creatinine: parseFloat(record.Creatinine) || 0,
        chronicDisease: record.Chronic_Disease || 'None',
        chronicDiseaseCount: parseInt(record['Chronic diseases']) || 0,
        familyMedicalHistory: record.family_medical_history || 'None',
        claimedAmount: parseFloat(record.Claimed_Amount) || 0,
        insuranceScore: parseFloat(record.Insurance_Score) || 0,
        smokerScore: record.Smoker === 'Yes' ? 1 : 0,
        familyScore: parseFloat(record.Family_Score) || 0,
        lifestyleScore: parseFloat(record.Lifestyle_Score) || 0,
        bmiScore: parseFloat(record.BMI_Score) || 0,
        hemoglobinScore: parseFloat(record.Hemoglobin_Score) || 0,
        sugarScore: parseFloat(record.Sugar_Score) || 0,
        cholesterolScore: parseFloat(record.Cholesterol_Score) || 0,
        creatinineScore: parseFloat(record.Creatinine_Score) || 0,
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

      // Save both records
      await employee.save();
      await healthData.save();
      
      console.log(`Processed record ${results.indexOf(record) + 1}/${results.length}`);
    }

    // Verify the data
    const employeeCount = await Employee.countDocuments();
    const healthDataCount = await HealthData.countDocuments();
    
    console.log('\nVerification:');
    console.log(`Employees: ${employeeCount}`);
    console.log(`Health Data: ${healthDataCount}`);

    // Check for any mismatches
    const employees = await Employee.find().select('employeeId').lean();
    const healthDatas = await HealthData.find().select('employeeId').lean();
    
    const employeeIds = new Set(employees.map(e => e.employeeId));
    const healthDataIds = new Set(healthDatas.map(h => h.employeeId));
    
    const mismatches = [...healthDataIds].filter(id => !employeeIds.has(id));
    console.log(`Mismatches found: ${mismatches.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

reloadData(); 