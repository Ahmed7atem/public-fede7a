require('dotenv').config();
const mongoose = require('mongoose');
const { Employee, SleepData } = require('./models');

// Connect to MongoDB
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  
  try {
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));
    
    // Count employees
    const employeeCount = await Employee.countDocuments();
    console.log(`Total employees: ${employeeCount}`);
    
    // Get one sample employee
    if (employeeCount > 0) {
      const sampleEmployee = await Employee.findOne().lean();
      console.log('Sample employee ID:', sampleEmployee.employeeId || sampleEmployee._id);
      console.log('Sample employee data:', JSON.stringify(sampleEmployee, null, 2).substring(0, 300) + '...');
    }
    
    // Count sleep records
    const sleepCount = await SleepData.countDocuments();
    console.log(`Total sleep records: ${sleepCount}`);
    
    // Get one sample sleep record
    if (sleepCount > 0) {
      const sampleSleep = await SleepData.findOne().lean();
      console.log('Sample sleep record:', JSON.stringify(sampleSleep, null, 2).substring(0, 300) + '...');
    }
    
    console.log('✅ Connection test complete');
  } catch (error) {
    console.error('Error during connection test:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 