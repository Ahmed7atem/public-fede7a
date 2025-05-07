require('dotenv').config();
const mongoose = require('mongoose');
const { Employee } = require('../models');

// Define admin schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const Admin = mongoose.model('Admin', adminSchema);

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check admin collection
    console.log('\nChecking Admin collection:');
    const admins = await Admin.find({});
    console.log('Found', admins.length, 'admin(s):');
    console.log(JSON.stringify(admins, null, 2));

    // Check employees collection
    console.log('\nChecking Employee collection:');
    const employees = await Employee.find({});
    console.log('Found', employees.length, 'employee(s):');
    console.log(JSON.stringify(employees, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers(); 