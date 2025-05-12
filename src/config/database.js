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

    // Log connection attempt details (without sensitive info)
    const uri = process.env.MONGODB_URI;
    const sanitizedUri = uri.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1****$4');
    console.log('Attempting to connect to MongoDB with URI:', sanitizedUri);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 10000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Connection state:', mongoose.connection.readyState);
    
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
    // Log more detailed error information
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Server selection error details:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        name: error.name
      });
    }
    // Log connection state
    console.log('Connection state at error:', mongoose.connection.readyState);
    // Don't exit the process, let the application handle the error
    throw error;
  }
};

// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.log('Connection state at error:', mongoose.connection.readyState);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  console.log('Connection state:', mongoose.connection.readyState);
});

module.exports = connectDB; 