const { Employee } = require('../models/schemas');
const connectDB = require('../config/database');
require('dotenv').config();

async function checkAdmin() {
  try {
    await connectDB();
    
    const admin = await Employee.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('Admin user found:', {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name
      });
    } else {
      console.log('Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin(); 