const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Drop the problematic index
    await mongoose.connection.db.collection('employees').dropIndex('id_1');
    console.log('Successfully dropped index');

    // List remaining indexes
    const indexes = await mongoose.connection.db.collection('employees').listIndexes().toArray();
    console.log('Remaining indexes:', indexes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndex(); 