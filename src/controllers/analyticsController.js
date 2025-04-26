const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Claim, Prediction } = require('../models');

// Helper function to calculate BMI category
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * @desc    Get employee analytics
 * @route   GET /api/analytics/employee/:id
 * @access  Private/Admin
 */
const getEmployeeAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ employeeId: id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const healthData = await HealthData.find({ employee: id });
    const wearableData = await WearableData.find({ employee: id });
    const sleepData = await SleepData.find({ employee: id });
    const claims = await Claim.find({ employeeId: id });
    const predictions = await Prediction.find({ employee: id });

    res.json({
      employee: {
        employeeId: employee.employeeId,
        email: employee.email,
        Age: employee.Age,
        Gender: employee.Gender,
        Department: employee.Department,
        BMI: employee.BMI,
        Chronic_Disease: employee.Chronic_Disease,
        Insurance_Score: employee.Insurance_Score
      },
      health: healthData.length > 0 ? healthData[0] : null,
      wearable: wearableData.length > 0 ? wearableData[0] : null,
      sleep: sleepData.length > 0 ? sleepData[0] : null,
      claims: claims.map(claim => ({
        id: claim.id,
        providerId: claim.providerId,
        claimAmount: claim.claimAmount,
        claimDate: claim.claimDate,
        providerSpecialty: claim.providerSpecialty,
        claimStatus: claim.claimStatus,
        claimType: claim.claimType,
        claimSubmissionMethod: claim.claimSubmissionMethod,
        diagnosisDescription: claim.diagnosisDescription,
        procedureDescription: claim.procedureDescription
      })),
      predictions: predictions.length > 0 ? predictions[0] : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get organization analytics
 * @route   GET /api/analytics/organization
 * @access  Private/Admin
 */
const getOrganizationAnalytics = async (req, res) => {
  try {
    // Get all employees
    const employees = await Employee.find();
    const totalEmployees = employees.length;

    // Calculate gender distribution
    const genderDistribution = employees.reduce((acc, emp) => {
      const gender = emp.Gender || 'other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Calculate average age
    const totalAge = employees.reduce((sum, emp) => sum + (emp.Age || 0), 0);
    const averageAge = totalEmployees > 0 ? Math.round(totalAge / totalEmployees) : 0;

    // Get all health data
    const healthData = await HealthData.find();
    const bmiData = healthData.map(data => data.bmi || 0).filter(bmi => bmi > 0);
    const averageBMI = bmiData.length > 0 
      ? (bmiData.reduce((sum, bmi) => sum + bmi, 0) / bmiData.length).toFixed(2)
      : "0.00";

    // Calculate BMI distribution
    const bmiDistribution = {
      underweight: 0,
      normal: 0,
      overweight: 0,
      obese: 0
    };

    bmiData.forEach(bmi => {
      if (bmi < 18.5) bmiDistribution.underweight++;
      else if (bmi < 25) bmiDistribution.normal++;
      else if (bmi < 30) bmiDistribution.overweight++;
      else bmiDistribution.obese++;
    });

    // Get wearable data
    const wearableData = await WearableData.find();
    const stepsData = wearableData.map(data => data.stepCount || 0);
    const heartRateData = wearableData.map(data => data.heartRateAvg || 0);
    
    const averageSteps = stepsData.length > 0 
      ? Math.round(stepsData.reduce((sum, steps) => sum + steps, 0) / stepsData.length)
      : 0;
    
    const averageHeartRate = heartRateData.length > 0
      ? Math.round(heartRateData.reduce((sum, hr) => sum + hr, 0) / heartRateData.length)
      : 0;

    // Get sleep data
    const sleepData = await SleepData.find();
    const sleepQualityData = sleepData.map(data => data.sleepQuality || 0);
    const averageSleep = sleepQualityData.length > 0
      ? (sleepQualityData.reduce((sum, quality) => sum + quality, 0) / sleepQualityData.length).toFixed(1)
      : "0.0";

    // Calculate activity levels
    const activityLevels = {
      sedentary: 0,
      moderate: 0,
      active: 0
    };

    stepsData.forEach(steps => {
      if (steps < 5000) activityLevels.sedentary++;
      else if (steps < 10000) activityLevels.moderate++;
      else activityLevels.active++;
    });

    const totalActivity = activityLevels.sedentary + activityLevels.moderate + activityLevels.active;
    const sedentaryPercentage = totalActivity > 0 
      ? ((activityLevels.sedentary / totalActivity) * 100).toFixed(1)
      : "0.0";
    const activePercentage = totalActivity > 0
      ? (((activityLevels.moderate + activityLevels.active) / totalActivity) * 100).toFixed(1)
      : "0.0";

    // Calculate sleep quality distribution
    const sleepQuality = {
      insufficient: 0,
      adequate: 0,
      optimal: 0
    };

    sleepQualityData.forEach(quality => {
      if (quality < 50) sleepQuality.insufficient++;
      else if (quality < 80) sleepQuality.adequate++;
      else sleepQuality.optimal++;
    });

    const totalSleep = sleepQuality.insufficient + sleepQuality.adequate + sleepQuality.optimal;
    const insufficientSleepPercentage = totalSleep > 0
      ? ((sleepQuality.insufficient / totalSleep) * 100).toFixed(1)
      : "0.0";
    const optimalSleepPercentage = totalSleep > 0
      ? ((sleepQuality.optimal / totalSleep) * 100).toFixed(1)
      : "0.0";

    // Get claims data
    const claims = await Claim.find();
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(claim => claim.claimStatus === 'approved').length;
    const pendingClaims = claims.filter(claim => claim.claimStatus === 'pending').length;
    const rejectedClaims = claims.filter(claim => claim.claimStatus === 'rejected').length;
    
    const totalAmount = claims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0).toFixed(2);
    const averageAmount = totalClaims > 0 ? (totalAmount / totalClaims).toFixed(2) : "0.00";
    const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : "0.0";
    const averageClaimPerEmployee = totalEmployees > 0 ? (totalClaims / totalEmployees).toFixed(2) : "0.00";

    // Get predictions data
    const predictions = await Prediction.find();
    const totalPredictions = predictions.length;

    res.json({
      overview: {
        totalEmployees,
        averageAge,
        genderDistribution
      },
      healthMetrics: {
        averageBMI,
        bmiDistribution,
        averageSteps,
        averageSleep,
        averageHeartRate
      },
      activityAnalysis: {
        activityLevels,
        sedentaryPercentage,
        activePercentage
      },
      sleepAnalysis: {
        sleepQuality,
        insufficientSleepPercentage,
        optimalSleepPercentage
      },
      claimsAnalysis: {
        total: totalClaims,
        approved: approvedClaims,
        pending: pendingClaims,
        rejected: rejectedClaims,
        totalAmount,
        averageAmount,
        approvalRate,
        averageClaimPerEmployee
      },
      predictions: {
        total: totalPredictions
      }
    });
  } catch (error) {
    console.error('Error getting organization analytics:', error);
    res.status(500).json({ message: 'Error getting organization analytics', error: error.message });
  }
};

/**
 * @desc    Get health alerts
 * @route   GET /api/analytics/alerts
 * @access  Private/Admin
 */
const getHealthAlerts = async (req, res) => {
  try {
    const healthData = await HealthData.find({
      $or: [
        { bmi: { $gt: 30 } },
        { bloodSugar: { $gt: 140 } },
        { cholesterol: { $gt: 240 } },
        { hemoglobin: { $lt: 12 } }
      ]
    });

    const alerts = healthData.map(data => ({
      employee: data.employee,
      type: 'health',
      severity: 'high',
      details: data
    }));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get comprehensive data for all employees
 * @route   GET /api/analytics/all
 * @access  Private/Admin
 */
const getAllData = async (req, res) => {
  try {
    // Get all employees with their basic info
    const employees = await Employee.find()
      .select('_id email role employeeId Age Gender Weight_kg Height_cm BMI Chronic_Disease Policy_ID policyNumber Plan_Name BMI_Score Hemoglobin_Score Sugar_Score Cholesterol_Score Creatinine_Score Physical_Score Wellness_Score')
      .lean();

    const totalEmployees = employees.length;
    console.log(`Found ${totalEmployees} employees`);

    // Process each employee's data
    const employeeData = await Promise.all(employees.map(async (employee) => {
      try {
        const employeeId = employee.employeeId;
        console.log(`\nProcessing employee ${employeeId}`);

        // Get all related data
        const [healthData, wearableData, sleepData, claims, predictions] = await Promise.all([
          HealthData.find({ employee: employeeId }).sort({ recordedAt: -1 }).lean(),
          WearableData.find({ employee: employeeId }).sort({ date: -1 }).lean(),
          SleepData.find({ employee: employeeId }).sort({ startTime: -1 }).lean(),
          Claim.find({ employeeId: employeeId }).lean(),
          Prediction.find({ employee: employeeId }).lean()
        ]);

        // Calculate wearable stats
        const wearableStats = {
          avgHeartRate: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length).toFixed(2) 
            : null,
          avgHRV: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length).toFixed(2) 
            : null,
          avgSteps: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.stepCount || 0), 0) / wearableData.length).toFixed(0)
            : null,
          avgActiveEnergy: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.activeEnergy || 0), 0) / wearableData.length).toFixed(0)
            : null
        };

        // Calculate sleep stats
        const sleepStats = {
          avgSleepEfficiency: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length).toFixed(2) 
            : null,
          avgHeartRate: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length).toFixed(2) 
            : null,
          avgTimeInBed: sleepData.length > 0
            ? (sleepData.reduce((sum, data) => sum + (data.timeInBed || 0), 0) / sleepData.length).toFixed(0)
            : null
        };

        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role,
            age: employee.Age,
            gender: employee.Gender,
            weight: employee.Weight_kg,
            height: employee.Height_cm,
            bmi: employee.BMI,
            chronicDisease: employee.Chronic_Disease,
            insurance: {
              policyId: employee.Policy_ID,
              policyNumber: employee.policyNumber,
              planName: employee.Plan_Name
            }
          },
          health: {
            latest: healthData.length > 0 ? {
              bmi: healthData[0].bmi || null,
              hemoglobin: healthData[0].hemoglobin || null,
              cholesterol: healthData[0].cholesterol || null,
              bloodSugar: healthData[0].bloodSugar || null,
              creatinine: healthData[0].creatinine || null
            } : { bmi: null },
            history: healthData
          },
          wearable: {
            latest: wearableData.length > 0 ? {
              heartRateAvg: wearableData[0].heartRateAvg || null,
              heartRateVariability: wearableData[0].heartRateVariability || null,
              stepCount: wearableData[0].stepCount || null,
              activeEnergy: wearableData[0].activeEnergy || null,
              exerciseTime: wearableData[0].exerciseTime || null
            } : {},
            history: wearableData,
            stats: wearableStats
          },
          sleep: {
            latest: sleepData.length > 0 ? {
              sleepQuality: sleepData[0].sleepQuality || null,
              timeInBed: sleepData[0].timeInBed || null,
              heartRate: sleepData[0].heartRate || null,
              startTime: sleepData[0].startTime || null,
              endTime: sleepData[0].endTime || null
            } : {},
            history: sleepData,
            stats: sleepStats
          },
          insurance: {
            policy: employee.Policy_ID ? {
              id: employee.Policy_ID,
              number: employee.policyNumber,
              plan: employee.Plan_Name
            } : null,
            claims: claims.map(claim => ({
              id: claim.id,
              providerId: claim.providerId,
              claimAmount: claim.claimAmount,
              claimDate: claim.claimDate,
              providerSpecialty: claim.providerSpecialty,
              claimStatus: claim.claimStatus,
              claimType: claim.claimType,
              claimSubmissionMethod: claim.claimSubmissionMethod,
              diagnosisDescription: claim.diagnosisDescription,
              procedureDescription: claim.procedureDescription
            }))
          },
          scores: {
            bmi: employee.BMI_Score || null,
            hemoglobin: employee.Hemoglobin_Score || null,
            sugar: employee.Sugar_Score || null,
            cholesterol: employee.Cholesterol_Score || null,
            creatinine: employee.Creatinine_Score || null,
            physical: employee.Physical_Score || null,
            wellness: employee.Wellness_Score || null
          },
          predictions: predictions.map(prediction => ({
            type: prediction.predictionType,
            value: prediction.predictionValue,
            confidence: prediction.confidence,
            factors: prediction.factors,
            predictedAt: prediction.predictedAt
          }))
        };
      } catch (error) {
        console.error(`Error processing employee ${employee.employeeId}:`, error);
        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role
          },
          error: error.message
        };
      }
    }));

    res.json({
      totalEmployees,
      employees: employeeData
    });
  } catch (error) {
    console.error('Error getting all data:', error);
    res.status(500).json({ message: 'Error getting all data', error: error.message });
  }
};

/**
 * @desc    Get all employee data
 * @route   GET /api/analytics/employees
 * @access  Private/Admin
 */
const getAllEmployeesData = async (req, res) => {
  try {
    // Get all employees with their basic info
    const employees = await Employee.find()
      .select('_id email role employeeId Age Gender Weight_kg Height_cm BMI Chronic_Disease Policy_ID policyNumber Plan_Name BMI_Score Hemoglobin_Score Sugar_Score Cholesterol_Score Creatinine_Score Physical_Score Wellness_Score')
      .lean();

    const totalEmployees = employees.length;
    console.log(`Found ${totalEmployees} employees`);

    // Process each employee's data
    const employeeData = await Promise.all(employees.map(async (employee) => {
      try {
        const employeeId = employee.employeeId;
        console.log(`\nProcessing employee ${employeeId}`);

        // Get all related data
        const [healthData, wearableData, sleepData, claims] = await Promise.all([
          HealthData.find({ employee: employeeId }).sort({ recordedAt: -1 }).lean(),
          WearableData.find({ employee: employeeId }).sort({ date: -1 }).lean(),
          SleepData.find({ employee: employeeId }).sort({ startTime: -1 }).lean(),
          Claim.find({ employeeId: employeeId }).lean()
        ]);

        // Calculate wearable stats
        const wearableStats = {
          avgHeartRate: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length).toFixed(2) 
            : null,
          avgHRV: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length).toFixed(2) 
            : null,
          avgSteps: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.stepCount || 0), 0) / wearableData.length).toFixed(0)
            : null,
          avgActiveEnergy: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.activeEnergy || 0), 0) / wearableData.length).toFixed(0)
            : null
        };

        // Calculate sleep stats
        const sleepStats = {
          avgSleepEfficiency: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length).toFixed(2) 
            : null,
          avgHeartRate: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length).toFixed(2) 
            : null,
          avgTimeInBed: sleepData.length > 0
            ? (sleepData.reduce((sum, data) => sum + (data.timeInBed || 0), 0) / sleepData.length).toFixed(0)
            : null
        };

        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role,
            age: employee.Age,
            gender: employee.Gender,
            weight: employee.Weight_kg,
            height: employee.Height_cm,
            bmi: employee.BMI,
            chronicDisease: employee.Chronic_Disease,
            insurance: {
              policyId: employee.Policy_ID,
              policyNumber: employee.policyNumber,
              planName: employee.Plan_Name
            }
          },
          health: {
            latest: healthData.length > 0 ? {
              bmi: healthData[0].bmi || null,
              hemoglobin: healthData[0].hemoglobin || null,
              cholesterol: healthData[0].cholesterol || null,
              bloodSugar: healthData[0].bloodSugar || null,
              creatinine: healthData[0].creatinine || null
            } : { bmi: null },
            history: healthData
          },
          wearable: {
            latest: wearableData.length > 0 ? {
              heartRateAvg: wearableData[0].heartRateAvg || null,
              heartRateVariability: wearableData[0].heartRateVariability || null,
              stepCount: wearableData[0].stepCount || null,
              activeEnergy: wearableData[0].activeEnergy || null,
              exerciseTime: wearableData[0].exerciseTime || null
            } : {},
            history: wearableData,
            stats: wearableStats
          },
          sleep: {
            latest: sleepData.length > 0 ? {
              sleepQuality: sleepData[0].sleepQuality || null,
              timeInBed: sleepData[0].timeInBed || null,
              heartRate: sleepData[0].heartRate || null,
              startTime: sleepData[0].startTime || null,
              endTime: sleepData[0].endTime || null
            } : {},
            history: sleepData,
            stats: sleepStats
          },
          insurance: {
            policy: employee.Policy_ID ? {
              id: employee.Policy_ID,
              number: employee.policyNumber,
              plan: employee.Plan_Name
            } : null,
            claims: claims.map(claim => ({
              id: claim.id,
              providerId: claim.providerId,
              claimAmount: claim.claimAmount,
              claimDate: claim.claimDate,
              providerSpecialty: claim.providerSpecialty,
              claimStatus: claim.claimStatus,
              claimType: claim.claimType,
              claimSubmissionMethod: claim.claimSubmissionMethod,
              diagnosisDescription: claim.diagnosisDescription,
              procedureDescription: claim.procedureDescription
            }))
          },
          scores: {
            bmi: employee.BMI_Score || null,
            hemoglobin: employee.Hemoglobin_Score || null,
            sugar: employee.Sugar_Score || null,
            cholesterol: employee.Cholesterol_Score || null,
            creatinine: employee.Creatinine_Score || null,
            physical: employee.Physical_Score || null,
            wellness: employee.Wellness_Score || null
          }
        };
      } catch (error) {
        console.error(`Error processing employee ${employee.employeeId}:`, error);
        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role
          },
          error: error.message
        };
      }
    }));

    res.json({
      totalEmployees,
      employees: employeeData
    });
  } catch (error) {
    console.error('Error getting all employees data:', error);
    res.status(500).json({ message: 'Error getting all employees data', error: error.message });
  }
};

module.exports = {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts,
  getAllData,
  getAllEmployeesData
}; 