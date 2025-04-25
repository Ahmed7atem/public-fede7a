const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection URI
const uri = 'mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';

// Function to parse date in MM/DD/YYYY format
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    return new Date('2023-01-01');
  }
  const [month, day, year] = dateStr.split('/');
  return new Date(year, month - 1, day);
}

async function populateDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('health_prediction');
    
    // Clear existing collections
    await db.collection('employees').deleteMany({});
    await db.collection('policies').deleteMany({});
    console.log('Cleared existing data');
    
    const employees = [];
    const policies = [];
    const seenIds = new Set();
    const usedPolicyNumbers = new Set();
    
    // Process the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream('data/NewData.csv')
        .pipe(csv())
        .on('data', (row) => {
          // Generate or use existing employee ID
          let employeeId = row.Patient_ID || uuidv4();
          if (seenIds.has(employeeId)) {
            employeeId = uuidv4();
            console.log(`Generated new UUID for duplicate ID: ${row.Patient_ID} -> ${employeeId}`);
          }
          seenIds.add(employeeId);

          // Create a policy ID that will be referenced by the employee
          const policyId = row.Policy_ID || uuidv4();
          
          // Create unique policy number
          let policyNumber = `POL-${uuidv4().substring(0, 8)}`;
          while (usedPolicyNumbers.has(policyNumber)) {
            policyNumber = `POL-${uuidv4().substring(0, 8)}`;
          }
          usedPolicyNumbers.add(policyNumber);
          
          // Create policy
          const policy = {
            id: policyId,
            policyNumber: policyNumber,
            type: row.Plan_Name || 'Basic',
            status: 'Active',
            employeeId: employeeId,
            startDate: parseDate(row.Start_Date),
            endDate: parseDate(row.End_Date),
            coverageDetails: {
              type: row.Plan_Name || 'Basic',
              deductible: 1000,
              coverageLimit: 100000,
              copayment: 20
            },
            premium: parseFloat(row.Claimed_Amount) || 1000
          };
          policies.push(policy);
          
          // Create employee
          const employee = {
            id: employeeId,
            email: `employee${employeeId.substring(0, 8)}@example.com`,
            password: '$2b$10$X3H2wOjYOhxhQvOLq2S10Of19ZCyAswWRPXL6PakAzDooMCpe2/QG', // Default hashed password
            name: `Employee ${employeeId.substring(0, 8)}`,
            role: 'employee',
            age: parseInt(row.Age) || 30,
            gender: row.Gender || 'Male',
            children: parseInt(row.Children) || 0,
            smoker: (row.Smoker && row.Smoker.toLowerCase() === 'yes') || false,
            region: row.Region || 'Northeast',
            bmi: parseFloat(row.BMI) || 25,
            bloodPressure: {
              systolic: 120,
              diastolic: 80
            },
            diabetic: (row.Diabetes && row.Diabetes.toLowerCase() === 'yes') || false,
            policyId: policyId,
            charges: parseFloat(row.Claimed_Amount) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          employees.push(employee);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Prepared ${employees.length} employees and ${policies.length} policies for insertion`);
    
    // Insert policies first since employees reference them
    if (policies.length > 0) {
      // Insert in batches to avoid potential issues
      const batchSize = 50;
      for (let i = 0; i < policies.length; i += batchSize) {
        const batch = policies.slice(i, i + batchSize);
        const policyResult = await db.collection('policies').insertMany(batch);
        console.log(`Inserted batch of ${policyResult.insertedCount} policies`);
      }
    }
    
    // Insert employees
    if (employees.length > 0) {
      // Insert in batches to avoid potential issues
      const batchSize = 50;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        const employeeResult = await db.collection('employees').insertMany(batch);
        console.log(`Inserted batch of ${employeeResult.insertedCount} employees`);
      }
    }
    
    // Verify data
    const employeeCount = await db.collection('employees').countDocuments();
    const policyCount = await db.collection('policies').countDocuments();
    console.log(`Verification: ${employeeCount} employees and ${policyCount} policies in database`);
    
    // Sample data to verify
    console.log('\nSample employee records:');
    const sampleEmployees = await db.collection('employees').find().limit(2).toArray();
    sampleEmployees.forEach(emp => {
      console.log(JSON.stringify(emp, null, 2));
    });
    
    console.log('\nSample policy records:');
    const samplePolicies = await db.collection('policies').find().limit(2).toArray();
    samplePolicies.forEach(policy => {
      console.log(JSON.stringify(policy, null, 2));
    });
    
    console.log('Database population completed successfully');
    
  } catch (error) {
    console.error('Error in database population:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

populateDatabase().catch(console.error); 