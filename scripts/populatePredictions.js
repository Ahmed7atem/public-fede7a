const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Prediction } = require('../models');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Read the employee analysis JSON file
    const analysisData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/employee_analysis.json'), 'utf8')
    );

    // Clear existing predictions
    await Prediction.deleteMany({});
    console.log('Cleared existing predictions');

    // Transform and insert the data
    const predictions = analysisData.employee_analyses.map(analysis => ({
      employeeId: analysis.employeeId,
      predictedAt: new Date(),
      predictionType: 'health_assessment',
      predictionValue: analysis.health_trend_analysis.current.wellnessScore > 0.7 ? 'Good' : 
                      analysis.health_trend_analysis.current.wellnessScore > 0.4 ? 'Moderate' : 'Poor',
      confidence: 0.85,
      factors: analysis.recommendations,
      additionalData: {
        healthTrendAnalysis: analysis.health_trend_analysis,
        comments: analysis.comments,
        planUpgrade: analysis.plan_upgrade
      }
    }));

    // Insert predictions in batches of 100
    const batchSize = 100;
    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      await Prediction.insertMany(batch);
      console.log(`Inserted batch ${i / batchSize + 1}`);
    }

    console.log('Successfully populated predictions collection');
  } catch (error) {
    console.error('Error populating predictions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 