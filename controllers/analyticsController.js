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
    
    // Get all related data
    const [employee, healthData, wearableData, sleepData, claims, policy] = await Promise.all([
      Employee.findOne({ _id: employeeId }),
      HealthData.find({ employeeId }),
      WearableData.find({ employeeId }),
      SleepData.find({ employeeId }),
      Claim.find({ employeeId }),
      Policy.findOne({ employeeId })
    ]);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate health metrics
    const latestHealth = healthData[0] || {};
    const bmi = latestHealth.weight && latestHealth.height ? 
      (latestHealth.weight / ((latestHealth.height / 100) ** 2)).toFixed(2) : null;

    // Calculate wearable metrics
    const wearableStats = wearableData.reduce((acc, data) => ({
      totalSteps: (acc.totalSteps || 0) + (data.steps || 0),
      totalCalories: (acc.totalCalories || 0) + (data.caloriesBurned || 0),
      avgHeartRate: ((acc.avgHeartRate || 0) + (data.heartRate || 0)) / (acc.count || 1),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate sleep metrics
    const sleepStats = sleepData.reduce((acc, data) => ({
      totalSleepHours: (acc.totalSleepHours || 0) + (data.sleepHours || 0),
      avgSleepQuality: ((acc.avgSleepQuality || 0) + (data.sleepQuality || 0)) / (acc.count || 1),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate health risk
    const healthRisk = calculateHealthRisk(latestHealth, wearableData[0]);

    res.json({
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        joinDate: employee.joinDate
      },
      health: {
        latest: {
          weight: latestHealth.weight,
          height: latestHealth.height,
          bmi: bmi,
          bloodPressure: latestHealth.bloodPressure,
          cholesterol: latestHealth.cholesterol,
          bloodSugar: latestHealth.bloodSugar,
          lastUpdated: latestHealth.updatedAt
        },
        riskScore: healthRisk
      },
      wearable: {
        summary: {
          totalSteps: wearableStats.totalSteps,
          totalCalories: wearableStats.totalCalories,
          avgHeartRate: wearableStats.avgHeartRate ? wearableStats.avgHeartRate.toFixed(2) : null,
          lastUpdated: wearableData[0]?.date
        }
      },
      sleep: {
        summary: {
          totalSleepHours: sleepStats.totalSleepHours,
          avgSleepQuality: sleepStats.avgSleepQuality ? sleepStats.avgSleepQuality.toFixed(2) : null,
          lastUpdated: sleepData[0]?.date
        }
      },
      insurance: {
        policy: policy ? {
          policyNumber: policy.policyNumber,
          coverageType: policy.coverageType,
          startDate: policy.startDate,
          endDate: policy.endDate
        } : null,
        claims: claims.map(c => ({
          claimId: c._id,
          date: c.date,
          type: c.type,
          amount: c.amount,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('Error in employee analytics:', error);
    res.status(500).json({ 
      message: 'Error fetching comprehensive employee data',
      error: error.message 
    });
  }
});

// Get organization-wide analytics
router.get('/organization', async (req, res) => {
  try {
    // Get all employees
    const employees = await Employee.find();
    
    // Get all related data
    const [healthData, wearableData, sleepData, claims, policies] = await Promise.all([
      HealthData.find(),
      WearableData.find(),
      SleepData.find(),
      Claim.find(),
      Policy.find()
    ]);

    // Calculate organization averages
    const avgBMI = healthData.reduce((sum, h) => sum + (h.bmi || 0), 0) / healthData.length;
    const avgSteps = wearableData.reduce((sum, w) => sum + (w.steps || 0), 0) / wearableData.length;
    const avgSleep = sleepData.reduce((sum, s) => sum + (s.sleepHours || 0), 0) / sleepData.length;
    const avgHeartRate = wearableData.reduce((sum, w) => sum + (w.heartRate || 0), 0) / wearableData.length;

    // Calculate health distribution
    const bmiDistribution = {
      underweight: healthData.filter(h => h.bmi < 18.5).length,
      normal: healthData.filter(h => h.bmi >= 18.5 && h.bmi < 25).length,
      overweight: healthData.filter(h => h.bmi >= 25 && h.bmi < 30).length,
      obese: healthData.filter(h => h.bmi >= 30).length
    };

    // Calculate activity levels
    const activityLevels = {
      sedentary: wearableData.filter(w => w.steps < 5000).length,
      moderate: wearableData.filter(w => w.steps >= 5000 && w.steps < 10000).length,
      active: wearableData.filter(w => w.steps >= 10000).length
    };

    // Calculate sleep quality
    const sleepQuality = {
      insufficient: sleepData.filter(s => s.sleepHours < 6).length,
      adequate: sleepData.filter(s => s.sleepHours >= 6 && s.sleepHours < 8).length,
      optimal: sleepData.filter(s => s.sleepHours >= 8).length
    };

    // Calculate claim statistics
    const claimStats = {
      total: claims.length,
      approved: claims.filter(c => c.status === 'Approved').length,
      pending: claims.filter(c => c.status === 'Submitted').length,
      rejected: claims.filter(c => c.status === 'Rejected').length,
      totalAmount: claims.reduce((sum, c) => sum + (c.amount || 0), 0),
      averageAmount: claims.reduce((sum, c) => sum + (c.amount || 0), 0) / claims.length
    };

    res.json({
      overview: {
        totalEmployees: employees.length,
        averageAge: employees.reduce((sum, e) => sum + (e.age || 0), 0) / employees.length,
        genderDistribution: {
          male: employees.filter(e => e.gender === 'Male').length,
          female: employees.filter(e => e.gender === 'Female').length
        }
      },
      healthMetrics: {
        averageBMI: avgBMI,
        bmiDistribution,
        averageSteps: avgSteps,
        averageSleep: avgSleep,
        averageHeartRate: avgHeartRate
      },
      activityAnalysis: {
        activityLevels,
        sedentaryPercentage: (activityLevels.sedentary / wearableData.length) * 100,
        activePercentage: (activityLevels.active / wearableData.length) * 100
      },
      sleepAnalysis: {
        sleepQuality,
        insufficientSleepPercentage: (sleepQuality.insufficient / sleepData.length) * 100,
        optimalSleepPercentage: (sleepQuality.optimal / sleepData.length) * 100
      },
      claimsAnalysis: {
        ...claimStats,
        approvalRate: (claimStats.approved / claimStats.total) * 100,
        averageClaimPerEmployee: claimStats.total / employees.length
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
    // Get all employees with all needed fields
    const employees = await Employee.find().select('_id id name email role department joinDate age ageGroup gender children smoker');
    
    // Get all related data
    const [healthData, wearableData, sleepData, claims, policies, predictions, complaints] = await Promise.all([
      HealthData.find().lean(),
      WearableData.find().lean(),
      SleepData.find().lean(),
      Claim.find().lean(),
      Policy.find().lean(),
      Prediction.find().lean(),
      ComplaintTicket.find().lean()
    ]);

    // Create lookup maps for faster access
    const healthMap = new Map();
    const wearableMap = new Map();
    const sleepMap = new Map();
    const claimsMap = new Map();
    const policyMap = new Map();
    const predictionMap = new Map();
    const complaintMap = new Map();

    // Populate maps - check for both employee and employeeId fields
    healthData.forEach(h => {
      const key = (h.employee || h.employeeId)?.toString();
      if (key && !healthMap.has(key)) healthMap.set(key, []);
      if (key) healthMap.get(key).push(h);
    });

    wearableData.forEach(w => {
      const key = (w.employee || w.employeeId)?.toString();
      if (key && !wearableMap.has(key)) wearableMap.set(key, []);
      if (key) wearableMap.get(key).push(w);
    });

    sleepData.forEach(s => {
      const key = (s.employee || s.employeeId)?.toString();
      if (key && !sleepMap.has(key)) sleepMap.set(key, []);
      if (key) sleepMap.get(key).push(s);
    });

    claims.forEach(c => {
      const key = c.employeeId?.toString();
      if (key && !claimsMap.has(key)) claimsMap.set(key, []);
      if (key) claimsMap.get(key).push(c);
    });

    policies.forEach(p => {
      const key = p.employeeId?.toString();
      if (key) policyMap.set(key, p);
    });
    
    predictions.forEach(p => {
      const key = (p.employee || p.employeeId)?.toString();
      if (key && !predictionMap.has(key)) predictionMap.set(key, []);
      if (key) predictionMap.get(key).push(p);
    });
    
    complaints.forEach(c => {
      const key = c.employeeId?.toString();
      if (key && !complaintMap.has(key)) complaintMap.set(key, []);
      if (key) complaintMap.get(key).push(c);
    });

    // Organize data by employee
    const employeeData = employees.map(employee => {
      // Try both _id and id for lookup
      const employeeIdStr = employee._id?.toString();
      const idStr = employee.id?.toString();
      
      // Get data using both IDs to ensure we find matches
      const employeeHealth = healthMap.get(employeeIdStr) || healthMap.get(idStr) || [];
      const employeeWearable = wearableMap.get(employeeIdStr) || wearableMap.get(idStr) || [];
      const employeeSleep = sleepMap.get(employeeIdStr) || sleepMap.get(idStr) || [];
      const employeeClaims = claimsMap.get(employeeIdStr) || claimsMap.get(idStr) || [];
      const employeePolicy = policyMap.get(employeeIdStr) || policyMap.get(idStr);
      const employeePredictions = predictionMap.get(employeeIdStr) || predictionMap.get(idStr) || [];
      const employeeComplaints = complaintMap.get(employeeIdStr) || complaintMap.get(idStr) || [];

      // Calculate BMI if we have weight and height
      const latestHealth = employeeHealth[0] || {};
      const bmi = latestHealth.weight && latestHealth.height ? 
        (latestHealth.weight / ((latestHealth.height / 100) ** 2)).toFixed(2) : null;

      // Calculate wearable stats
      const wearableStats = employeeWearable.reduce((acc, data) => ({
        totalSteps: (acc.totalSteps || 0) + (data.stepCount || 0),
        totalActiveEnergy: (acc.totalActiveEnergy || 0) + (data.activeEnergy || 0),
        totalExerciseTime: (acc.totalExerciseTime || 0) + (data.exerciseTime || 0),
        avgHeartRate: ((acc.avgHeartRate || 0) + (data.heartRate || 0)) / (acc.count || 1),
        avgHRV: ((acc.avgHRV || 0) + (data.heartRateVariability || 0)) / (acc.count || 1),
        totalWalkingDistance: (acc.totalWalkingDistance || 0) + (data.walkingDistance || 0),
        count: (acc.count || 0) + 1
      }), {});

      // Calculate sleep stats
      const sleepStats = employeeSleep.reduce((acc, data) => ({
        totalSleepHours: (acc.totalSleepHours || 0) + (data.sleepDuration || 0),
        avgSleepEfficiency: ((acc.avgSleepEfficiency || 0) + (data.sleepEfficiency || 0)) / (acc.count || 1),
        avgDeepSleep: ((acc.avgDeepSleep || 0) + ((data.sleepStages?.deep) || 0)) / (acc.count || 1),
        avgLightSleep: ((acc.avgLightSleep || 0) + ((data.sleepStages?.light) || 0)) / (acc.count || 1),
        avgRemSleep: ((acc.avgRemSleep || 0) + ((data.sleepStages?.rem) || 0)) / (acc.count || 1),
        avgAwakeSleep: ((acc.avgAwakeSleep || 0) + ((data.sleepStages?.awake) || 0)) / (acc.count || 1),
        count: (acc.count || 0) + 1
      }), {});

      return {
        employee: {
          _id: employee._id,
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          joinDate: employee.joinDate,
          age: employee.age,
          ageGroup: employee.ageGroup,
          gender: employee.gender,
          children: employee.children,
          smoker: employee.smoker
        },
        health: {
          latest: latestHealth ? {
            weight: latestHealth.weight,
            height: latestHealth.height,
            bmi: bmi,
            bloodPressure: latestHealth.bloodPressure,
            cholesterol: latestHealth.cholesterol,
            bloodSugar: latestHealth.bloodSugar,
            recordDate: latestHealth.recordDate
          } : {},
          history: employeeHealth.map(h => ({
            weight: h.weight,
            height: h.height,
            bmi: h.bmi,
            bloodPressure: h.bloodPressure,
            cholesterol: h.cholesterol,
            bloodSugar: h.bloodSugar,
            recordDate: h.recordDate
          }))
        },
        wearable: {
          latest: employeeWearable[0] ? {
            stepCount: employeeWearable[0].stepCount,
            heartRate: employeeWearable[0].heartRate,
            sleepHours: employeeWearable[0].sleepHours,
            activeEnergy: employeeWearable[0].activeEnergy,
            exerciseTime: employeeWearable[0].exerciseTime,
            heartRateVariability: employeeWearable[0].heartRateVariability,
            timeInBed: employeeWearable[0].timeInBed,
            walkingDistance: employeeWearable[0].walkingDistance,
            recordDate: employeeWearable[0].recordDate
          } : {},
          history: employeeWearable.map(w => ({
            stepCount: w.stepCount,
            heartRate: w.heartRate,
            sleepHours: w.sleepHours,
            activeEnergy: w.activeEnergy,
            exerciseTime: w.exerciseTime,
            heartRateVariability: w.heartRateVariability,
            timeInBed: w.timeInBed,
            walkingDistance: w.walkingDistance,
            recordDate: w.recordDate
          })),
          stats: {
            totalSteps: wearableStats.totalSteps,
            avgHeartRate: wearableStats.avgHeartRate ? wearableStats.avgHeartRate.toFixed(2) : null,
            avgHRV: wearableStats.avgHRV ? wearableStats.avgHRV.toFixed(2) : null,
            totalActiveEnergy: wearableStats.totalActiveEnergy,
            totalExerciseTime: wearableStats.totalExerciseTime,
            totalWalkingDistance: wearableStats.totalWalkingDistance,
            totalDays: wearableStats.count
          }
        },
        sleep: {
          latest: employeeSleep[0] ? {
            sleepDuration: employeeSleep[0].sleepDuration,
            sleepEfficiency: employeeSleep[0].sleepEfficiency,
            sleepStages: employeeSleep[0].sleepStages,
            heartRate: employeeSleep[0].heartRate,
            date: employeeSleep[0].date,
            version: employeeSleep[0].version
          } : {},
          history: employeeSleep.map(s => ({
            sleepDuration: s.sleepDuration,
            sleepEfficiency: s.sleepEfficiency,
            sleepStages: s.sleepStages,
            heartRate: s.heartRate,
            date: s.date,
            version: s.version
          })),
          stats: {
            totalSleepHours: sleepStats.totalSleepHours,
            avgSleepEfficiency: sleepStats.avgSleepEfficiency ? sleepStats.avgSleepEfficiency.toFixed(2) : null,
            avgDeepSleep: sleepStats.avgDeepSleep ? sleepStats.avgDeepSleep.toFixed(2) : null,
            avgLightSleep: sleepStats.avgLightSleep ? sleepStats.avgLightSleep.toFixed(2) : null,
            avgRemSleep: sleepStats.avgRemSleep ? sleepStats.avgRemSleep.toFixed(2) : null,
            avgAwakeSleep: sleepStats.avgAwakeSleep ? sleepStats.avgAwakeSleep.toFixed(2) : null,
            totalDays: sleepStats.count
          }
        },
        insurance: {
          policy: employeePolicy ? {
            policyNumber: employeePolicy.policyNumber,
            type: employeePolicy.type,
            status: employeePolicy.status
          } : null,
          claims: employeeClaims.map(c => ({
            provider: c.provider,
            claimAmount: c.claimAmount,
            status: c.status,
            date: c.date
          }))
        },
        predictions: employeePredictions.map(p => ({
          predictionType: p.predictionType,
          predictionValue: p.predictionValue,
          predictedAt: p.predictedAt
        })),
        complaints: employeeComplaints.map(c => ({
          subject: c.subject,
          description: c.description,
          status: c.status,
          createdAt: c.createdAt
        }))
      };
    });

    res.json({
      totalEmployees: employeeData.length,
      employees: employeeData.slice(0, 10) // Return only first 10 for faster response
    });
  } catch (error) {
    console.error('Error in all-data endpoint:', error);
    res.status(500).json({ 
      message: 'Error fetching comprehensive employee data',
      error: error.message 
    });
  }
});

module.exports = router; 