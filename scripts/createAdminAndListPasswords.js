const mongoose = require('mongoose');
require('dotenv').config();
const { Employee } = require('../models/schemas');

const createAdminAndListPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user if not exists
    const admin = await Employee.findOne({ role: 'admin' });
    if (!admin) {
      const newAdmin = new Employee({
        email: 'admin@medbond.com',
        password: 'adminPass2025',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Admin user created');
    }

    // List all users and their passwords
    const users = await Employee.find({});
    console.log('\nUser List:');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdminAndListPasswords();