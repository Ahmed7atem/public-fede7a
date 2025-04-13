const mongoose = require('mongoose');
const { HealthData, WearableData, Employee } = require('../models/schemas');

async function migrateData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/health_prediction');
    console.log('Connected to MongoDB');

    // Get all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);

    for (const employee of employees) {
      const employeeId = employee._id.toString();
      console.log(`Processing employee: ${employeeId}`);

      // Create sample health data
      const healthData = new HealthData({
        employee: employeeId,
        recordedAt: new Date(),
        weight: Math.floor(Math.random() * (100 - 50) + 50),
        height: Math.floor(Math.random() * (200 - 150) + 150),
        bmi: Math.floor(Math.random() * (35 - 18) + 18),
        hemoglobin: Math.floor(Math.random() * (17 - 12) + 12),
        cholesterol: Math.floor(Math.random() * (240 - 150) + 150),
        bloodSugar: Math.floor(Math.random() * (140 - 70) + 70),
        creatinine: Math.random() * (1.4 - 0.6) + 0.6,
      });

      // Create sample wearable data for the last 30 days
      const wearableData = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        wearableData.push(new WearableData({
          employee: employeeId,
          logDate: date,
          stepCount: Math.floor(Math.random() * (15000 - 3000) + 3000),
          activeEnergyKj: Math.floor(Math.random() * (3000 - 500) + 500),
          exerciseTimeMin: Math.floor(Math.random() * (120 - 10) + 10),
          standHours: Math.floor(Math.random() * (16 - 8) + 8),
          heartRateMin: Math.floor(Math.random() * (60 - 45) + 45),
          heartRateMax: Math.floor(Math.random() * (180 - 120) + 120),
          heartRateAvg: Math.floor(Math.random() * (100 - 60) + 60),
          sleepQuality: Math.floor(Math.random() * (100 - 50) + 50),
          timeInBed: Math.floor(Math.random() * (600 - 360) + 360),
          heartRateSleep: Math.floor(Math.random() * (80 - 40) + 40)
        }));
      }

      // Save the data
      await healthData.save();
      await WearableData.insertMany(wearableData);
      
      console.log(`Created health and wearable data for employee: ${employeeId}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateData(); 