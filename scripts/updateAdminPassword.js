const mongoose = require('mongoose');
require('dotenv').config();
const { Employee } = require('../models/schemas');

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await Employee.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found');
      return;
    }

    // Update password
    admin.password = 'adminPass2025';
    await admin.save();
    console.log('Admin password updated successfully');

  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await mongoose.disconnect();
  }
};

updateAdminPassword(); 