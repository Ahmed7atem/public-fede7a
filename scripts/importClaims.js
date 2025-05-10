const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Helper function to parse currency values
function parseCurrency(value) {
  if (!value) return 0;
  // Remove $ and commas, then parse as float
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

// Helper function to parse dates
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  // Handle different date formats
  const formats = [
    'MM/DD/YYYY',
    'MM-DD-YY',
    'MM/DD/YY',
    'MM-DD-YYYY'
  ];
  
  for (const format of formats) {
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      const [month, day, year] = parts;
      // Handle 2-digit years
      const fullYear = year.length === 2 ? `20${year}` : year;
      return new Date(fullYear, month - 1, day);
    }
  }
  return new Date();
}

// Define the Claim schema
const claimSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  claimId: { type: String, required: true },
  providerId: String,
  claimAmount: Number,
  claimDate: Date,
  patientAge: Number,
  providerSpecialty: String,
  claimStatus: String,
  patientIncome: Number,
  patientMaritalStatus: String,
  patientEmploymentStatus: String,
  claimType: String,
  claimSubmissionMethod: String,
  diagnosisDescription: String,
  procedureDescription: String
}, { strict: false });

const Claim = mongoose.model('Claim', claimSchema);

async function importClaims() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Drop existing claims collection
    await mongoose.connection.dropCollection('claims').catch(() => console.log('Claims collection did not exist'));
    console.log('Dropped existing claims collection');

    // Read the claims data
    const claimsData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/Claims-Updated.csv')
        .pipe(csv())
        .on('data', (data) => claimsData.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${claimsData.length} claims from CSV`);

    // Transform and insert claims
    const transformedClaims = claimsData.map(claim => ({
      employeeId: claim.EmployeePatientID,
      claimId: claim.ClaimID,
      providerId: claim.ProviderID,
      claimAmount: parseCurrency(claim.ClaimAmount),
      claimDate: parseDate(claim.ClaimDate),
      patientAge: parseInt(claim.PatientAge) || 0,
      providerSpecialty: claim.ProviderSpecialty,
      claimStatus: claim.ClaimStatus,
      patientIncome: parseCurrency(claim.PatientIncome),
      patientMaritalStatus: claim.PatientMaritalStatus,
      patientEmploymentStatus: claim.PatientEmploymentStatus,
      claimType: claim.ClaimType,
      claimSubmissionMethod: claim.ClaimSubmissionMethod,
      diagnosisDescription: claim.DiagnosisDescription,
      procedureDescription: claim.ProcedureDescription
    }));

    // Insert all claims
    await Claim.insertMany(transformedClaims);
    console.log(`Successfully imported ${transformedClaims.length} claims`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
importClaims(); 