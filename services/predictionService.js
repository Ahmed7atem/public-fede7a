const { HealthData } = require('../models/schemas');

// Simple health risk prediction
exports.predictHealthRisk = async (healthData) => {
  try {
    // Basic risk calculation based on BMI and blood pressure
    const bmi = healthData.weight / ((healthData.height / 100) ** 2);
    const bloodPressure = healthData.bloodPressure || '120/80';
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);

    let riskScore = 0;
    const factors = [];

    // BMI factor
    if (bmi > 30) {
      riskScore += 3;
      factors.push('High BMI');
    } else if (bmi > 25) {
      riskScore += 1;
      factors.push('Overweight');
    }

    // Blood pressure factor
    if (systolic > 140 || diastolic > 90) {
      riskScore += 2;
      factors.push('High blood pressure');
    }

    // Determine risk level
    let prediction;
    if (riskScore >= 4) {
      prediction = 'High Risk';
    } else if (riskScore >= 2) {
      prediction = 'Medium Risk';
    } else {
      prediction = 'Low Risk';
    }

    return {
      prediction,
      riskScore,
      factors
    };
  } catch (error) {
    console.error('Error in health risk prediction:', error);
    throw error;
  }
};

// Get prediction for an employee
exports.predict = async (employeeId) => {
  try {
    const healthData = await HealthData.findOne({ employee: employeeId });
    if (!healthData) {
      throw new Error('No health data found for employee');
    }
    return await exports.predictHealthRisk(healthData);
  } catch (error) {
    console.error('Error in prediction:', error);
    throw error;
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

module.exports = {
  predictHealthRisk
};