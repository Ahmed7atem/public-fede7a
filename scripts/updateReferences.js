const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const updateCollections = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Read the main dataset to get new employee IDs
    const mainDataResults = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/FinalDataSet.csv')
        .pipe(csv())
        .on('data', (data) => mainDataResults.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const newEmployeeIds = mainDataResults.map(r => r.Patient_ID);
    console.log(`Found ${newEmployeeIds.length} new employee IDs`);
    
    if (newEmployeeIds.length === 0) {
      throw new Error('No employee IDs found in FinalDataSet.csv');
    }

    // Update main healthdatas collection
    console.log('\nUpdating main healthdatas collection...');
    const HealthData = mongoose.model('healthdatas', new mongoose.Schema({}, { strict: false }));
    await HealthData.deleteMany({}); // Clear existing health data

    // Process each record from FinalDataSet.csv
    for (const record of mainDataResults) {
      const healthData = {
        employeeId: record.Patient_ID,
        recordedAt: new Date(),
        weight: parseFloat(record.Weight_kg) || 0,
        height: parseFloat(record.Height_cm) || 0,
        bmi: parseFloat(record.BMI) || 0,
        hemoglobin: parseFloat(record.Hemoglobin) || 0,
        cholesterol: parseFloat(record.Cholesterol) || 0,
        bloodSugar: parseFloat(record.Blood_Sugar) || 0,
        creatinine: parseFloat(record.Creatinine) || 0,
        chronicDisease: record.Chronic_Disease || 'None',
        chronicDiseaseCount: parseInt(record.Chronic_diseases) || 0,
        familyMedicalHistory: record.family_medical_history || 'None',
        claimedAmount: parseFloat(record.Claimed_Amount) || 0,
        insuranceScore: parseFloat(record.Insurance_Score) || 0,
        smokerScore: parseFloat(record.Smoker_Score) || 0,
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
      };
      await HealthData.create(healthData);
    }
    console.log(`Updated ${mainDataResults.length} records in healthdatas collection`);

    // Read claims data
    const claimsResults = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/Claims-Updated.csv')
        .pipe(csv())
        .on('data', (data) => claimsResults.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`\nRead ${claimsResults.length} claims`);

    // Group claims by original employee ID
    const claimsByEmployee = {};
    claimsResults.forEach(claim => {
      const empId = claim.EmployeePatientID;
      if (!claimsByEmployee[empId]) {
        claimsByEmployee[empId] = [];
      }
      claimsByEmployee[empId].push(claim);
    });

    const oldEmployeeIds = Object.keys(claimsByEmployee);
    console.log(`Found ${oldEmployeeIds.length} unique employees in claims`);

    // Create mapping of old to new IDs
    const idMapping = {};
    oldEmployeeIds.forEach((oldId, index) => {
      idMapping[oldId] = newEmployeeIds[index % newEmployeeIds.length]; // Cycle through new IDs if we have more old IDs
    });

    // Update claims collection
    const claimsSchema = new mongoose.Schema({
      id: String,
      ClaimID: { type: String, required: true },
      EmployeePatientID: { type: String, required: true },
      employee: { type: String, required: true },
      ProviderID: String,
      ClaimAmount: Number,
      ClaimDate: Date,
      PatientAge: Number,
      ProviderSpecialty: String,
      ClaimStatus: String,
      PatientIncome: Number,
      PatientMaritalStatus: String,
      PatientEmploymentStatus: String,
      ClaimType: String,
      ClaimSubmissionMethod: String,
      DiagnosisDescription: String,
      ProcedureDescription: String
    }, { strict: false });

    // Drop the existing collection to remove indexes
    await mongoose.connection.dropCollection('claims').catch(() => console.log('Claims collection did not exist'));
    
    const Claims = mongoose.model('claims', claimsSchema);
    
    let claimCount = 0;
    for (const [oldId, claims] of Object.entries(claimsByEmployee)) {
      const newId = idMapping[oldId];
      for (const claim of claims) {
        const claimId = `CLM${String(claimCount + 1).padStart(6, '0')}`;
        const newClaim = {
          id: claimId, // Set the id field explicitly
          ClaimID: claimId,
          EmployeePatientID: newId,
          employee: newId,
          ProviderID: claim.ProviderID || '',
          ClaimAmount: parseFloat(claim.ClaimAmount) || 0,
          ClaimDate: new Date(claim.ClaimDate) || new Date(),
          PatientAge: parseInt(claim.PatientAge) || 0,
          ProviderSpecialty: claim.ProviderSpecialty || '',
          ClaimStatus: claim.ClaimStatus || 'Pending',
          PatientIncome: parseFloat(claim.PatientIncome) || 0,
          PatientMaritalStatus: claim.PatientMaritalStatus || '',
          PatientEmploymentStatus: claim.PatientEmploymentStatus || '',
          ClaimType: claim.ClaimType || '',
          ClaimSubmissionMethod: claim.ClaimSubmissionMethod || '',
          DiagnosisDescription: claim.DiagnosisDescription || '',
          ProcedureDescription: claim.ProcedureDescription || ''
        };
        await Claims.create(newClaim);
        claimCount++;
      }
    }
    console.log(`Updated ${claimCount} claims with new employee IDs`);

    // Update wearable data collection
    const WearableData = mongoose.model('wearabledatas', new mongoose.Schema({}, { strict: false }));
    const firstEmployeeId = newEmployeeIds[0];
    
    // Read wearable data
    const wearableResults = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/apple_watch_data.csv')
        .pipe(csv())
        .on('data', (data) => wearableResults.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Update wearable data
    await WearableData.deleteMany({}); // Clear existing data
    for (const data of wearableResults) {
      const newWearableData = {
        ...data,
        employee: firstEmployeeId
      };
      await WearableData.create(newWearableData);
    }
    console.log(`\nAssigned ${wearableResults.length} wearable records to employee ${firstEmployeeId}`);

    // Update sleep data collection
    const SleepData = mongoose.model('sleepdatas', new mongoose.Schema({}, { strict: false }));
    
    // Read sleep data
    const sleepResults = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/sleep_data.csv')
        .pipe(csv())
        .on('data', (data) => sleepResults.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Update sleep data
    await SleepData.deleteMany({}); // Clear existing data
    for (const data of sleepResults) {
      const newSleepData = {
        ...data,
        employee: firstEmployeeId
      };
      await SleepData.create(newSleepData);
    }
    console.log(`Assigned ${sleepResults.length} sleep records to employee ${firstEmployeeId}`);

    console.log('\nAll updates completed successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the updates
updateCollections(); 