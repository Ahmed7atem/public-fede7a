const mongoose = require('mongoose');
const { getAllEmployeesData } = require('../services/dataService');
require('dotenv').config();

async function testGetAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_prediction');
    console.log('Connected to MongoDB');
    
    // Call the function
    const data = await getAllEmployeesData();
    
    // Log the result
    console.log(`Retrieved data for ${data.length} employees`);
    
    // Log the first employee's data structure
    if (data.length > 0) {
      const firstEmployee = data[0];
      console.log('First employee data structure:');
      console.log(`- Employee ID: ${firstEmployee.employee._id}`);
      console.log(`- Employee Name: ${firstEmployee.employee.name}`);
      console.log(`- Has Health Data: ${Object.keys(firstEmployee.healthData).length > 0}`);
      console.log(`- Wearable Data Entries: ${firstEmployee.wearableData.length}`);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetAllData(); 