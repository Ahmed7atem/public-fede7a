const mongoose = require('mongoose');
require('dotenv').config();

let indexesCreated = false;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing MongoDB connection');
      return mongoose.connection;
    }

    console.log('Attempting to connect to MongoDB...');
    
    // Check for both environment variable names
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI;
    console.log('Connection URI exists:', !!mongoUri);
    
    if (!mongoUri) {
      throw new Error('MongoDB connection URI is missing');
    }

    // Log connection attempt without exposing credentials
    const sanitizedUri = mongoUri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1****:****@');
    console.log('Connecting to:', sanitizedUri);

    const conn = await mongoose.connect(mongoUri, {
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
    console.log('Database name:', conn.connection.name);
    console.log('Connection state:', mongoose.connection.readyState);

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
    console.error('MongoDB connection error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    // Check for authentication errors
    if (error.code === 8000 || error.message.includes('authentication failed')) {
      console.error('Authentication failed. Please check your MongoDB credentials.');
      console.error('Make sure your username and password are correct.');
      console.error('If your password contains special characters, make sure they are properly encoded in the connection string.');
    }
    
    // Don't throw the error, just log it and return null
    // This allows the app to start even if the database connection fails
    return null;
  }
};

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;