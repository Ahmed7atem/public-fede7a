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
  Prediction
} = require('../../models');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Test the connection by logging collection stats
    try {
      const collections = await mongoose.connection.db.collections();
      console.log('Available collections:', collections.map(c => c.collectionName));
      
      // Log the number of documents in the employees collection if it exists
      if (collections.some(c => c.collectionName === 'employees')) {
        const Employee = mongoose.model('Employee');
        const employeeCount = await Employee.countDocuments();
        console.log('Total employees:', employeeCount);
      }
    } catch (error) {
      console.error('Error checking collections:', error);
    }
    
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 