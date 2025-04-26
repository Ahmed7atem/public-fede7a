const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Claim, Prediction } = require('../../models');

/**
 * @desc    Get employee analytics
 * @route   GET /api/analytics/employee/:id
 * @access  Private/Admin
 */
const getEmployeeAnalytics = async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Find employee by employeeId instead of _id
    const employee = await Employee.findOne({ employeeId: employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get health data
    const healthData = await HealthData.find({ employeeId: employeeId }).sort({ recordedAt: -1 }).lean();
    const latestHealth = healthData[0] || {};

    // Get wearable data
    const wearableData = await WearableData.find({ employeeId: employeeId }).sort({ date: -1 }).lean();
    const latestWearable = wearableData[0] || {};
    
    // Calculate wearable stats
    const wearableStats = {
      avgHeartRate: wearableData.length > 0 
        ? wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length 
        : null,
      avgHRV: wearableData.length > 0 
        ? wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length 
        : null
    };

    // Get sleep data
    const sleepData = await SleepData.find({ employeeId: employeeId }).sort({ startTime: -1 }).lean();
    const latestSleep = sleepData[0] || {};
    
    // Calculate sleep stats
    const sleepStats = {
      avgSleepEfficiency: sleepData.length > 0 
        ? sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length 
        : null,
      avgHeartRate: sleepData.length > 0 
        ? sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length 
        : null
    };

    // Get claims
    const claims = await Claim.find({ patientId: employeeId }).lean();

    // Get predictions
    const predictions = await Prediction.find({ employeeId: employeeId }).lean();

    res.json({
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
        latest: {
          bmi: latestHealth.bmi || null
        },
        history: healthData
      },
      wearable: {
        latest: latestWearable,
        history: wearableData,
        stats: wearableStats
      },
      sleep: {
        latest: latestSleep,
        history: sleepData,
        stats: sleepStats
      },
      insurance: {
        policy: employee.Policy_ID ? {
          id: employee.Policy_ID,
          number: employee.policyNumber,
          plan: employee.Plan_Name
        } : null,
        claims: claims
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
      predictions: predictions,
      complaints: [] // This would be populated if we had a complaints collection
    });
  } catch (error) {
    console.error('Error getting employee analytics:', error);
    res.status(500).json({ message: 'Error getting employee analytics', error: error.message });
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
      const gender = emp.gender || 'other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Calculate average age
    const totalAge = employees.reduce((sum, emp) => sum + (emp.age || 0), 0);
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
    const stepsData = wearableData.map(data => data.steps || 0);
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
    const approvedClaims = claims.filter(claim => claim.status === 'approved').length;
    const pendingClaims = claims.filter(claim => claim.status === 'pending').length;
    const rejectedClaims = claims.filter(claim => claim.status === 'rejected').length;
    
    const totalAmount = claims.reduce((sum, claim) => sum + (claim.amount || 0), 0).toFixed(2);
    const averageAmount = totalClaims > 0 ? (totalAmount / totalClaims).toFixed(2) : "0.00";
    const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : "0.0";
    const averageClaimPerEmployee = totalEmployees > 0 ? (totalClaims / totalEmployees).toFixed(2) : "0.00";

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
    // In a real app, we would analyze data to identify anomalies and health concerns
    // For now, we'll return a mock response
    
    res.json({
      alerts: [
        {
          id: "alert-1",
          type: "High Risk",
          description: "5 employees showing signs of hypertension",
          affectedCount: 5,
          recommendations: ["Schedule health checkups", "Provide blood pressure information"]
        },
        {
          id: "alert-2",
          type: "Medium Risk",
          description: "Increasing stress levels detected in Engineering department",
          affectedCount: 12,
          recommendations: ["Offer stress management workshops", "Review workload distribution"]
        },
        {
          id: "alert-3",
          type: "Low Risk",
          description: "Seasonal allergies affecting productivity",
          affectedCount: 28,
          recommendations: ["Share allergy management resources", "Consider air purifiers"]
        }
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting health alerts:', error);
    res.status(500).json({ message: 'Error getting health alerts', error: error.message });
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
        console.log(`Processing employee ${employeeId}`);

        // Get health data
        const healthData = await HealthData.find({ employeeId: employeeId }).sort({ recordedAt: -1 }).lean();
        console.log(`Found ${healthData.length} health records for employee ${employeeId}`);
        const latestHealth = healthData[0] || {};

        // Get wearable data
        const wearableData = await WearableData.find({ employeeId: employeeId }).sort({ date: -1 }).lean();
        console.log(`Found ${wearableData.length} wearable records for employee ${employeeId}`);
        const latestWearable = wearableData[0] || {};
        
        // Calculate wearable stats
        const wearableStats = {
          avgHeartRate: wearableData.length > 0 
            ? wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length 
            : null,
          avgHRV: wearableData.length > 0 
            ? wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length 
            : null
        };

        // Get sleep data
        const sleepData = await SleepData.find({ employeeId: employeeId }).sort({ startTime: -1 }).lean();
        console.log(`Found ${sleepData.length} sleep records for employee ${employeeId}`);
        const latestSleep = sleepData[0] || {};
        
        // Calculate sleep stats
        const sleepStats = {
          avgSleepEfficiency: sleepData.length > 0 
            ? sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length 
            : null,
          avgHeartRate: sleepData.length > 0 
            ? sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length 
            : null
        };

        // Get claims
        const claims = await Claim.find({ patientId: employeeId }).lean();
        console.log(`Found ${claims.length} claims for employee ${employeeId}`);

        // Get predictions
        const predictions = await Prediction.find({ employeeId: employeeId }).lean();
        console.log(`Found ${predictions.length} predictions for employee ${employeeId}`);

        return {
          employee: {
            _id: employee._id,
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
            latest: {
              bmi: latestHealth.bmi || null
            },
            history: healthData
          },
          wearable: {
            latest: latestWearable,
            history: wearableData,
            stats: wearableStats
          },
          sleep: {
            latest: latestSleep,
            history: sleepData,
            stats: sleepStats
          },
          insurance: {
            policy: employee.Policy_ID ? {
              id: employee.Policy_ID,
              number: employee.policyNumber,
              plan: employee.Plan_Name
            } : null,
            claims: claims
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
          predictions: predictions,
          complaints: []
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

module.exports = {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts,
  getAllData
}; 