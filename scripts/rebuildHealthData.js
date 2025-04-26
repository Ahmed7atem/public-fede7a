const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const uri = 'mongodb+srv://ahmedhatem:Rk23610359@medbond.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function rebuildHealthData() {
  try {
    // Step 1: Connect to MongoDB Atlas
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('health_prediction');
    const employeesCollection = db.collection('employees');
    const healthDataCollection = db.collection('healthdatas');

    // Step 2: Drop existing health data collection
    await healthDataCollection.drop();
    console.log('Dropped existing health data collection');

    // Step 3: Get all employees and transform their data
    const employees = await employeesCollection.find({}).toArray();
    console.log(`\nFound ${employees.length} employees to process`);

    // Step 4: Create health data documents
    const healthDataDocuments = employees.map(employee => ({
      employee: employee.employeeId,
      recordedAt: new Date(),
      weight: parseFloat(employee.Weight_kg),
      height: parseFloat(employee.Height_cm),
      bmi: parseFloat(employee.BMI),
      hemoglobin: parseFloat(employee.Hemoglobin),
      cholesterol: parseFloat(employee.Cholesterol),
      bloodSugar: parseFloat(employee.Blood_Sugar),
      creatinine: parseFloat(employee.Creatinine),
      chronicDisease: employee.Chronic_Disease,
      chronicDiseaseCount: parseInt(employee.Chronic_diseases_count),
      familyMedicalHistory: employee.family_medical_history,
      claimedAmount: parseFloat(employee.Claimed_Amount),
      insuranceScore: parseFloat(employee.Insurance_Score),
      smokerScore: parseFloat(employee.Smoker_Score),
      familyScore: parseFloat(employee.Family_Score),
      lifestyleScore: parseFloat(employee.Lifestyle_Score),
      bmiScore: parseFloat(employee.BMI_Score),
      hemoglobinScore: parseFloat(employee.Hemoglobin_Score),
      sugarScore: parseFloat(employee.Sugar_Score),
      cholesterolScore: parseFloat(employee.Cholesterol_Score),
      creatinineScore: parseFloat(employee.Creatinine_Score),
      physicalScore: parseFloat(employee.Physical_Score),
      wellnessScore: parseFloat(employee.Wellness_Score),
      version: "1.0",
      policy: {
        policyId: employee.Policy_ID,
        planName: employee.Plan_Name,
        coverageDetails: employee.Coverage_Details,
        startDate: new Date(employee.Start_Date),
        endDate: new Date(employee.End_Date)
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Step 5: Insert health data documents
    const result = await healthDataCollection.insertMany(healthDataDocuments);
    console.log(`\nInserted ${result.insertedCount} health data records`);

    // Step 6: Verify the data
    const sampleHealthData = await healthDataCollection
      .find({}, {
        projection: {
          _id: 1,
          employee: 1,
          recordedAt: 1,
          weight: 1,
          height: 1,
          bmi: 1,
          hemoglobin: 1,
          cholesterol: 1,
          bloodSugar: 1,
          creatinine: 1,
          chronicDisease: 1,
          chronicDiseaseCount: 1,
          familyMedicalHistory: 1,
          claimedAmount: 1,
          insuranceScore: 1,
          smokerScore: 1,
          familyScore: 1,
          lifestyleScore: 1,
          bmiScore: 1,
          hemoglobinScore: 1,
          sugarScore: 1,
          cholesterolScore: 1,
          creatinineScore: 1,
          physicalScore: 1,
          wellnessScore: 1,
          version: 1,
          policy: 1,
          createdAt: 1,
          updatedAt: 1
        }
      })
      .limit(5)
      .toArray();

    console.log('\nSample of inserted health data (first 5):');
    sampleHealthData.forEach(data => console.log(JSON.stringify(data, null, 2)));

    // Step 7: Create indexes
    await healthDataCollection.createIndex({ employee: 1 }, { unique: true });
    await healthDataCollection.createIndex({ 'policy.policyId': 1 });
    console.log('\nCreated indexes on employee and policy fields');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

rebuildHealthData().catch(console.dir); 