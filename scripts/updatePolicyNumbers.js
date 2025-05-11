const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Define the Employee model
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  policyNumber: String,
  // ... other fields will be handled by strict: false
}, { strict: false });

const Employee = mongoose.model('Employee', employeeSchema);

async function updatePolicyNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all employees
    const employees = await Employee.find().lean();
    console.log(`Found ${employees.length} employees`);

    // Update each employee with a new policy number
    let counter = 1;
    for (const employee of employees) {
      const policyNumber = `MED${counter.toString().padStart(4, '0')}`;
      
      await Employee.findByIdAndUpdate(employee._id, {
        policyNumber: policyNumber
      });
      
      console.log(`Updated employee ${employee.employeeId} with policy number ${policyNumber}`);
      counter++;
    }

    console.log('\nUpdate complete:');
    console.log(`Updated ${employees.length} employee records with new policy numbers`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updatePolicyNumbers(); 