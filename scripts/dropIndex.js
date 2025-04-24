const mongoose = require('mongoose');
require('dotenv').config();

const dropIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop indexes for all collections
    await mongoose.model('Employee').collection.dropIndexes();
    await mongoose.model('HealthData').collection.dropIndexes();
    await mongoose.model('WearableData').collection.dropIndexes();
    await mongoose.model('Prediction').collection.dropIndexes();

    console.log('All indexes dropped successfully');
  } catch (error) {
    console.error('Error dropping indexes:', error);
  } finally {
    await mongoose.disconnect();
  }
};

dropIndexes(); 