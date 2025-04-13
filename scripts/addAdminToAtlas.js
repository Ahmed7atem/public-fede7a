const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import schemas
const { Employee } = require('../models/schemas');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';

async function addAdminToAtlas() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Check if admin user already exists
    const existingAdmin = await Employee.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists in the database');
      console.log('Admin details:');
      console.log(`ID: ${existingAdmin._id}`);
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB Atlas');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = new Employee({
      _id: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      gender: 'Other',
      age: 30,
      children: 0,
      smoker: false,
      planName: 'Admin Plan',
      coverageDetails: 'Full Coverage',
      startDate: new Date('2025-04-06'),
      endDate: new Date('2026-04-06')
    });

    // Save admin user
    await adminUser.save();
    console.log('Admin user added successfully');
    console.log('Admin details:');
    console.log(`ID: ${adminUser._id}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log('Password: admin123');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');

  } catch (error) {
    console.error('Error adding admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
addAdminToAtlas(); 