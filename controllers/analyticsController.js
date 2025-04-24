const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Claim, Policy, Provider, Complaint } = require('../models/schemas');

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
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
      Employee.findById(employeeId),
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
    const employees = await Employee.find();
    const healthData = await HealthData.find();
    const wearableData = await WearableData.find();
    const sleepData = await SleepData.find();
    const claims = await Claim.find();
    const policies = await Policy.find();
    const providers = await Provider.find();
    const complaints = await Complaint.find();

    // Calculate organization averages
    const avgBMI = healthData.reduce((sum, h) => sum + (h.bmi || 0), 0) / healthData.length;
    const avgSteps = wearableData.reduce((sum, w) => sum + w.stepCount, 0) / wearableData.length;
    const avgSleep = sleepData.reduce((sum, s) => sum + s.sleepDuration, 0) / sleepData.length;
    const avgHeartRate = wearableData.reduce((sum, w) => sum + w.heartRate, 0) / wearableData.length;

    // Calculate health distribution
    const bmiDistribution = {
      underweight: healthData.filter(h => h.bmi < 18.5).length,
      normal: healthData.filter(h => h.bmi >= 18.5 && h.bmi < 25).length,
      overweight: healthData.filter(h => h.bmi >= 25 && h.bmi < 30).length,
      obese: healthData.filter(h => h.bmi >= 30).length
    };

    // Calculate activity levels
    const activityLevels = {
      sedentary: wearableData.filter(w => w.stepCount < 5000).length,
      moderate: wearableData.filter(w => w.stepCount >= 5000 && w.stepCount < 10000).length,
      active: wearableData.filter(w => w.stepCount >= 10000).length
    };

    // Calculate sleep quality
    const sleepQuality = {
      insufficient: sleepData.filter(s => s.sleepDuration < 6).length,
      adequate: sleepData.filter(s => s.sleepDuration >= 6 && s.sleepDuration < 8).length,
      optimal: sleepData.filter(s => s.sleepDuration >= 8).length
    };

    // Calculate claim statistics
    const claimStats = {
      total: claims.length,
      approved: claims.filter(c => c.status === 'Approved').length,
      pending: claims.filter(c => c.status === 'Submitted').length,
      rejected: claims.filter(c => c.status === 'Rejected').length,
      totalAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0),
      averageAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0) / claims.length
    };

    // Calculate provider statistics
    const providerStats = {
      total: providers.length,
      bySpecialty: providers.reduce((acc, p) => {
        acc[p.specialty] = (acc[p.specialty] || 0) + 1;
        return acc;
      }, {})
    };

    // Calculate complaint statistics
    const complaintStats = {
      total: complaints.length,
      byStatus: complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      byCategory: complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {})
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
      },
      providerAnalysis: {
        ...providerStats,
        averageClaimsPerProvider: claimStats.total / providers.length
      },
      complaintAnalysis: {
        ...complaintStats,
        resolutionRate: (complaintStats.byStatus['Resolved'] / complaintStats.total) * 100
      },
      riskFactors: {
        highBMI: bmiDistribution.overweight + bmiDistribution.obese,
        lowActivity: activityLevels.sedentary,
        poorSleep: sleepQuality.insufficient,
        totalAtRisk: (bmiDistribution.overweight + bmiDistribution.obese + 
                      activityLevels.sedentary + sleepQuality.insufficient)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Organize data by employee
    const employeeData = employees.map(employee => {
      const employeeHealth = healthData.filter(h => h.employeeId.toString() === employee._id.toString());
      const employeeWearable = wearableData.filter(w => w.employeeId.toString() === employee._id.toString());
      const employeeSleep = sleepData.filter(s => s.employeeId.toString() === employee._id.toString());
      const employeeClaims = claims.filter(c => c.employeeId.toString() === employee._id.toString());

      // Calculate health metrics
      const latestHealth = employeeHealth[0] || {};
      const bmi = latestHealth.weight && latestHealth.height ? 
        (latestHealth.weight / ((latestHealth.height / 100) ** 2)).toFixed(2) : null;

      // Calculate wearable metrics
      const wearableStats = employeeWearable.reduce((acc, data) => ({
        totalSteps: (acc.totalSteps || 0) + (data.steps || 0),
        totalCalories: (acc.totalCalories || 0) + (data.caloriesBurned || 0),
        avgHeartRate: ((acc.avgHeartRate || 0) + (data.heartRate || 0)) / (acc.count || 1),
        count: (acc.count || 0) + 1
      }), {});

      // Calculate sleep metrics
      const sleepStats = employeeSleep.reduce((acc, data) => ({
        totalSleepHours: (acc.totalSleepHours || 0) + (data.sleepHours || 0),
        avgSleepQuality: ((acc.avgSleepQuality || 0) + (data.sleepQuality || 0)) / (acc.count || 1),
        count: (acc.count || 0) + 1
      }), {});

      // Get policy information
      const employeePolicy = policies.find(p => p.employeeId.toString() === employee._id.toString());

      return {
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
          history: employeeHealth.map(h => ({
            date: h.date,
            weight: h.weight,
            height: h.height,
            bloodPressure: h.bloodPressure,
            cholesterol: h.cholesterol,
            bloodSugar: h.bloodSugar
          }))
        },
        wearable: {
          summary: {
            totalSteps: wearableStats.totalSteps,
            totalCalories: wearableStats.totalCalories,
            avgHeartRate: wearableStats.avgHeartRate ? wearableStats.avgHeartRate.toFixed(2) : null,
            lastUpdated: employeeWearable[0]?.date
          },
          history: employeeWearable.map(w => ({
            date: w.date,
            steps: w.steps,
            heartRate: w.heartRate,
            caloriesBurned: w.caloriesBurned
          }))
        },
        sleep: {
          summary: {
            totalSleepHours: sleepStats.totalSleepHours,
            avgSleepQuality: sleepStats.avgSleepQuality ? sleepStats.avgSleepQuality.toFixed(2) : null,
            lastUpdated: employeeSleep[0]?.date
          },
          history: employeeSleep.map(s => ({
            date: s.date,
            sleepHours: s.sleepHours,
            sleepQuality: s.sleepQuality,
            sleepStart: s.sleepStart,
            sleepEnd: s.sleepEnd
          }))
        },
        insurance: {
          policy: employeePolicy ? {
            policyNumber: employeePolicy.policyNumber,
            coverageType: employeePolicy.coverageType,
            startDate: employeePolicy.startDate,
            endDate: employeePolicy.endDate
          } : null,
          claims: employeeClaims.map(c => ({
            claimId: c._id,
            date: c.date,
            type: c.type,
            amount: c.amount,
            status: c.status
          }))
        }
      };
    });

    res.json({
      totalEmployees: employeeData.length,
      employees: employeeData
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