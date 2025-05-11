const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();
const { Claim2023, Claim2024 } = require('../models/schemas');

async function populateClaimsFromCSV(csvPath, Model, year) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (!data.ClaimID || !data.EmployeePatientID) return; // skip invalid rows
        results.push({
          id: data.ClaimID,
          employeeId: data.EmployeePatientID,
          providerType: data.ProviderID || 'Hospital',
          claimDescription: data.DiagnosisDescription || '',
          claimAmount: data.ClaimAmount ? Number(data.ClaimAmount) : undefined,
          claimDate: data.ClaimDate ? new Date(data.ClaimDate) : undefined,
          patientAge: data.PatientAge ? Number(data.PatientAge) : undefined,
          providerSpecialty: data.ProviderSpecialty,
          claimStatus: data.ClaimStatus,
          patientIncome: data.PatientIncome ? Number(data.PatientIncome) : undefined,
          patientMaritalStatus: data.PatientMaritalStatus,
          patientEmploymentStatus: data.PatientEmploymentStatus,
          claimType: data.ClaimType,
          claimSubmissionMethod: data.ClaimSubmissionMethod,
          procedureDescription: data.ProcedureDescription,
          documents: [],
          status: data.ClaimStatus || 'Pending',
          processedAt: undefined,
          processedBy: undefined,
          notes: undefined,
          claimFor: 'employee',
          claimForId: data.EmployeePatientID
        });
      })
      .on('end', async () => {
        try {
          await Model.deleteMany({});
          await Model.insertMany(results);
          console.log(`Inserted ${results.length} claims into ${year}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    // (Updated model (and collection) names (from "claims_2023" and "claims_2024" to "claims2023" and "claims2024"))
    await populateClaimsFromCSV('/Volumes/MySSD/GP Code/public-fede7a/data/Synthetic_Claims_2023.csv', Claim2023, 'claims2023');
    await populateClaimsFromCSV('/Volumes/MySSD/GP Code/public-fede7a/data/Synthetic_Claims_2024.csv', Claim2024, 'claims2024');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main(); 