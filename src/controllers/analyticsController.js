const { Employee, HealthData, WearableData, SleepData } = require('../../models');

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
 * @desc    Get all data for analytics
 * @route   GET /api/analytics/all-data
 * @access  Private/Admin
 */
const getAllData = async (req, res) => {
  try {
    // In a real app, we would fetch comprehensive data from multiple collections
    // For now, we'll return a mock response with aggregated data
    
    res.json({
      employeeCount: 1250,
      healthMetrics: {
        averages: {
          bmi: 24.2,
          cholesterol: 195,
          bloodSugar: 98
        },
        distribution: {
          normalWeight: 65,
          overweight: 28,
          obese: 7
        }
      },
      activityData: {
        averages: {
          steps: 7800,
          sleepHours: 6.9,
          activeMinutes: 42
        },
        trends: {
          stepsByMonth: [7600, 7650, 7800, 7900, 8000, 7950],
          sleepByMonth: [6.8, 6.8, 6.9, 7.0, 6.9, 6.9]
        }
      },
      claims: {
        totalAmount: 1998500,
        averageAmount: 2350,
        byCategory: [
          { category: "Preventive", amount: 559580 },
          { category: "Specialist", amount: 439670 },
          { category: "Prescription", amount: 359730 },
          { category: "Emergency", amount: 299775 },
          { category: "Other", amount: 339745 }
        ]
      },
      riskAssessment: {
        lowRisk: 72,
        mediumRisk: 23,
        highRisk: 5,
        topRiskFactors: [
          "Sedentary lifestyle",
          "Poor sleep habits",
          "Stress",
          "Family history"
        ]
      }
    });
  } catch (error) {
    console.error('Error getting all analytics data:', error);
    res.status(500).json({ message: 'Error getting analytics data', error: error.message });
  }
};

module.exports = {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts,
  getAllData
}; 