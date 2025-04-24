const mongoose = require('mongoose');

const createIndexes = async () => {
  try {
    // Employee indexes
    await mongoose.model('Employee').collection.createIndex({ email: 1 }, { unique: true });
    await mongoose.model('Employee').collection.createIndex({ role: 1 });

    // Health Data indexes
    await mongoose.model('HealthData').collection.createIndex({ employee: 1 });
    await mongoose.model('HealthData').collection.createIndex({ recordedAt: -1 });

    // Wearable Data indexes
    await mongoose.model('WearableData').collection.createIndex({ employee: 1 });
    await mongoose.model('WearableData').collection.createIndex({ logDate: -1 });

    // Prediction indexes
    await mongoose.model('Prediction').collection.createIndex({ employee: 1 });
    await mongoose.model('Prediction').collection.createIndex({ predictedAt: -1 });

    // Policy Document indexes
    await mongoose.model('PolicyDocument').collection.createIndex({ isActive: 1 });
    await mongoose.model('PolicyDocument').collection.createIndex({ createdAt: -1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
};

module.exports = createIndexes; 