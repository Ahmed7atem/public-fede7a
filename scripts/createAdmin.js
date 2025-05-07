const mongoose = require('mongoose');
require('dotenv').config();

const { Admin } = require('../models');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@medbond.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin);
    } else {
      // Create new admin user
      const admin = await Admin.create({
        email: 'admin@medbond.com',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin'
      });
      console.log('Admin user created:', admin);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin(); 