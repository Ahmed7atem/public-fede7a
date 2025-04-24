const mongoose = require('mongoose');
require('dotenv').config();

let indexesCreated = false;
let cachedConnection = null;

const connectDB = async () => {
  try {
    // Return cached connection if it exists and is connected
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('Using cached MongoDB connection');
      return cachedConnection;
    }

    // Close existing connection if it's in a disconnected state
    if (mongoose.connection.readyState === 0) {
      await mongoose.connection.close();
    }

    console.log('Attempting to connect to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI;
    console.log('Connection URI exists:', !!mongoUri);
    
    if (!mongoUri) {
      throw new Error('MongoDB connection URI is missing');
    }

    const sanitizedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1****:****@');
    console.log('Connecting to:', sanitizedUri);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Reduced from 10s to 5s for serverless
      maxPoolSize: 20, // Increased for serverless
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      ssl: true,
      authSource: 'admin'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
    console.log('Connection state:', mongoose.connection.readyState);

    // Cache the connection
    cachedConnection = conn;

    // Only create indexes if they haven't been created yet
    if (!indexesCreated) {
      try {
        require('../models/schemas');
        await require('../models/indexes')();
        console.log('Database indexes created successfully');
        indexesCreated = true;
      } catch (error) {
        console.error('Error creating database indexes:', error);
      }
    }

    return conn;
  } catch (error) {
    console.error('MongoDB connection error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    // Clear cached connection on error
    cachedConnection = null;
    
    // Don't throw the error, just log it and return null
    return null;
  }
};

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  cachedConnection = null;
});

// Handle serverless function termination
process.on('SIGTERM', async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
  }
  process.exit(0);
});

module.exports = connectDB;