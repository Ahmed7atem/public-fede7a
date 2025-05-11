const mongoose = require('mongoose');
const { Claim } = require('../models/schemas');
require('dotenv').config();

async function checkClaimStructure() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get a sample claim
    const sampleClaim = await Claim.findOne().lean();
    console.log('\nSample claim structure:');
    console.log(JSON.stringify(sampleClaim, null, 2));

    // Get all unique field names
    const allClaims = await Claim.find().lean();
    const fieldNames = new Set();
    allClaims.forEach(claim => {
      Object.keys(claim).forEach(field => fieldNames.add(field));
    });

    console.log('\nAll fields found in claims:');
    console.log(Array.from(fieldNames).sort());

    // Check which fields are most commonly used for employee ID
    const possibleIdFields = ['patientId', 'employeeId', 'EmployeePatientID', 'employee'];
    console.log('\nChecking possible employee ID fields:');
    for (const field of possibleIdFields) {
      const count = await Claim.countDocuments({ [field]: { $exists: true } });
      console.log(`${field}: ${count} claims have this field`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkClaimStructure(); 