const { HealthData } = require('../models/schemas');

exports.predictHealthRisk = async (healthData) => {
  try {
    // Calculate risk score based on health data
    let riskScore = 0;
    const factors = [];

    // Age factor
    if (healthData.age > 50) {
      riskScore += 2;
      factors.push('Age over 50');
    }

    // BMI factor
    const bmi = healthData.weight / (healthData.height * healthData.height);
    if (bmi > 30) {
      riskScore += 3;
      factors.push('High BMI');
    }

    // Blood pressure factor
    if (healthData.systolic > 140 || healthData.diastolic > 90) {
      riskScore += 2;
      factors.push('High blood pressure');
    }

    // Cholesterol factor
    if (healthData.cholesterol > 200) {
      riskScore += 2;
      factors.push('High cholesterol');
    }

    // Smoking factor
    if (healthData.smoker) {
      riskScore += 3;
      factors.push('Smoking');
    }

    // Determine prediction and confidence
    let prediction;
    let confidence;

    if (riskScore >= 10) {
      prediction = 'High Risk';
      confidence = 0.9;
    } else if (riskScore >= 5) {
      prediction = 'Medium Risk';
      confidence = 0.7;
    } else {
      prediction = 'Low Risk';
      confidence = 0.8;
    }

    return {
      prediction,
      confidence,
      factors,
      riskScore
    };
  } catch (error) {
    throw new Error(`Prediction failed: ${error.message}`);
  }
};

exports.getHistoricalPredictions = async (employeeId) => {
  try {
    const healthData = await HealthData.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const predictions = await Promise.all(
      healthData.map(async (data) => {
        const prediction = await exports.predictHealthRisk(data);
        return {
          date: data.createdAt,
          ...prediction
        };
      })
    );

    return predictions;
  } catch (error) {
    throw new Error(`Failed to get historical predictions: ${error.message}`);
  }
};