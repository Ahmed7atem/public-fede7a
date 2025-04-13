const bcrypt = require('bcryptjs');
const { Employee } = require('../models/schemas');
const connectDB = require('../config/database');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Check if admin user exists
    const existingAdmin = await Employee.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminPassword = 'admin1234';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    const adminUser = new Employee({
      _id: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      age: 0,
      gender: 'N/A',
      children: 0,
      smoker: false,
      role: 'admin',
      planName: 'Admin Plan',
      coverageDetails: 'Full Coverage',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin1234');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 