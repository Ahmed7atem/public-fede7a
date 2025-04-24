const express = require('express');
const router = express.Router();
const { Employee, HealthData, WearableData, SleepData, Claim } = require('../models/schemas');

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
  if (healthData.bmi) {
    if (healthData.bmi < 18.5 || healthData.bmi >= 30) riskScore += 2;
    else if (healthData.bmi >= 25) riskScore += 1;
  }
  
  // Blood pressure risk
  if (healthData.bloodPressure) {
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
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const healthData = await HealthData.find({ employee: employee.id }).sort({ recordDate: -1 });
    const wearableData = await WearableData.find({ employee: employee.id }).sort({ recordDate: -1 });
    const sleepData = await SleepData.find({ employee: employee.id }).sort({ date: -1 });
    const claims = await Claim.find({ employeeId: employee.id });

    // Calculate trends
    const bmiTrend = healthData.map(h => ({ date: h.recordDate, value: h.bmi }));
    const stepTrend = wearableData.map(w => ({ date: w.recordDate, value: w.stepCount }));
    const sleepTrend = sleepData.map(s => ({ date: s.date, value: s.sleepDuration }));

    // Calculate averages
    const avgSteps = wearableData.reduce((sum, w) => sum + w.stepCount, 0) / wearableData.length;
    const avgSleep = sleepData.reduce((sum, s) => sum + s.sleepDuration, 0) / sleepData.length;
    const avgHeartRate = wearableData.reduce((sum, w) => sum + w.heartRate, 0) / wearableData.length;

    // Get latest health data
    const latestHealth = healthData[0];
    const latestWearable = wearableData[0];
    const latestSleep = sleepData[0];

    // Calculate risk score
    const riskScore = calculateHealthRisk(latestHealth, latestWearable);

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        age: employee.age,
        gender: employee.gender
      },
      healthMetrics: {
        currentBMI: latestHealth?.bmi,
        bmiCategory: latestHealth?.bmi ? getBMICategory(latestHealth.bmi) : null,
        bloodPressure: latestHealth?.bloodPressure,
        hemoglobin: latestHealth?.hemoglobin,
        cholesterol: latestHealth?.cholesterol,
        bloodSugar: latestHealth?.bloodSugar,
        creatinine: latestHealth?.creatinine
      },
      activityMetrics: {
        averageSteps: avgSteps,
        averageSleep: avgSleep,
        averageHeartRate: avgHeartRate,
        currentSteps: latestWearable?.stepCount,
        currentHeartRate: latestWearable?.heartRate,
        currentSleep: latestSleep?.sleepDuration
      },
      trends: {
        bmi: bmiTrend,
        steps: stepTrend,
        sleep: sleepTrend
      },
      riskAssessment: {
        score: riskScore,
        level: riskScore < 2 ? 'Low' : riskScore < 4 ? 'Medium' : 'High',
        factors: [
          ...(latestHealth?.bmi && (latestHealth.bmi < 18.5 || latestHealth.bmi >= 25) ? ['BMI'] : []),
          ...(latestHealth?.bloodPressure ? ['Blood Pressure'] : []),
          ...(latestWearable?.stepCount < 5000 ? ['Low Activity'] : []),
          ...(latestWearable?.heartRate > 100 ? ['Elevated Heart Rate'] : []),
          ...(latestSleep?.sleepDuration < 6 ? ['Insufficient Sleep'] : [])
        ]
      },
      claims: {
        total: claims.length,
        approved: claims.filter(c => c.status === 'Approved').length,
        pending: claims.filter(c => c.status === 'Submitted').length,
        totalAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get organization-wide health analytics
router.get('/organization', async (req, res) => {
  try {
    const employees = await Employee.find();
    const healthData = await HealthData.find();
    const wearableData = await WearableData.find();
    const sleepData = await SleepData.find();
    const claims = await Claim.find();

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

module.exports = router; 