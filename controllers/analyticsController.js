const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Claim, Policy, Provider, Complaint, Prediction, ComplaintTicket } = require('../models/schemas');

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
};

// Helper function to calculate BMI category
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Helper function to calculate health risk score
const calculateHealthRisk = (healthData, wearableData) => {
  let riskScore = 0;
  
  // BMI risk
  if (healthData?.bmi) {
    if (healthData.bmi < 18.5 || healthData.bmi >= 30) riskScore += 2;
    else if (healthData.bmi >= 25) riskScore += 1;
  }
  
  // Blood pressure risk
  if (healthData?.bloodPressure) {
    const [systolic, diastolic] = healthData.bloodPressure.split('/').map(Number);
    if (systolic >= 140 || diastolic >= 90) riskScore += 2;
    else if (systolic >= 130 || diastolic >= 85) riskScore += 1;
  }
  
  // Activity level risk
  if (wearableData) {
    if (wearableData.stepCount < 5000) riskScore += 1;
    if (wearableData.heartRate > 100) riskScore += 1;
    if (wearableData.sleepHours < 6) riskScore += 1;
  }
  
  return riskScore;
};

// Get comprehensive employee analytics
router.get('/employee/:id', async (req, res) => {
  try {
    const employeeId = convertToObjectId(req.params.id);
    
    // Find employee by either UUID or ObjectId
    const employee = await Employee.findOne({ 
      $or: [
        { _id: employeeId },
        { id: employeeId }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get health data
    const healthData = await HealthData.findOne({ employeeId: employee.id || employee._id });
    
    // Get wearable data
    const wearableData = await WearableData.find({ employeeId: employee.id || employee._id })
      .sort({ timestamp: -1 })
      .limit(30);
    
    // Get sleep data
    const sleepData = await SleepData.find({ employeeId: employee.id || employee._id })
      .sort({ date: -1 })
      .limit(7);

    // Calculate health metrics
    const healthMetrics = {
      bmi: employee.bmi || 0,
      bloodPressure: employee.bloodPressure || { systolic: 0, diastolic: 0 },
      diabetic: employee.diabetic || false,
      smoker: employee.smoker || false,
      children: employee.children || 0,
      region: employee.region || 'Unknown'
    };

    // Calculate activity metrics from wearable data
    const activityMetrics = {
      averageSteps: wearableData.length > 0 
        ? wearableData.reduce((sum, data) => sum + (data.steps || 0), 0) / wearableData.length 
        : 0,
      averageHeartRate: wearableData.length > 0 
        ? wearableData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / wearableData.length 
        : 0,
      averageCalories: wearableData.length > 0 
        ? wearableData.reduce((sum, data) => sum + (data.calories || 0), 0) / wearableData.length 
        : 0
    };

    // Calculate sleep metrics
    const sleepMetrics = {
      averageDuration: sleepData.length > 0 
        ? sleepData.reduce((sum, data) => sum + (data.duration || 0), 0) / sleepData.length 
        : 0,
      averageQuality: sleepData.length > 0 
        ? sleepData.reduce((sum, data) => sum + (data.quality || 0), 0) / sleepData.length 
        : 0,
      averageDeepSleep: sleepData.length > 0 
        ? sleepData.reduce((sum, data) => sum + (data.deepSleep || 0), 0) / sleepData.length 
        : 0
    };

    // Calculate health risk score
    const healthRiskScore = calculateHealthRiskScore(healthMetrics, activityMetrics, sleepMetrics);

    res.json({
      employee: {
        id: employee.id || employee._id,
        name: employee.name,
        email: employee.email,
        age: employee.age,
        gender: employee.gender
      },
      healthMetrics,
      activityMetrics,
      sleepMetrics,
      healthRiskScore,
      recentWearableData: wearableData,
      recentSleepData: sleepData
    });
  } catch (error) {
    console.error('Error fetching comprehensive employee data:', error);
    res.status(500).json({ 
      message: 'Error fetching comprehensive employee data',
      error: error.message 
    });
  }
});

// Helper function to calculate health risk score
function calculateHealthRiskScore(healthMetrics, activityMetrics, sleepMetrics) {
  let score = 0;
  
  // BMI contribution (0-30)
  if (healthMetrics.bmi < 18.5) score += 10; // Underweight
  else if (healthMetrics.bmi >= 18.5 && healthMetrics.bmi < 25) score += 0; // Normal
  else if (healthMetrics.bmi >= 25 && healthMetrics.bmi < 30) score += 10; // Overweight
  else score += 20; // Obese

  // Blood pressure contribution (0-20)
  if (healthMetrics.bloodPressure.systolic > 140 || healthMetrics.bloodPressure.diastolic > 90) {
    score += 20;
  } else if (healthMetrics.bloodPressure.systolic > 120 || healthMetrics.bloodPressure.diastolic > 80) {
    score += 10;
  }

  // Activity contribution (0-20)
  if (activityMetrics.averageSteps < 5000) score += 20;
  else if (activityMetrics.averageSteps < 7500) score += 10;

  // Sleep contribution (0-15)
  if (sleepMetrics.averageDuration < 6) score += 15;
  else if (sleepMetrics.averageDuration < 7) score += 10;
  else if (sleepMetrics.averageDuration < 8) score += 5;

  // Additional risk factors (0-15)
  if (healthMetrics.diabetic) score += 10;
  if (healthMetrics.smoker) score += 5;

  // Calculate final score (0-100)
  const finalScore = Math.min(100, score);
  
  return {
    score: finalScore,
    level: finalScore < 25 ? 'Low' : finalScore < 50 ? 'Moderate' : finalScore < 75 ? 'High' : 'Very High',
    contributingFactors: {
      bmi: healthMetrics.bmi,
      bloodPressure: healthMetrics.bloodPressure,
      activity: activityMetrics.averageSteps,
      sleep: sleepMetrics.averageDuration,
      diabetic: healthMetrics.diabetic,
      smoker: healthMetrics.smoker
    }
  };
}

// Get organization-wide analytics
router.get('/organization', async (req, res) => {
  try {
    // Get all employees with their basic information
    const employees = await Employee.find().select('age gender department smoker children education');
    
    // Get all related data
    const [healthData, wearableData, sleepRecords, claims, policies] = await Promise.all([
      HealthData.find().select('weight height bmi cholesterol bloodSugar hemoglobin'),
      WearableData.find().select('stepCount heartRate activeEnergy exerciseTime'),
      SleepData.find().select('sleepDuration sleepEfficiency sleepStages'),
      Claim.find().select('status claimAmount'),
      Policy.find().select('type status')
    ]);

    // Calculate employee statistics
    const totalEmployees = employees.length;
    const averageAge = employees.reduce((sum, e) => sum + (e.age || 0), 0) / totalEmployees;
    
    const genderDistribution = employees.reduce((acc, e) => {
      acc[e.gender?.toLowerCase() || 'other'] = (acc[e.gender?.toLowerCase() || 'other'] || 0) + 1;
      return acc;
    }, {});

    // Calculate health metrics
    const bmiData = healthData.map(h => h.bmi || (h.weight && h.height ? 
      (h.weight / ((h.height / 100) ** 2)) : null)).filter(Boolean);
    
    const averageBMI = bmiData.reduce((sum, bmi) => sum + bmi, 0) / bmiData.length;
    
    const bmiDistribution = bmiData.reduce((acc, bmi) => {
      if (bmi < 18.5) acc.underweight = (acc.underweight || 0) + 1;
      else if (bmi < 25) acc.normal = (acc.normal || 0) + 1;
      else if (bmi < 30) acc.overweight = (acc.overweight || 0) + 1;
      else acc.obese = (acc.obese || 0) + 1;
      return acc;
    }, {});

    // Calculate activity metrics
    const activityData = wearableData.reduce((acc, data) => {
      acc.totalSteps += data.stepCount || 0;
      acc.totalHeartRate += data.heartRate || 0;
      acc.count += 1;
      
      // Categorize activity level
      const steps = data.stepCount || 0;
      if (steps < 5000) acc.activityLevels.sedentary += 1;
      else if (steps < 10000) acc.activityLevels.moderate += 1;
      else acc.activityLevels.active += 1;
      
      return acc;
    }, { 
      totalSteps: 0, 
      totalHeartRate: 0, 
      count: 0,
      activityLevels: { sedentary: 0, moderate: 0, active: 0 }
    });

    const averageSteps = activityData.totalSteps / activityData.count;
    const averageHeartRate = activityData.totalHeartRate / activityData.count;
    const totalActivityRecords = activityData.count;

    // Calculate sleep metrics
    const sleepStats = sleepRecords.reduce((acc, data) => {
      acc.totalSleep += data.sleepDuration || 0;
      acc.count += 1;
      
      // Categorize sleep quality
      const duration = data.sleepDuration || 0;
      if (duration < 6) acc.sleepQuality.insufficient += 1;
      else if (duration < 8) acc.sleepQuality.adequate += 1;
      else acc.sleepQuality.optimal += 1;
      
      return acc;
    }, { 
      totalSleep: 0, 
      count: 0,
      sleepQuality: { insufficient: 0, adequate: 0, optimal: 0 }
    });

    const averageSleep = sleepStats.totalSleep / sleepStats.count;
    const totalSleepRecords = sleepStats.count;

    // Calculate claims statistics
    const claimsData = claims.reduce((acc, claim) => {
      acc.total += 1;
      acc.totalAmount += claim.claimAmount || 0;
      
      if (claim.status === 'Approved') acc.approved += 1;
      else if (claim.status === 'Pending') acc.pending += 1;
      else if (claim.status === 'Rejected') acc.rejected += 1;
      
      return acc;
    }, { 
      total: 0, 
      approved: 0, 
      pending: 0, 
      rejected: 0, 
      totalAmount: 0 
    });

    const averageClaimAmount = claimsData.totalAmount / claimsData.total;
    const approvalRate = (claimsData.approved / claimsData.total) * 100;
    const averageClaimPerEmployee = claimsData.total / totalEmployees;

    res.json({
      overview: {
        totalEmployees,
        averageAge: Math.round(averageAge),
        genderDistribution
      },
      healthMetrics: {
        averageBMI: averageBMI.toFixed(2),
        bmiDistribution,
        averageSteps: Math.round(averageSteps),
        averageSleep: averageSleep.toFixed(1),
        averageHeartRate: Math.round(averageHeartRate)
      },
      activityAnalysis: {
        activityLevels: activityData.activityLevels,
        sedentaryPercentage: ((activityData.activityLevels.sedentary / totalActivityRecords) * 100).toFixed(1),
        activePercentage: ((activityData.activityLevels.active / totalActivityRecords) * 100).toFixed(1)
      },
      sleepAnalysis: {
        sleepQuality: sleepStats.sleepQuality,
        insufficientSleepPercentage: ((sleepStats.sleepQuality.insufficient / totalSleepRecords) * 100).toFixed(1),
        optimalSleepPercentage: ((sleepStats.sleepQuality.optimal / totalSleepRecords) * 100).toFixed(1)
      },
      claimsAnalysis: {
        total: claimsData.total,
        approved: claimsData.approved,
        pending: claimsData.pending,
        rejected: claimsData.rejected,
        totalAmount: claimsData.totalAmount.toFixed(2),
        averageAmount: averageClaimAmount.toFixed(2),
        approvalRate: approvalRate.toFixed(1),
        averageClaimPerEmployee: averageClaimPerEmployee.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error in organization analytics:', error);
    res.status(500).json({ 
      message: 'Error fetching organization analytics',
      error: error.message 
    });
  }
});

// Get health alerts and anomalies
router.get('/alerts', async (req, res) => {
  try {
    const employees = await Employee.find();
    const healthData = await HealthData.find().sort({ recordDate: -1 });
    const wearableData = await WearableData.find().sort({ recordDate: -1 });
    const sleepData = await SleepData.find().sort({ date: -1 });

    const alerts = [];

    // Check for health anomalies
    healthData.forEach(data => {
      if (data.bmi && (data.bmi < 18.5 || data.bmi >= 30)) {
        alerts.push({
          type: 'BMI Alert',
          employeeId: data.employee,
          value: data.bmi,
          threshold: data.bmi < 18.5 ? 'Below 18.5' : 'Above 30',
          severity: 'High',
          date: data.recordDate
        });
      }
      if (data.bloodPressure) {
        const [systolic, diastolic] = data.bloodPressure.split('/').map(Number);
        if (systolic >= 140 || diastolic >= 90) {
          alerts.push({
            type: 'Blood Pressure Alert',
            employeeId: data.employee,
            value: data.bloodPressure,
            threshold: 'Above 140/90',
            severity: 'High',
            date: data.recordDate
          });
        }
      }
    });

    // Check for activity anomalies
    wearableData.forEach(data => {
      if (data.stepCount < 3000) {
        alerts.push({
          type: 'Low Activity Alert',
          employeeId: data.employee,
          value: data.stepCount,
          threshold: 'Below 3000 steps',
          severity: 'Medium',
          date: data.recordDate
        });
      }
      if (data.heartRate > 100) {
        alerts.push({
          type: 'Elevated Heart Rate Alert',
          employeeId: data.employee,
          value: data.heartRate,
          threshold: 'Above 100 bpm',
          severity: 'Medium',
          date: data.recordDate
        });
      }
    });

    // Check for sleep anomalies
    sleepData.forEach(data => {
      if (data.sleepDuration < 6) {
        alerts.push({
          type: 'Insufficient Sleep Alert',
          employeeId: data.employee,
          value: data.sleepDuration,
          threshold: 'Below 6 hours',
          severity: 'Medium',
          date: data.date
        });
      }
    });

    // Sort alerts by severity and date
    alerts.sort((a, b) => {
      const severityOrder = { High: 0, Medium: 1, Low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.date) - new Date(a.date);
    });

    res.json({
      totalAlerts: alerts.length,
      highPriority: alerts.filter(a => a.severity === 'High').length,
      mediumPriority: alerts.filter(a => a.severity === 'Medium').length,
      alerts: alerts.slice(0, 50) // Return latest 50 alerts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comprehensive data for all employees
router.get('/all-data', async (req, res) => {
  try {
    const employees = await Employee.find();
    const employeeData = employees.map(employee => ({
      employee: {
        employeeId: employee.id,
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        joinDate: employee.joinDate,
        age: employee.age,
        ageGroup: employee.ageGroup,
        gender: employee.gender,
        children: employee.children,
        smoker: employee.smoker,
        education: employee.education,
        recruitmentChannel: employee.recruitmentChannel,
        noOfTrainings: employee.noOfTrainings,
        previousYearRating: employee.previousYearRating,
        lengthOfService: employee.lengthOfService,
        kpisMet80: employee.kpisMet80,
        avgTrainingScore: employee.avgTrainingScore,
        planName: employee.planName,
        coverageDetails: employee.coverageDetails,
        startDate: employee.startDate,
        endDate: employee.endDate
      },
      health: {
        latest: employee.healthData[0] || {},
        history: employee.healthData.map(h => ({
          weight: h.weight,
          height: h.height,
          bmi: h.bmi,
          bloodPressure: h.bloodPressure,
          cholesterol: h.cholesterol,
          bloodSugar: h.bloodSugar,
          hemoglobin: h.hemoglobin,
          creatinine: h.creatinine,
          chronicDisease: h.chronicDisease,
          chronicDiseaseCount: h.chronicDiseaseCount,
          familyMedicalHistory: h.familyMedicalHistory,
          claimedAmount: h.claimedAmount,
          recordDate: h.recordedAt
        })),
        riskScore: calculateHealthRisk(employee.healthData[0], employee.wearableData[0])
      },
      wearable: {
        latest: employee.wearableData[0] || {},
        history: employee.wearableData.map(w => ({
          activeEnergy: w.activeEnergy,
          exerciseTime: w.exerciseTime,
          standHours: w.standHours,
          standTime: w.standTime,
          environmentalAudioExposure: w.environmentalAudioExposure,
          flightsClimbed: w.flightsClimbed,
          headphoneAudioExposure: w.headphoneAudioExposure,
          heartRateMin: w.heartRateMin,
          heartRateMax: w.heartRateMax,
          heartRateAvg: w.heartRateAvg,
          heartRateVariability: w.heartRateVariability,
          physicalEffort: w.physicalEffort,
          restingEnergy: w.restingEnergy,
          restingHeartRate: w.restingHeartRate,
          stepCount: w.stepCount,
          walkingRunningDistance: w.walkingRunningDistance,
          walkingHeartRateAvg: w.walkingHeartRateAvg,
          walkingSpeed: w.walkingSpeed,
          walkingStepLength: w.walkingStepLength,
          recordDate: w.date
        })),
        stats: {
          totalSteps: employee.wearableData.reduce((acc, data) => acc + (data.stepCount || 0), 0),
          avgHeartRate: employee.wearableData.reduce((acc, data) => acc + (data.heartRate || 0), 0) / employee.wearableData.length,
          avgHRV: employee.wearableData.reduce((acc, data) => acc + (data.heartRateVariability || 0), 0) / employee.wearableData.length,
          totalActiveEnergy: employee.wearableData.reduce((acc, data) => acc + (data.activeEnergy || 0), 0),
          totalExerciseTime: employee.wearableData.reduce((acc, data) => acc + (data.exerciseTime || 0), 0),
          totalWalkingDistance: employee.wearableData.reduce((acc, data) => acc + (data.walkingDistance || 0), 0),
          totalDays: employee.wearableData.length
        }
      },
      sleep: {
        latest: employee.sleepData[0] || {},
        history: employee.sleepData.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          sleepQuality: s.sleepQuality,
          timeInBed: s.timeInBed,
          sleepNotes: s.sleepNotes,
          heartRate: s.heartRate,
          date: s.date
        })),
        stats: {
          totalSleepHours: employee.sleepData.reduce((acc, data) => acc + (data.sleepDuration || 0), 0),
          avgSleepEfficiency: employee.sleepData.reduce((acc, data) => acc + (data.sleepEfficiency || 0), 0) / employee.sleepData.length,
          avgHeartRate: employee.sleepData.reduce((acc, data) => acc + (data.heartRate || 0), 0) / employee.sleepData.length,
          totalDays: employee.sleepData.length
        }
      },
      insurance: {
        policy: employee.policy ? {
          policyNumber: employee.policy.policyNumber,
          type: employee.policy.type,
          status: employee.policy.status,
          planName: employee.policy.planName,
          coverageDetails: employee.policy.coverageDetails,
          startDate: employee.policy.startDate,
          endDate: employee.policy.endDate
        } : null,
        claims: employee.claims.map(c => ({
          provider: c.provider,
          claimAmount: c.claimAmount,
          status: c.status,
          date: c.date,
          department: c.department,
          claimedAmount: c.claimedAmount
        }))
      },
      scores: {
        insuranceScore: employee.insurance_score,
        smokerScore: employee.smoker_score,
        familyScore: employee.family_score,
        lifestyleScore: employee.lifestyle_score,
        bmiScore: employee.bmi_score,
        hemoglobinScore: employee.hemoglobin_score,
        sugarScore: employee.sugar_score,
        cholesterolScore: employee.cholesterol_score,
        creatinineScore: employee.creatinine_score,
        physicalScore: employee.physical_score,
        wellnessScore: employee.wellness_score
      },
      predictions: employee.predictions.map(p => ({
        predictionType: p.predictionType,
        predictionValue: p.predictionValue,
        predictedAt: p.predictedAt
      })),
      complaints: employee.complaints.map(c => ({
        subject: c.subject,
        description: c.description,
        status: c.status,
        createdAt: c.createdAt
      }))
    }));
    res.json(employeeData);
  } catch (error) {
    console.error('Error in all-data endpoint:', error);
    res.status(500).json({ 
      message: 'Error fetching comprehensive employee data',
      error: error.message 
    });
  }
});

module.exports = router; 