const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Define Employee schema
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
}, { versionKey: false });

// Clear any existing model to avoid schema conflicts
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
}
mongoose.model('Employee', employeeSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions';
const ADMIN_EMAIL = 'admin@medbond.com';
const NEW_PASSWORD = 'adminPass2025';

async function updateAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await mongoose.model('Employee').findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    // Update the password
    adminUser.password = await bcryptjs.hash(NEW_PASSWORD, 10);
    await adminUser.save();

    console.log('Admin password updated successfully');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`New Password: ${NEW_PASSWORD}`);

  } catch (err) {
    console.error('Error updating admin password:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateAdminPassword().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 