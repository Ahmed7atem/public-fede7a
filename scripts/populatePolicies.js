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
  Policy_ID: String,
  Plan_Name: String,
  Coverage_Details: String,
  Start_Date: String,
  End_Date: String,
  Claimed_Amount: String,
  Insurance_Score: String
}, { strict: false });

// Define the Policy model
const policySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  policyId: { type: String, required: true, unique: true },
  policyNumber: { type: String, required: true },
  type: { type: String, required: true },
  coverage: { type: Object, required: true },
  premium: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  employeeId: { type: String, required: true }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
const Policy = mongoose.model('Policy', policySchema);

async function populatePolicies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing policies
    await Policy.deleteMany({});
    console.log('Cleared existing policies');

    // Get all employees
    const employees = await Employee.find().lean();
    console.log(`Found ${employees.length} employees`);

    // Create policies for each employee
    for (const employee of employees) {
      // Calculate premium based on insurance score (0-100)
      const insuranceScore = parseFloat(employee.Insurance_Score) || 50;
      const basePremium = 1000; // Base premium amount
      const premium = basePremium * (1 + (100 - insuranceScore) / 100); // Higher score = lower premium

      const policyId = employee.Policy_ID || `POL-${Date.now().toString().slice(-6)}`;
      const policy = new Policy({
        id: policyId, // Use the same value as policyId for the id field
        policyId: policyId,
        policyNumber: employee.policyNumber || `MED${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        type: employee.Plan_Name || 'Standard',
        coverage: {
          details: employee.Coverage_Details || 'Standard Coverage',
          claimedAmount: parseFloat(employee.Claimed_Amount) || 0,
          insuranceScore: insuranceScore
        },
        premium: Math.round(premium),
        startDate: new Date(employee.Start_Date) || new Date(),
        endDate: new Date(employee.End_Date) || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        employeeId: employee.employeeId
      });

      await policy.save();
      console.log(`Created policy for employee ${employee.employeeId}`);
    }

    console.log('\nUpdate complete:');
    console.log(`Created ${employees.length} policy records`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populatePolicies(); 