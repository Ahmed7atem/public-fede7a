const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Connection URI
const uri = 'mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';

// Sample policy data with unique IDs
const policies = [
  {
    id: uuidv4(),
    policyNumber: "POL-12345",
    type: "Basic",
    status: "Active",
    employeeId: "8f7b7927-6c04-401a-ab0b-61000132f970",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    coverageDetails: {
      type: "Basic",
      deductible: 1000,
      coverageLimit: 100000,
      copayment: 20
    },
    premium: 5000
  },
  {
    id: uuidv4(),
    policyNumber: "POL-23456",
    type: "Gold",
    status: "Active",
    employeeId: "b2f573b0-54f2-42e3-9d9a-a287a673fd48",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    coverageDetails: {
      type: "Gold",
      deductible: 500,
      coverageLimit: 250000,
      copayment: 10
    },
    premium: 12000
  },
  {
    id: uuidv4(),
    policyNumber: "POL-34567",
    type: "Family",
    status: "Active",
    employeeId: "e5b9ee9b-385a-4827-916f-a44ef2d6a080",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    coverageDetails: {
      type: "Family",
      deductible: 2000,
      coverageLimit: 500000,
      copayment: 15
    },
    premium: 20000
  },
  {
    id: uuidv4(),
    policyNumber: "POL-45678",
    type: "Platinum",
    status: "Active",
    employeeId: "14bddcc0-c0f3-43c0-9ea2-736e7a558445",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    coverageDetails: {
      type: "Platinum",
      deductible: 0,
      coverageLimit: 1000000,
      copayment: 0
    },
    premium: 30000
  }
];

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("health_prediction");
    const policiesCollection = database.collection("policies");

    // Clear existing policies if needed
    await policiesCollection.deleteMany({});
    console.log("Cleared existing policies");

    // Insert policy documents
    const result = await policiesCollection.insertMany(policies);
    console.log(`${result.insertedCount} policies inserted.`);

    // Show the inserted policies
    console.log("\nInserted policies:");
    const insertedPolicies = await policiesCollection.find({}).toArray();
    insertedPolicies.forEach(policy => {
      console.log(`- Policy ID: ${policy.id}, Type: ${policy.type}, Employee ID: ${policy.employeeId}`);
    });

  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

run().catch(console.error); 