const mongoose = require('mongoose');
require('dotenv').config();

let indexesCreated = false;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      ssl: true,
      authSource: 'admin'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Only create indexes if they haven't been created yet
    if (!indexesCreated) {
      try {
        // Register schemas first
        require('../models/schemas');
        
        // Create indexes
        await require('../models/indexes')();
        console.log('Database indexes created successfully');
        indexesCreated = true;
      } catch (error) {
        console.error('Error creating database indexes:', error);
      }
    }

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw the error, just log it and return null
    // This allows the app to start even if the database connection fails
    return null;
  }
};

module.exports = connectDB;