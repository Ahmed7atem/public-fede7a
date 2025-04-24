const { HealthData } = require('../models/schemas');

const calculateBMI = (weight, height) => {
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

const assessRiskFactors = (healthData) => {
  const riskFactors = [];
  const { systolic, diastolic, cholesterol, bloodSugar, smoker, age, chronicDiseaseCount } = healthData;
  
  // BMI Risk
  const bmi = calculateBMI(healthData.weight, healthData.height);
  if (bmi >= 30) riskFactors.push('Obesity');
  else if (bmi >= 25) riskFactors.push('Overweight');
  
  // Blood Pressure Risk
  if (systolic >= 140 || diastolic >= 90) riskFactors.push('High Blood Pressure');
  
  // Cholesterol Risk
  if (cholesterol >= 240) riskFactors.push('High Cholesterol');
  
  // Blood Sugar Risk
  if (bloodSugar >= 126) riskFactors.push('High Blood Sugar');
  
  // Smoking Risk
  if (smoker) riskFactors.push('Smoking');
  
  // Age Risk
  if (age >= 60) riskFactors.push('Advanced Age');
  
  // Chronic Disease Risk
  if (chronicDiseaseCount > 0) riskFactors.push('Chronic Conditions');
  
  return riskFactors;
};

const calculateRiskScore = (healthData) => {
  let score = 0;
  const riskFactors = assessRiskFactors(healthData);
  
  // Base score from number of risk factors
  score += riskFactors.length * 10;
  
  // Additional weight for specific conditions
  if (riskFactors.includes('High Blood Pressure')) score += 15;
  if (riskFactors.includes('High Cholesterol')) score += 15;
  if (riskFactors.includes('High Blood Sugar')) score += 20;
  if (riskFactors.includes('Smoking')) score += 25;
  if (riskFactors.includes('Chronic Conditions')) score += 20;
  
  return Math.min(score, 100); // Cap at 100
};

const predictHealthRisk = async (healthData) => {
  const riskScore = calculateRiskScore(healthData);
  const riskFactors = assessRiskFactors(healthData);
  
  let predictionValue;
  let confidence;
  
  if (riskScore >= 80) {
    predictionValue = 'High Risk';
    confidence = 0.9;
  } else if (riskScore >= 50) {
    predictionValue = 'Medium Risk';
    confidence = 0.75;
  } else {
    predictionValue = 'Low Risk';
    confidence = 0.85;
  }
  
  return {
    predictionValue,
    confidence,
    factors: riskFactors,
    score: riskScore
  };
};

exports.predict = async (employeeId) => {
  try {
    // Get the latest health data for the employee
    const healthData = await HealthData.findOne({ employee: employeeId })
      .sort({ recordedAt: -1 });

    if (!healthData) {
      throw new Error('No health data found for employee');
    }

    // Calculate risk score based on health data
    let riskScore = 0;
    const factors = [];

    // BMI factor
    if (healthData.bmi > 30) {
      riskScore += 3;
      factors.push('High BMI');
    }

    // Hemoglobin factor
    if (healthData.hemoglobin < 12 || healthData.hemoglobin > 17) {
      riskScore += 2;
      factors.push('Abnormal hemoglobin');
    }

    // Cholesterol factor
    if (healthData.cholesterol > 200) {
      riskScore += 2;
      factors.push('High cholesterol');
    }

    // Blood sugar factor
    if (healthData.bloodSugar > 100) {
      riskScore += 2;
      factors.push('High blood sugar');
    }

    // Determine prediction and confidence
    let prediction;
    let confidence;

    if (riskScore >= 7) {
      prediction = 'High Risk';
      confidence = 0.9;
    } else if (riskScore >= 4) {
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
      riskScore,
      healthData
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
        const prediction = await predictHealthRisk(data);
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