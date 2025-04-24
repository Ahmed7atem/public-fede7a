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
      HealthData.find({ employeeId }).sort({ recordDate: -1 }),
      WearableData.find({ employeeId }).sort({ recordDate: -1 }),
      SleepData.find({ employeeId }).sort({ date: -1 }),
      Claim.find({ employeeId }).sort({ date: -1 }),
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
      totalSteps: (acc.totalSteps || 0) + (data.stepCount || 0),
      totalActiveEnergy: (acc.totalActiveEnergy || 0) + (data.activeEnergy || 0),
      totalExerciseTime: (acc.totalExerciseTime || 0) + (data.exerciseTime || 0),
      avgHeartRate: ((acc.avgHeartRate || 0) + (data.heartRate || 0)) / (acc.count || 1),
      avgHRV: ((acc.avgHRV || 0) + (data.heartRateVariability || 0)) / (acc.count || 1),
      totalWalkingDistance: (acc.totalWalkingDistance || 0) + (data.walkingDistance || 0),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate sleep metrics
    const sleepStats = sleepData.reduce((acc, data) => ({
      totalSleepHours: (acc.totalSleepHours || 0) + (data.sleepDuration || 0),
      avgSleepEfficiency: ((acc.avgSleepEfficiency || 0) + (data.sleepEfficiency || 0)) / (acc.count || 1),
      avgDeepSleep: ((acc.avgDeepSleep || 0) + ((data.sleepStages?.deep) || 0)) / (acc.count || 1),
      avgLightSleep: ((acc.avgLightSleep || 0) + ((data.sleepStages?.light) || 0)) / (acc.count || 1),
      avgRemSleep: ((acc.avgRemSleep || 0) + ((data.sleepStages?.rem) || 0)) / (acc.count || 1),
      avgAwakeSleep: ((acc.avgAwakeSleep || 0) + ((data.sleepStages?.awake) || 0)) / (acc.count || 1),
      count: (acc.count || 0) + 1
    }), {});

    // Calculate health risk
    const healthRisk = calculateHealthRisk(latestHealth, wearableData[0]);

    res.json({
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
        smoker: employee.smoker,
        education: employee.education,
        recruitment_channel: employee.recruitment_channel,
        no_of_trainings: employee.no_of_trainings,
        previous_year_rating: employee.previous_year_rating,
        length_of_service: employee.length_of_service,
        kpis_met_80: employee.kpis_met_80,
        avg_training_score: employee.avg_training_score
      },
      health: {
        latest: {
          weight: latestHealth.weight,
          height: latestHealth.height,
          bmi: bmi,
          bmiCategory: bmi ? getBMICategory(bmi) : null,
          bloodPressure: latestHealth.bloodPressure,
          cholesterol: latestHealth.cholesterol,
          bloodSugar: latestHealth.bloodSugar,
          hemoglobin: latestHealth.hemoglobin,
          creatinine: latestHealth.creatinine,
          chronic_disease: latestHealth.chronic_disease,
          chronic_diseases_count: latestHealth.chronic_diseases_count,
          family_medical_history: latestHealth.family_medical_history,
          lastUpdated: latestHealth.recordDate || latestHealth.updatedAt
        },
        history: healthData.map(h => ({
          weight: h.weight,
          height: h.height,
          bmi: h.bmi,
          bloodPressure: h.bloodPressure,
          cholesterol: h.cholesterol,
          bloodSugar: h.bloodSugar,
          hemoglobin: h.hemoglobin,
          creatinine: h.creatinine,
          chronic_disease: h.chronic_disease,
          chronic_diseases_count: h.chronic_diseases_count,
          family_medical_history: h.family_medical_history,
          recordDate: h.recordDate
        })),
        riskScore: healthRisk
      },
      wearable: {
        latest: wearableData[0] ? {
          stepCount: wearableData[0].stepCount,
          heartRate: wearableData[0].heartRate,
          sleepHours: wearableData[0].sleepHours,
          activeEnergy: wearableData[0].activeEnergy,
          exerciseTime: wearableData[0].exerciseTime,
          heartRateVariability: wearableData[0].heartRateVariability,
          timeInBed: wearableData[0].timeInBed,
          walkingDistance: wearableData[0].walkingDistance,
          recordDate: wearableData[0].recordDate
        } : null,
        summary: {
          totalSteps: wearableStats.totalSteps,
          totalActiveEnergy: wearableStats.totalActiveEnergy,
          totalExerciseTime: wearableStats.totalExerciseTime,
          avgHeartRate: wearableStats.avgHeartRate ? wearableStats.avgHeartRate.toFixed(2) : null,
          avgHRV: wearableStats.avgHRV ? wearableStats.avgHRV.toFixed(2) : null,
          totalWalkingDistance: wearableStats.totalWalkingDistance,
          lastUpdated: wearableData[0]?.recordDate || wearableData[0]?.date
        }
      },
      sleep: {
        latest: sleepData[0] ? {
          sleepDuration: sleepData[0].sleepDuration,
          sleepEfficiency: sleepData[0].sleepEfficiency,
          sleepStages: sleepData[0].sleepStages,
          heartRate: sleepData[0].heartRate,
          date: sleepData[0].date
        } : null,
        summary: {
          totalSleepHours: sleepStats.totalSleepHours,
          avgSleepEfficiency: sleepStats.avgSleepEfficiency ? sleepStats.avgSleepEfficiency.toFixed(2) : null,
          avgDeepSleep: sleepStats.avgDeepSleep ? sleepStats.avgDeepSleep.toFixed(2) : null,
          avgLightSleep: sleepStats.avgLightSleep ? sleepStats.avgLightSleep.toFixed(2) : null,
          avgRemSleep: sleepStats.avgRemSleep ? sleepStats.avgRemSleep.toFixed(2) : null,
          avgAwakeSleep: sleepStats.avgAwakeSleep ? sleepStats.avgAwakeSleep.toFixed(2) : null,
          lastUpdated: sleepData[0]?.date
        }
      },
      insurance: {
        policy: policy ? {
          policyNumber: policy.policyNumber,
          type: policy.type,
          status: policy.status,
          planName: policy.planName,
          coverageDetails: policy.coverageDetails,
          startDate: policy.startDate,
          endDate: policy.endDate
        } : null,
        claims: claims.map(c => ({
          claimId: c._id,
          provider: c.provider,
          claimAmount: c.claimAmount,
          claimedAmount: c.claimedAmount,
          department: c.department,
          date: c.date,
          status: c.status
        }))
      },
      scores: {
        insurance_score: latestHealth.insurance_score,
        smoker_score: latestHealth.smoker_score,
        family_score: latestHealth.family_score,
        lifestyle_score: latestHealth.lifestyle_score,
        bmi_score: latestHealth.bmi_score,
        hemoglobin_score: latestHealth.hemoglobin_score,
        sugar_score: latestHealth.sugar_score,
        cholesterol_score: latestHealth.cholesterol_score,
        creatinine_score: latestHealth.creatinine_score,
        physical_score: latestHealth.physical_score,
        wellness_score: latestHealth.wellness_score
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
    // Get all employees with all needed fields
    const employees = await Employee.find().select('_id id name email role department joinDate age ageGroup gender children smoker education recruitment_channel no_of_trainings previous_year_rating length_of_service kpis_met_80 avg_training_score');
    
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
          smoker: employee.smoker,
          education: employee.education,
          recruitment_channel: employee.recruitment_channel,
          no_of_trainings: employee.no_of_trainings,
          previous_year_rating: employee.previous_year_rating,
          length_of_service: employee.length_of_service,
          kpis_met_80: employee.kpis_met_80,
          avg_training_score: employee.avg_training_score
        },
        health: {
          latest: latestHealth ? {
            weight: latestHealth.weight,
            height: latestHealth.height,
            bmi: bmi,
            bloodPressure: latestHealth.bloodPressure,
            cholesterol: latestHealth.cholesterol,
            bloodSugar: latestHealth.bloodSugar,
            hemoglobin: latestHealth.hemoglobin,
            creatinine: latestHealth.creatinine,
            chronic_disease: latestHealth.chronic_disease,
            chronic_diseases_count: latestHealth.chronic_diseases_count,
            family_medical_history: latestHealth.family_medical_history,
            recordDate: latestHealth.recordDate
          } : {},
          history: employeeHealth.map(h => ({
            weight: h.weight,
            height: h.height,
            bmi: h.bmi,
            bloodPressure: h.bloodPressure,
            cholesterol: h.cholesterol,
            bloodSugar: h.bloodSugar,
            hemoglobin: h.hemoglobin,
            creatinine: h.creatinine,
            chronic_disease: h.chronic_disease,
            chronic_diseases_count: h.chronic_diseases_count,
            family_medical_history: h.family_medical_history,
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
            status: employeePolicy.status,
            planName: employeePolicy.planName,
            coverageDetails: employeePolicy.coverageDetails,
            startDate: employeePolicy.startDate,
            endDate: employeePolicy.endDate
          } : null,
          claims: employeeClaims.map(c => ({
            provider: c.provider,
            claimAmount: c.claimAmount,
            status: c.status,
            date: c.date,
            department: c.department,
            claimedAmount: c.claimedAmount
          }))
        },
        scores: {
          insurance_score: latestHealth?.insurance_score,
          smoker_score: latestHealth?.smoker_score,
          family_score: latestHealth?.family_score,
          lifestyle_score: latestHealth?.lifestyle_score,
          bmi_score: latestHealth?.bmi_score,
          hemoglobin_score: latestHealth?.hemoglobin_score,
          sugar_score: latestHealth?.sugar_score,
          cholesterol_score: latestHealth?.cholesterol_score,
          creatinine_score: latestHealth?.creatinine_score,
          physical_score: latestHealth?.physical_score,
          wellness_score: latestHealth?.wellness_score
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