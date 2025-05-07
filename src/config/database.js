const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { 
  Employee, 
  HealthData, 
  WearableData, 
  SleepData, 
  Policy, 
  Claim,
  Doctor,
  Feedback,
  Attachment,
  PolicyDocument,
  Prediction,
  Admin
} = require('../../models');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Test the connection by logging collection stats
    try {
      const collections = await mongoose.connection.db.collections();
      console.log('Available collections:', collections.map(c => c.collectionName));
      
      // Log the number of documents in the employees collection if it exists
      if (collections.some(c => c.collectionName === 'employees')) {
        const employeeCount = await Employee.countDocuments();
        console.log('Total employees:', employeeCount);
      }

      // Log the number of documents in the admins collection if it exists
      if (collections.some(c => c.collectionName === 'admins')) {
        const adminCount = await Admin.countDocuments();
        console.log('Total admins:', adminCount);
      }
    } catch (error) {
      console.error('Error checking collections:', error);
    }
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit the process, let the application handle the error
    throw error;
  }
};

module.exports = connectDB; 