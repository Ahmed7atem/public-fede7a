const mongoose = require('mongoose');
const fs = require('fs');
const { parse } = require('csv-parse');
require('dotenv').config();

// Define Claim schema
const claimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ClaimID
  patientId: { type: String, required: true }, // PatientID, references Employee.id
  providerId: String, // ProviderID (e.g., hospital name)
  claimAmount: Number, // ClaimAmount (converted from string)
  claimDate: Date, // ClaimDate
  patientAge: Number, // PatientAge
  providerSpecialty: String, // ProviderSpecialty
  claimStatus: String, // ClaimStatus
  patientIncome: Number, // PatientIncome (converted from string)
  patientMaritalStatus: String, // PatientMaritalStatus
  patientEmploymentStatus: String, // PatientEmploymentStatus
  claimType: String, // ClaimType
  claimSubmissionMethod: String, // ClaimSubmissionMethod
  diagnosisDescription: String, // DiagnosisDescription
  procedureDescription: String, // ProcedureDescription
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false, versionKey: false });

// Clear any existing model to avoid conflicts
if (mongoose.models.Claim) {
  delete mongoose.models.Claim;
}
const Claim = mongoose.model('Claim', claimSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions';
const CSV_FILE_PATH = './data/Claims-Updated.csv'; // Updated path

async function populateClaims() {
  let errors = [];
  try {
    // Verify CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at ${CSV_FILE_PATH}`);
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the claims collection to start fresh
    await Claim.deleteMany({});
    console.log('Cleared claims collection');

    // Read and parse CSV
    const claims = [];
    const parser = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(parse({ columns: true, trim: true }));

    for await (const record of parser) {
      claims.push({
        id: record.ClaimID,
        patientId: record.PatientID,
        providerId: record.ProviderID,
        claimAmount: parseFloat(record.ClaimAmount.replace(/[$,]/g, '')), // Remove $ and commas
        claimDate: new Date(record.ClaimDate),
        patientAge: parseInt(record.PatientAge),
        providerSpecialty: record.ProviderSpecialty,
        claimStatus: record.ClaimStatus,
        patientIncome: parseFloat(record.PatientIncome.replace(/[$,]/g, '')), // Remove $ and commas
        patientMaritalStatus: record.PatientMaritalStatus,
        patientEmploymentStatus: record.PatientEmploymentStatus,
        claimType: record.ClaimType,
        claimSubmissionMethod: record.ClaimSubmissionMethod,
        diagnosisDescription: record.DiagnosisDescription,
        procedureDescription: record.ProcedureDescription,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert claims
    console.log(`Inserting ${claims.length} claims...`);
    await Claim.insertMany(claims);
    console.log(`Successfully inserted ${claims.length} claims`);

    // Verify count
    const claimCount = await Claim.countDocuments();
    console.log(`Database Verification: Total claims: ${claimCount}`);

    // Sample document for debugging
    const sampleClaim = await Claim.findOne().lean();
    console.log('Sample claim:', JSON.stringify(sampleClaim, null, 2));

  } catch (err) {
    console.error('Error during execution:', err.message);
    errors.push({ type: 'general', error: err.message });
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

// Run the script
populateClaims().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});