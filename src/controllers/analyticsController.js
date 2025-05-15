const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Claim, Prediction } = require('../../models');

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
    const wearableData = await WearableData.find({ employee: employeeId }).sort({ date: -1 }).lean();
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
    const sleepData = await SleepData.find({ employee: employeeId }).sort({ startTime: -1 }).lean();
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
        bmiCategory: employee.BMI ? getBMICategory(parseFloat(employee.BMI)) : null,
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
      const gender = emp.Gender || 'other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Calculate average age
    const totalAge = employees.reduce((sum, emp) => sum + (emp.Age || 0), 0);
    const averageAge = totalEmployees > 0 ? Math.round(totalAge / totalEmployees) : 0;

    // Get all health data from all years
    const [healthData2020, healthData2021, healthData2022, healthData2023, healthData2024, currentHealthData] = await Promise.all([
      HealthData.find({}, null, { collection: 'healthdata_2020' }).lean(),
      HealthData.find({}, null, { collection: 'healthdata_2021' }).lean(),
      HealthData.find({}, null, { collection: 'healthdata_2022' }).lean(),
      HealthData.find({}, null, { collection: 'healthdata_2023' }).lean(),
      HealthData.find({}, null, { collection: 'healthdata_2024' }).lean(),
      HealthData.find().lean()
    ]);

    // Combine all health data
    const allHealthData = [
      ...healthData2020,
      ...healthData2021,
      ...healthData2022,
      ...healthData2023,
      ...healthData2024,
      ...currentHealthData
    ];

    // Calculate year-over-year health metrics
    const yearlyHealthMetrics = {
      2020: calculateYearlyHealthMetrics(healthData2020),
      2021: calculateYearlyHealthMetrics(healthData2021),
      2022: calculateYearlyHealthMetrics(healthData2022),
      2023: calculateYearlyHealthMetrics(healthData2023),
      2024: calculateYearlyHealthMetrics(healthData2024)
    };

    // Calculate year-over-year changes
    const healthTrends = calculateHealthTrends(yearlyHealthMetrics);

    const bmiData = allHealthData.map(data => data.bmi || 0).filter(bmi => bmi > 0);
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
    const wearableData = await WearableData.find().lean();
    const stepsData = wearableData.map(data => data.stepCount || 0);
    const heartRateData = wearableData.map(data => data.heartRateAvg || 0);
    
    const averageSteps = stepsData.length > 0 
      ? Math.round(stepsData.reduce((sum, steps) => sum + steps, 0) / stepsData.length)
      : 0;
    
    const averageHeartRate = heartRateData.length > 0
      ? Math.round(heartRateData.reduce((sum, hr) => sum + hr, 0) / heartRateData.length)
      : 0;

    // Get sleep data
    const sleepData = await SleepData.find().lean();
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

    // Get claims data from all collections
    const [currentClaims, claims2023, claims2024, specialClaims, preApprovalClaims] = await Promise.all([
      Claim.find().lean(),
      Claim.find({}, null, { collection: 'claims2023' }).lean(),
      Claim.find({}, null, { collection: 'claims2024' }).lean(),
      Claim.find({}, null, { collection: 'specialclaims' }).lean(),
      Claim.find({}, null, { collection: 'preapprovalclaims' }).lean()
    ]);

    // Combine all claims
    const allClaims = [
      ...currentClaims,
      ...claims2023,
      ...claims2024,
      ...specialClaims,
      ...preApprovalClaims
    ];

    // Calculate claims by year
    const claimsByYear = {
      2023: claims2023,
      2024: claims2024
    };

    // Calculate year-over-year claims metrics
    const claimsTrends = calculateClaimsTrends(claimsByYear);

    const totalClaims = allClaims.length;
    const approvedClaims = allClaims.filter(claim => claim.claimStatus === 'approved').length;
    const pendingClaims = allClaims.filter(claim => claim.claimStatus === 'pending').length;
    const rejectedClaims = allClaims.filter(claim => claim.claimStatus === 'rejected').length;
    
    const totalAmount = allClaims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0).toFixed(2);
    const averageAmount = totalClaims > 0 ? (totalAmount / totalClaims).toFixed(2) : "0.00";
    const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : "0.0";
    const averageClaimPerEmployee = totalEmployees > 0 ? (totalClaims / totalEmployees).toFixed(2) : "0.00";

    // Calculate chronic disease distribution
    const chronicDiseaseDistribution = employees.reduce((acc, emp) => {
      const disease = emp.Chronic_Disease || 'None';
      acc[disease] = (acc[disease] || 0) + 1;
      return acc;
    }, {});

    // Calculate wellness score distribution
    const wellnessScoreDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    employees.forEach(emp => {
      const score = emp.Wellness_Score || 0;
      if (score >= 90) wellnessScoreDistribution.excellent++;
      else if (score >= 70) wellnessScoreDistribution.good++;
      else if (score >= 50) wellnessScoreDistribution.fair++;
      else wellnessScoreDistribution.poor++;
    });

    res.json({
      overview: {
        totalEmployees,
        averageAge,
        genderDistribution,
        chronicDiseaseDistribution,
        wellnessScoreDistribution
      },
      healthMetrics: {
        averageBMI,
        bmiDistribution,
        averageSteps,
        averageSleep,
        averageHeartRate,
        yearlyHealthMetrics,
        healthTrends
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
        averageClaimPerEmployee,
        claimsTrends
      }
    });
  } catch (error) {
    console.error('Error getting organization analytics:', error);
    res.status(500).json({ message: 'Error getting organization analytics', error: error.message });
  }
};

// Helper function to calculate yearly health metrics
const calculateYearlyHealthMetrics = (healthData) => {
  const metrics = {
    averageBMI: 0,
    averageHemoglobin: 0,
    averageCholesterol: 0,
    averageBloodSugar: 0,
    averageCreatinine: 0,
    recordCount: healthData.length
  };

  if (healthData.length > 0) {
    metrics.averageBMI = (healthData.reduce((sum, data) => sum + (data.bmi || 0), 0) / healthData.length).toFixed(2);
    metrics.averageHemoglobin = (healthData.reduce((sum, data) => sum + (data.hemoglobin || 0), 0) / healthData.length).toFixed(2);
    metrics.averageCholesterol = (healthData.reduce((sum, data) => sum + (data.cholesterol || 0), 0) / healthData.length).toFixed(2);
    metrics.averageBloodSugar = (healthData.reduce((sum, data) => sum + (data.bloodSugar || 0), 0) / healthData.length).toFixed(2);
    metrics.averageCreatinine = (healthData.reduce((sum, data) => sum + (data.creatinine || 0), 0) / healthData.length).toFixed(2);
  }

  return metrics;
};

// Helper function to calculate health trends
const calculateHealthTrends = (yearlyMetrics) => {
  const years = Object.keys(yearlyMetrics).sort();
  const trends = {};

  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i - 1];
    const current = yearlyMetrics[currentYear];
    const previous = yearlyMetrics[previousYear];

    trends[`${previousYear}-${currentYear}`] = {
      bmiChange: calculatePercentageChange(previous.averageBMI, current.averageBMI),
      hemoglobinChange: calculatePercentageChange(previous.averageHemoglobin, current.averageHemoglobin),
      cholesterolChange: calculatePercentageChange(previous.averageCholesterol, current.averageCholesterol),
      bloodSugarChange: calculatePercentageChange(previous.averageBloodSugar, current.averageBloodSugar),
      creatinineChange: calculatePercentageChange(previous.averageCreatinine, current.averageCreatinine),
      recordCountChange: calculatePercentageChange(previous.recordCount, current.recordCount)
    };
  }

  return trends;
};

// Helper function to calculate claims trends
const calculateClaimsTrends = (claimsByYear) => {
  const years = Object.keys(claimsByYear).sort();
  const trends = {};

  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i - 1];
    const currentClaims = claimsByYear[currentYear];
    const previousClaims = claimsByYear[previousYear];

    const currentTotal = currentClaims.length;
    const previousTotal = previousClaims.length;
    const currentAmount = currentClaims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0);
    const previousAmount = previousClaims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0);

    trends[`${previousYear}-${currentYear}`] = {
      totalClaimsChange: calculatePercentageChange(previousTotal, currentTotal),
      totalAmountChange: calculatePercentageChange(previousAmount, currentAmount),
      averageAmountChange: calculatePercentageChange(
        previousTotal > 0 ? previousAmount / previousTotal : 0,
        currentTotal > 0 ? currentAmount / currentTotal : 0
      )
    };
  }

  return trends;
};

// Helper function to calculate percentage change
const calculatePercentageChange = (previous, current) => {
  if (!previous) return 100;
  return ((current - previous) / previous * 100).toFixed(2);
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
    
    res.json([
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
    ]);
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
        const employeeObjectId = employee._id.toString(); // Use _id as fallback
        console.log(`\nProcessing employee ${employeeId} (_id: ${employeeObjectId})`);

        // Query with employeeId and fallback to _id
        const [healthData, wearableData, sleepData, predictions, claims] = await Promise.all([
          HealthData.find({ employee: employeeId }).sort({ recordedAt: -1 }).lean()
            .then(data => {
              console.log(`Health data (employee: ${employeeId}): ${data.length} records`);
              if (data.length === 0) {
                console.log(`Trying _id for HealthData...`);
                return HealthData.find({ employee: employeeObjectId }).sort({ recordedAt: -1 }).lean()
                  .then(fallbackData => {
                    console.log(`Health data (_id: ${employeeObjectId}): ${fallbackData.length} records`);
                    return fallbackData;
                  });
              }
              return data;
            }),
          WearableData.find({ employee: employeeId }).sort({ date: -1 }).lean()
            .then(data => {
              console.log(`Wearable data (employee: ${employeeId}): ${data.length} records`);
              if (data.length === 0) {
                console.log(`Trying _id for WearableData...`);
                return WearableData.find({ employee: employeeObjectId }).sort({ date: -1 }).lean()
                  .then(fallbackData => {
                    console.log(`Wearable data (_id: ${employeeObjectId}): ${fallbackData.length} records`);
                    return fallbackData;
                  });
              }
              return data;
            }),
          SleepData.find({ employee: employeeId }).sort({ startTime: -1 }).lean()
            .then(data => {
              console.log(`Sleep data (employee: ${employeeId}): ${data.length} records`);
              if (data.length === 0) {
                console.log(`Trying _id for SleepData...`);
                return SleepData.find({ employee: employeeObjectId }).sort({ startTime: -1 }).lean()
                  .then(fallbackData => {
                    console.log(`Sleep data (_id: ${employeeObjectId}): ${fallbackData.length} records`);
                    return fallbackData;
                  });
              }
              return data;
            }),
          Prediction.find({ employee: employeeId }).lean()
            .then(data => {
              console.log(`Predictions (employee: ${employeeId}): ${data.length} records`);
              if (data.length === 0) {
                console.log(`Trying _id for Prediction...`);
                return Prediction.find({ employee: employeeObjectId }).lean()
                  .then(fallbackData => {
                    console.log(`Predictions (_id: ${employeeObjectId}): ${fallbackData.length} records`);
                    return fallbackData;
                  });
              }
              return data;
            }),
          Claim.find({ patientId: employeeId }).lean()
            .then(data => {
              console.log(`Claims (patientId: ${employeeId}): ${data.length} records`);
              return data;
            }),
        ]);

        // Calculate wearable stats
        const wearableStats = {
          avgHeartRate: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length).toFixed(2)
            : null,
          avgHRV: wearableData.length > 0
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length).toFixed(2)
            : null,
        };

        // Calculate sleep stats
        const sleepStats = {
          avgSleepEfficiency: sleepData.length > 0
            ? (sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length).toFixed(2)
            : null,
          avgHeartRate: sleepData.length > 0
            ? (sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length).toFixed(2)
            : null,
        };

        const result = {
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
              planName: employee.Plan_Name,
            },
          },
          health: {
            latest: healthData.length > 0 ? {
              bmi: healthData[0].bmi || null,
              hemoglobin: healthData[0].hemoglobin || null,
              cholesterol: healthData[0].cholesterol || null,
              bloodSugar: healthData[0].bloodSugar || null,
              creatinine: healthData[0].creatinine || null,
            } : { bmi: null },
            history: healthData,
          },
          wearable: {
            latest: wearableData.length > 0 ? {
              heartRateAvg: wearableData[0].heartRateAvg || null,
              heartRateVariability: wearableData[0].heartRateVariability || null,
              stepCount: wearableData[0].stepCount || null,
              activeEnergy: wearableData[0].activeEnergy || null,
              exerciseTime: wearableData[0].exerciseTime || null,
            } : {},
            history: wearableData,
            stats: wearableStats,
          },
          sleep: {
            latest: sleepData.length > 0 ? {
              sleepQuality: sleepData[0].sleepQuality || null,
              timeInBed: sleepData[0].timeInBed || null,
              heartRate: sleepData[0].heartRate || null,
              startTime: sleepData[0].startTime || null,
              endTime: sleepData[0].endTime || null,
            } : {},
            history: sleepData,
            stats: sleepStats,
          },
          insurance: {
            policy: employee.Policy_ID ? {
              id: employee.Policy_ID,
              number: employee.policyNumber,
              plan: employee.Plan_Name,
            } : null,
            claims: claims.map(claim => ({
              id: claim.id,
              amount: claim.claimAmount,
              date: claim.claimDate,
              status: claim.claimStatus,
              type: claim.claimType,
              diagnosis: claim.diagnosisDescription,
              procedure: claim.procedureDescription,
            })),
          },
          scores: {
            bmi: employee.BMI_Score || null,
            hemoglobin: employee.Hemoglobin_Score || null,
            sugar: employee.Sugar_Score || null,
            cholesterol: employee.Cholesterol_Score || null,
            creatinine: employee.Creatinine_Score || null,
            physical: employee.Physical_Score || null,
            wellness: employee.Wellness_Score || null,
          },
          predictions: predictions.map(prediction => ({
            type: prediction.predictionType,
            value: prediction.predictionValue,
            confidence: prediction.confidence,
            factors: prediction.factors,
            predictedAt: prediction.predictedAt,
          })),
          complaints: [],
        };

        return result;
      } catch (error) {
        console.error(`Error processing employee ${employee.employeeId}:`, error);
        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role,
          },
          error: error.message,
        };
      }
    }));

    res.json(employeeData);
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
          Claim.find({ patientId: employeeId }).lean()
        ]);

        // Calculate averages
        const wearableStats = {
          avgHeartRate: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateAvg || 0), 0) / wearableData.length).toFixed(2) 
            : null,
          avgHRV: wearableData.length > 0 
            ? (wearableData.reduce((sum, data) => sum + (data.heartRateVariability || 0), 0) / wearableData.length).toFixed(2) 
            : null,
        };

        const sleepStats = {
          avgSleepEfficiency: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.sleepQuality || 0), 0) / sleepData.length).toFixed(2) 
            : null,
          avgHeartRate: sleepData.length > 0 
            ? (sleepData.reduce((sum, data) => sum + (data.heartRate || 0), 0) / sleepData.length).toFixed(2) 
            : null,
        };

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
              planName: employee.Plan_Name,
            },
          },
          health: {
            latest: healthData[0] || {},
            history: healthData,
          },
          wearable: {
            latest: wearableData[0] || {},
            history: wearableData,
            stats: wearableStats,
          },
          sleep: {
            latest: sleepData[0] || {},
            history: sleepData,
            stats: sleepStats,
          },
          insurance: {
            policy: employee.Policy_ID ? {
              id: employee.Policy_ID,
              number: employee.policyNumber,
              plan: employee.Plan_Name,
            } : null,
            claims: claims.map(claim => ({
              id: claim.id,
              amount: claim.claimAmount,
              date: claim.claimDate,
              status: claim.claimStatus,
              type: claim.claimType,
              diagnosis: claim.diagnosisDescription,
              procedure: claim.procedureDescription,
            })),
          },
          scores: {
            bmi: employee.BMI_Score || null,
            hemoglobin: employee.Hemoglobin_Score || null,
            sugar: employee.Sugar_Score || null,
            cholesterol: employee.Cholesterol_Score || null,
            creatinine: employee.Creatinine_Score || null,
            physical: employee.Physical_Score || null,
            wellness: employee.Wellness_Score || null,
          }
        };
      } catch (error) {
        console.error(`Error processing employee ${employee.employeeId}:`, error);
        return {
          employee: {
            _id: employee._id,
            employeeId: employee.employeeId,
            email: employee.email,
            role: employee.role,
          },
          error: error.message,
        };
      }
    }));

    res.json(employeeData);
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