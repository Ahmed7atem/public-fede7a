const { Employee, HealthData, WearableData, SleepData, Claim, Prediction } = require('../../models');

/**
 * @desc    Get employee analytics
 * @route   GET /api/analytics/employee/:id
 * @access  Private/Admin
 */
const getEmployeeAnalytics = async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // In a real app, we would fetch actual data from the database
    // For now, we'll return a mock response
    
    res.json({
      employee: {
        id: employeeId,
        name: "John Doe",
        age: 35,
        gender: "Male"
      },
      healthMetrics: {
        bmi: 23.5,
        bloodPressure: "120/80",
        cholesterol: 185,
        bloodSugar: 95
      },
      activityData: {
        averageSteps: 8500,
        averageHeartRate: 72,
        averageSleepHours: 7.2
      },
      wellnessScore: 85,
      riskFactors: ["Sedentary lifestyle", "Family history of heart disease"],
      recommendations: [
        "Increase physical activity",
        "Reduce sodium intake",
        "Schedule preventive screenings"
      ]
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
    // In a real app, we would aggregate data from the database
    // For now, we'll return a mock response
    
    res.json({
      overview: {
        totalEmployees: 1250,
        averageAge: 38,
        genderDistribution: {
          male: 58,
          female: 42
        }
      },
      healthMetrics: {
        averageBMI: 24.2,
        averageCholesterol: 195,
        averageBloodSugar: 98,
        chronicConditionsPercentage: 18
      },
      activityMetrics: {
        averageDailySteps: 7800,
        averageSleepHours: 6.9,
        regularExercisePercentage: 65
      },
      insuranceMetrics: {
        totalClaims: 850,
        averageClaimAmount: 2350,
        topClaimCategories: [
          { category: "Preventive Care", percentage: 28 },
          { category: "Specialist Visits", percentage: 22 },
          { category: "Prescription Drugs", percentage: 18 }
        ]
      },
      wellnessProgram: {
        participationRate: 72,
        mostPopularActivities: ["Fitness Challenges", "Nutrition Workshops"],
        averageWellnessScore: 78
      },
      trends: {
        wellnessScoreByQuarter: [76, 77, 78, 79],
        claimsByQuarter: [210, 205, 220, 215],
        chronicConditionsByQuarter: [19, 18.5, 18, 18]
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
    // Get all employees
    const employees = await Employee.find().lean();
    const totalEmployees = employees.length;

    // Process each employee's data
    const employeeData = await Promise.all(employees.map(async (employee) => {
      const employeeId = employee.employeeId;

      // Get health data
      const healthData = await HealthData.find({ employeeId }).sort({ recordedAt: -1 }).lean();
      const latestHealth = healthData[0] || {};

      // Get wearable data
      const wearableData = await WearableData.find({ employeeId }).sort({ date: -1 }).lean();
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
      const sleepData = await SleepData.find({ employeeId }).sort({ startTime: -1 }).lean();
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
      const claims = await Claim.find({ employeeId }).lean();

      // Get predictions
      const predictions = await Prediction.find({ employeeId }).lean();

      return {
        employee: {
          _id: employee._id,
          email: employee.email,
          role: employee.role
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
      };
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