const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Define schemas
const employeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: String,
  age: Number,
  ageGroup: String,
  gender: String,
  children: Number,
  smoker: Boolean,
  planName: String,
  coverageDetails: String,
  startDate: Date,
  endDate: Date,
  department: String,
  education: String,
  recruitmentChannel: String,
  noOfTrainings: Number,
  previousYearRating: Number,
  lengthOfService: Number,
  kpisMet80: Boolean,
  avgTrainingScore: Number,
  version: { type: String, default: '1.0' },
  createdAt: Date,
  updatedAt: Date
}, { _id: false, versionKey: false });

const healthDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  recordedAt: Date,
  weight: Number,
  height: Number,
  bmi: Number,
  hemoglobin: Number,
  cholesterol: Number,
  bloodSugar: Number,
  creatinine: Number,
  chronicDisease: String,
  chronicDiseaseCount: Number,
  familyMedicalHistory: String,
  claimedAmount: Number,
  insuranceScore: Number,
  smokerScore: Number,
  familyScore: Number,
  lifestyleScore: Number,
  bmiScore: Number,
  hemoglobinScore: Number,
  sugarScore: Number,
  cholesterolScore: Number,
  creatinineScore: Number,
  physicalScore: Number,
  wellnessScore: Number,
  version: { type: String, default: '1.0' },
  createdAt: Date,
  updatedAt: Date
}, { versionKey: false });

const sleepDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  startTime: Date,
  endTime: Date,
  sleepQuality: Number,
  timeInBed: Number,
  sleepNotes: [String],
  heartRate: Number,
  version: { type: String, default: '1.0' },
  createdAt: Date,
  updatedAt: Date
}, { versionKey: false });

const wearableDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  date: Date,
  activeEnergy: Number,
  exerciseTime: Number,
  standHours: Number,
  standTime: Number,
  environmentalAudioExposure: Number,
  flightsClimbed: Number,
  headphoneAudioExposure: Number,
  heartRateMin: Number,
  heartRateMax: Number,
  heartRateAvg: Number,
  heartRateVariability: Number,
  physicalEffort: Number,
  restingEnergy: Number,
  restingHeartRate: Number,
  stepCount: Number,
  walkingRunningDistance: Number,
  walkingHeartRateAvg: Number,
  walkingSpeed: Number,
  walkingStepLength: Number,
  version: { type: String, default: '1.0' },
  createdAt: Date,
  updatedAt: Date
}, { versionKey: false });

// Models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const SleepData = mongoose.model('SleepData', sleepDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_predictions';
const EMPLOYEE_ID = '8f7b7927-6c04-401a-ab0b-61000132f970';

// Utility functions
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const [month, day, year] = dateStr.split('-').map(Number);
    const fullYear = 2000 + year;
    let [time, period] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(fullYear, month - 1, day, hours, minutes, seconds).toISOString();
  } catch (err) {
    console.error(`Error parsing date ${dateStr} ${timeStr}:`, err.message);
    return null;
  }
}

function parseTimeInBed(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

async function populateAllData() {
  let errors = [];
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop collections to ensure clean schemas
    await mongoose.connection.dropCollection('employees').catch(() => {});
    await mongoose.connection.dropCollection('healthdatas').catch(() => {});
    await mongoose.connection.dropCollection('sleepdatas').catch(() => {});
    await mongoose.connection.dropCollection('wearabledatas').catch(() => {});
    console.log('Dropped existing collections');

    // Process NewData.csv
    const newDataRecords = [];
    const newDataCsvPath = '/Volumes/MySSD/GP Code/public-fede7a/data/NewData.csv';
    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(newDataCsvPath)
          .pipe(csv())
          .on('data', (row) => newDataRecords.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      console.log(`Processed ${newDataRecords.length} records from NewData.csv`);
    } catch (fileError) {
      console.error(`Error reading NewData CSV:`, fileError.message);
      errors.push({ file: 'NewData.csv', error: fileError.message });
    }

    const employees = [];
    const healthData = [];
    const processedIds = new Set();
    const emailSet = new Set();

    for (const row of newDataRecords) {
      try {
        let patientId = row.Patient_ID || uuidv4();
        if (processedIds.has(patientId)) {
          patientId = uuidv4();
          console.log(`Assigned new Patient_ID ${patientId} for duplicate`);
        }
        processedIds.add(patientId);

        let email = `employee${patientId.slice(0, 8)}@example.com`;
        let emailSuffix = 1;
        while (emailSet.has(email)) {
          email = `employee${patientId.slice(0, 8)}${emailSuffix}@example.com`;
          emailSuffix++;
        }
        emailSet.add(email);

        const now = new Date();
        employees.push({
          id: patientId,
          name: `Employee ${patientId.slice(0, 8)}`,
          email,
          password: await bcryptjs.hash('password123', 10),
          role: 'employee',
          age: parseInt(row.Age) || 0,
          ageGroup: row.Age_Group || '',
          gender: row.Gender || '',
          children: parseInt(row.Children) || 0,
          smoker: row.Smoker === 'Yes',
          planName: row.Plan_Name || '',
          coverageDetails: row.Coverage_Details || '',
          startDate: row.Start_Date ? new Date(row.Start_Date) : null,
          endDate: row.End_Date ? new Date(row.End_Date) : null,
          department: row.Department || '',
          education: row.Education || '',
          recruitmentChannel: row.Recruitment_Channel || '',
          noOfTrainings: parseInt(row.No_of_Trainings) || 0,
          previousYearRating: parseInt(row.Previous_Year_Rating) || 0,
          lengthOfService: parseInt(row.Length_of_Service) || 0,
          kpisMet80: parseInt(row.KPIs_Met_80) === 1,
          avgTrainingScore: parseFloat(row.Avg_Training_Score) || 0,
          version: '1.0',
          createdAt: now,
          updatedAt: now
        });

        healthData.push({
          employee: patientId,
          recordedAt: now,
          weight: parseFloat(row.Weight_kg) || 0,
          height: parseFloat(row.Height_cm) || 0,
          bmi: parseFloat(row.BMI) || 0,
          hemoglobin: parseFloat(row.Hemoglobin) || 0,
          cholesterol: parseFloat(row.Cholesterol) || 0,
          bloodSugar: parseFloat(row.Blood_Sugar) || 0,
          creatinine: parseFloat(row.Creatinine) || 0,
          chronicDisease: row.Chronic_Disease || '',
          chronicDiseaseCount: parseInt(row.Chronic_diseases_count) || 0,
          familyMedicalHistory: row.family_medical_history || '',
          claimedAmount: parseFloat(row.Claimed_Amount) || 0,
          insuranceScore: parseFloat(row.Insurance_Score) || 0,
          smokerScore: parseFloat(row.Smoker_Score) || 0,
          familyScore: parseFloat(row.Family_Score) || 0,
          lifestyleScore: parseFloat(row.Lifestyle_Score) || 0,
          bmiScore: parseFloat(row.BMI_Score) || 0,
          hemoglobinScore: parseFloat(row.Hemoglobin_Score) || 0,
          sugarScore: parseFloat(row.Sugar_Score) || 0,
          cholesterolScore: parseFloat(row.Cholesterol_Score) || 0,
          creatinineScore: parseFloat(row.Creatinine_Score) || 0,
          physicalScore: parseFloat(row.Physical_Score) || 0,
          wellnessScore: parseFloat(row.Wellness_Score) || 0,
          version: '1.0',
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.error(`Error processing NewData row ${row.Patient_ID || 'unknown'}:`, err.message);
        errors.push({ id: row.Patient_ID || 'unknown', error: err.message });
      }
    }

    // Process sleep_data.csv
    const sleepRecords = [];
    const sleepCsvPath = '/Volumes/MySSD/GP Code/public-fede7a/data/sleep_data.csv';
    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(sleepCsvPath)
          .pipe(csv())
          .on('data', (row) => sleepRecords.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      console.log(`Processed ${sleepRecords.length} sleep records from CSV`);
    } catch (fileError) {
      console.error(`Error reading sleep CSV:`, fileError.message);
      errors.push({ file: 'sleep_data.csv', error: fileError.message });
    }

    const sleepData = sleepRecords.map(row => {
      try {
        const startTime = parseDateTime(row.Date, row.Start);
        const endTime = parseDateTime(row.Date, row.End);
        if (!startTime || !endTime) throw new Error('Invalid start or end time');
        return {
          employee: EMPLOYEE_ID,
          startTime,
          endTime,
          sleepQuality: parseFloat(row['Sleep quality']?.replace('%', '')) || 0,
          timeInBed: parseTimeInBed(row['Time in bed']),
          sleepNotes: row['Sleep Notes'] ? row['Sleep Notes'].split(':').filter(note => note) : [],
          heartRate: parseInt(row['Heart rate']) || 0,
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (err) {
        console.error(`Error processing sleep row ${row.Date}:`, err.message);
        errors.push({ row: row.Date, error: err.message });
        return null;
      }
    }).filter(record => record);

    // Process apple_watch_data.csv
    const wearableRecords = [];
    const wearableCsvPath = '/Volumes/MySSD/GP Code/public-fede7a/data/apple_watch_data.csv';
    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(wearableCsvPath)
          .pipe(csv())
          .on('data', (row) => wearableRecords.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      console.log(`Processed ${wearableRecords.length} wearable records from CSV`);
    } catch (fileError) {
      console.error(`Error reading wearable CSV:`, fileError.message);
      errors.push({ file: 'apple_watch_data.csv', error: fileError.message });
    }

    const wearableData = wearableRecords.map(row => {
      try {
        const date = parseDateTime(row.Date, '00:00:00');
        if (!date) throw new Error('Invalid date');
        return {
          employee: EMPLOYEE_ID,
          date,
          activeEnergy: parseFloat(row['Active Energy (kJ)']) || 0,
          exerciseTime: parseFloat(row['Apple Exercise Time (min)']) || 0,
          standHours: parseFloat(row['Apple Stand Hour (hours)']) || 0,
          standTime: parseFloat(row['Apple Stand Time (min)']) || 0,
          environmentalAudioExposure: parseFloat(row['Environmental Audio Exposure (dBASPL)']) || 0,
          flightsClimbed: parseFloat(row['Flights Climbed (count)']) || 0,
          headphoneAudioExposure: parseFloat(row['Headphone Audio Exposure (dBASPL)']) || 0,
          heartRateMin: parseFloat(row['Heart Rate [Min] (bpm)']) || 0,
          heartRateMax: parseFloat(row['Heart Rate [Max] (bpm)']) || 0,
          heartRateAvg: parseFloat(row['Heart Rate [Avg] (bpm)']) || 0,
          heartRateVariability: parseFloat(row['Heart Rate Variability (ms)']) || 0,
          physicalEffort: parseFloat(row['Physical Effort (MET)']) || 0,
          restingEnergy: parseFloat(row['Resting Energy (kJ)']) || 0,
          restingHeartRate: parseFloat(row['Resting Heart Rate (bpm)']) || 0,
          stepCount: parseFloat(row['Step Count (steps)']) || 0,
          walkingRunningDistance: parseFloat(row['Walking + Running Distance (km)']) || 0,
          walkingHeartRateAvg: parseFloat(row['Walking Heart Rate Average (bpm)']) || 0,
          walkingSpeed: parseFloat(row['Walking Speed (km/hr)']) || 0,
          walkingStepLength: parseFloat(row['Walking Step Length (cm)']) || 0,
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (err) {
        console.error(`Error processing wearable row ${row.Date}:`, err.message);
        errors.push({ row: row.Date, error: err.message });
        return null;
      }
    }).filter(record => record);

    // Insert data in batches
    const batchSize = 50;
    let successCounts = { employee: 0, health: 0, sleep: 0, wearable: 0 };

    // Insert employees
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      try {
        if (batch.length > 0) {
          const result = await Employee.insertMany(batch, { ordered: false });
          successCounts.employee += result.length;
          console.log(`Inserted ${result.length} employee records (batch ${Math.floor(i / batchSize) + 1})`);
        }
      } catch (err) {
        console.error(`Error inserting employee batch ${i / batchSize + 1}:`, err.message);
        errors.push({ batch: `employee-${i / batchSize + 1}`, error: err.message });
      }
    }

    // Insert health data
    for (let i = 0; i < healthData.length; i += batchSize) {
      const batch = healthData.slice(i, i + batchSize);
      try {
        if (batch.length > 0) {
          const result = await HealthData.insertMany(batch, { ordered: false });
          successCounts.health += result.length;
          console.log(`Inserted ${result.length} health records (batch ${Math.floor(i / batchSize) + 1})`);
        }
      } catch (err) {
        console.error(`Error inserting health batch ${i / batchSize + 1}:`, err.message);
        errors.push({ batch: `health-${i / batchSize + 1}`, error: err.message });
      }
    }

    // Insert sleep data (individual inserts to handle errors)
    for (const record of sleepData) {
      try {
        await SleepData.create(record);
        successCounts.sleep += 1;
      } catch (err) {
        console.error(`Error inserting sleep record for ${record.startTime}:`, err.message);
        errors.push({ row: record.startTime, error: err.message });
      }
    }
    console.log(`Inserted ${successCounts.sleep} sleep records`);

    // Insert wearable data
    for (let i = 0; i < wearableData.length; i += batchSize) {
      const batch = wearableData.slice(i, i + batchSize);
      try {
        if (batch.length > 0) {
          const result = await WearableData.insertMany(batch, { ordered: false });
          successCounts.wearable += result.length;
          console.log(`Inserted ${result.length} wearable records (batch ${Math.floor(i / batchSize) + 1})`);
        }
      } catch (err) {
        console.error(`Error inserting wearable batch ${i / batchSize + 1}:`, err.message);
        errors.push({ batch: `wearable-${i / batchSize + 1}`, error: err.message });
      }
    }

    // Verify counts
    const counts = {
      employee: await Employee.countDocuments({}),
      health: await HealthData.countDocuments(),
      sleep: await SleepData.countDocuments({ employee: EMPLOYEE_ID }),
      wearable: await WearableData.countDocuments({ employee: EMPLOYEE_ID })
    };
    console.log(`\nDatabase Verification:`);
    console.log(`Employee collection: ${counts.employee} records`);
    console.log(`HealthData collection: ${counts.health} records`);
    console.log(`SleepData collection: ${counts.sleep} records`);
    console.log(`WearableData collection: ${counts.wearable} records`);

    // Sample documents (non-admin for Employee)
    console.log('Sample Employee document:', JSON.stringify(await Employee.findOne({ role: 'employee' }), null, 2));
    console.log('Sample HealthData document:', JSON.stringify(await HealthData.findOne(), null, 2));
    console.log('Sample SleepData document:', JSON.stringify(await SleepData.findOne(), null, 2));
    console.log('Sample WearableData document:', JSON.stringify(await WearableData.findOne(), null, 2));

    console.log('\nImport Summary:');
    console.log(`Successfully imported: ${JSON.stringify(successCounts, null, 2)}`);
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(err => console.log(`${err.id || err.batch || err.file || err.row}: ${err.error}`));
    }

  } catch (err) {
    console.error('Error during population:', err.message);
    errors.push({ error: err.message });
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

// Run the script
populateAllData().catch(err => {
  console.error('Population script failed:', err);
  process.exit(1);
});