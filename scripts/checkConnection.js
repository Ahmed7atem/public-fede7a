const mongoose = require('mongoose');

const uri = 'mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';

async function checkConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Get the employees collection
    const employeesCollection = mongoose.connection.db.collection('employees');

    // Try to find the specific employee
    const employeeId = '8f7b7927-6c04-401a-ab0b-61000132f970';
    console.log('Looking for employee with ID:', employeeId);
    
    const employee = await employeesCollection.findOne({ employeeId });
    console.log('Employee found:', employee ? 'Yes' : 'No');
    if (employee) {
      console.log('Employee data:', JSON.stringify(employee, null, 2));
    }

    // Get total count of employees
    const count = await employeesCollection.countDocuments();
    console.log('Total employees:', count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkConnection(); 