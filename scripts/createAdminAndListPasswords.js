const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Define Employee schema (match populateAllData.js but allow _id for collection compatibility)
const employeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: String,
  age: Number,
  ageGroup: String,
  gender: String,
  children: Number,
  smoker: Boolean,
  planName: String,
  coverageDetails: String,
  startDate: Date,
  endDate: Date,
  department: String,
  education: String,
  recruitmentChannel: String,
  noOfTrainings: Number,
  previousYearRating: Number,
  lengthOfService: Number,
  kpisMet80: Boolean,
  avgTrainingScore: Number,
  version: { type: String, default: '1.0' },
  createdAt: Date,
  updatedAt: Date
}, { versionKey: false }); // Remove _id: false to allow _id in collection

// Clear any existing model to avoid schema conflicts
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
}
mongoose.model('Employee', employeeSchema);

// Create fresh model
const Employee = mongoose.model('Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions';
const ADMIN_PASSWORD = 'adminPass2025';
const EMPLOYEE_PASSWORD = 'password123';

async function createAdminAndListPasswords() {
  let errors = [];
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Debug: Check collection state
    const totalDocs = await Employee.countDocuments();
    console.log(`Total documents in employees collection: ${totalDocs}`);
    if (totalDocs > 0) {
      const sampleDoc = await Employee.findOne().lean();
      console.log('Sample document:', JSON.stringify(sampleDoc, null, 2));
    }

    // Check for existing admin
    const adminEmail = 'admin@medbond.com';
    const existingAdmin = await Employee.findOne({ email: adminEmail }).lean();
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`ID: ${existingAdmin.id}`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Role: ${existingAdmin.role}`);
    } else {
      // Create admin user
      const adminId = uuidv4();
      const adminUser = {
        id: adminId,
        name: 'Admin User',
        email: adminEmail,
        password: await bcryptjs.hash(ADMIN_PASSWORD, 10),
        role: 'admin',
        age: 35,
        ageGroup: '30-40',
        gender: 'Male',
        children: 0,
        smoker: false,
        planName: 'Premium',
        coverageDetails: 'Full Coverage',
        startDate: new Date('2025-01-01'),
        endDate: null,
        department: 'Administration',
        education: 'Masters',
        recruitmentChannel: 'Direct',
        noOfTrainings: 5,
        previousYearRating: 5,
        lengthOfService: 10,
        kpisMet80: true,
        avgTrainingScore: 95,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Attempting to create admin with ID:', adminId);
      await Employee.create(adminUser);
      console.log('Admin user created successfully:');
      console.log(`ID: ${adminId}`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
      console.log(`Role: admin`);
    }

    // Retrieve normal employees
    const employees = await Employee.find({ role: 'employee' })
      .select('id email role')
      .lean()
      .transform(docs => docs.map(doc => ({
        id: doc.id,
        email: doc.email,
        role: doc.role
      })));
    console.log(`\nNormal Employees (${employees.length} found):`);
    if (employees.length === 0) {
      console.log('No normal employees found.');
    } else {
      console.log('ID | Email | Password | Role');
      console.log('---|-------|----------|------');
      employees.forEach(emp => {
        console.log(`${emp.id} | ${emp.email} | ${EMPLOYEE_PASSWORD} | ${emp.role}`);
      });
    }

    // Verify counts
    const adminCount = await Employee.countDocuments({ role: 'admin' });
    const employeeCount = await Employee.countDocuments({ role: 'employee' });
    console.log(`\nDatabase Verification:`);
    console.log(`Admin users: ${adminCount}`);
    console.log(`Normal employees: ${employeeCount}`);

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
createAdminAndListPasswords().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});