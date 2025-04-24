const mongoose = require('mongoose');

const createIndexes = async () => {
  try {
    // Employee indexes for authentication
    await mongoose.model('Employee').collection.createIndex({ email: 1 }, { unique: true });

    // Basic indexes for performance
    await mongoose.model('HealthData').collection.createIndex({ employee: 1 });
    await mongoose.model('WearableData').collection.createIndex({ employee: 1 });
    await mongoose.model('Prediction').collection.createIndex({ employee: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
};

module.exports = createIndexes; 