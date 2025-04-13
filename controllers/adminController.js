const { Employee, HealthData, WearableData, Prediction } = require('../models/schemas');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalEmployees,
      totalHealthData,
      totalWearableData,
      totalPredictions,
      healthMetrics,
      insuranceStats
    ] = await Promise.all([
      Employee.countDocuments(),
      HealthData.countDocuments(),
      WearableData.countDocuments(),
      Prediction.countDocuments(),
      // Get aggregated health metrics
      HealthData.aggregate([
        {
          $group: {
            _id: null,
            avgBMI: { $avg: '$bmi' },
            avgCholesterol: { $avg: '$cholesterol' },
            avgBloodSugar: { $avg: '$bloodSugar' },
            smokerCount: { $sum: { $cond: [{ $eq: ['$smoker', true] }, 1, 0] } },
            chronicDiseaseCount: { $sum: { $cond: [{ $ne: ['$chronicDisease', null] }, 1, 0] } }
          }
        }
      ]),
      // Get insurance plan distribution
      Employee.aggregate([
        {
          $group: {
            _id: '$planName',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      totalEmployees,
      totalHealthData,
      totalWearableData,
      totalPredictions,
      healthMetrics: healthMetrics[0] || {
        avgBMI: 0,
        avgCholesterol: 0,
        avgBloodSugar: 0,
        smokerCount: 0,
        chronicDiseaseCount: 0
      },
      insuranceStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const [
      healthDataCount,
      wearableDataCount,
      predictionCount,
      latestHealthData,
      latestWearableData,
      latestPrediction
    ] = await Promise.all([
      HealthData.countDocuments({ employeeId: req.params.id }),
      WearableData.countDocuments({ employeeId: req.params.id }),
      Prediction.countDocuments({ employeeId: req.params.id }),
      HealthData.findOne({ employeeId: req.params.id })
        .select('-employeeId')
        .sort({ createdAt: -1 }),
      WearableData.findOne({ employeeId: req.params.id })
        .select('-employeeId')
        .sort({ createdAt: -1 }),
      Prediction.findOne({ employeeId: req.params.id })
        .select('-employeeId')
        .sort({ createdAt: -1 })
    ]);

    // Only return non-identifying employee data
    const employeeData = {
      id: employee._id,
      age: employee.age,
      gender: employee.gender,
      planName: employee.planName,
      coverageDetails: employee.coverageDetails,
      startDate: employee.startDate,
      endDate: employee.endDate
    };

    res.json({
      employee: employeeData,
      stats: {
        healthDataCount,
        wearableDataCount,
        predictionCount
      },
      latestData: {
        health: latestHealthData,
        wearable: latestWearableData,
        prediction: latestPrediction
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const [
      employeeCount,
      healthDataCount,
      wearableDataCount,
      predictionCount,
      healthRiskStats
    ] = await Promise.all([
      Employee.countDocuments(),
      HealthData.countDocuments(),
      WearableData.countDocuments(),
      Prediction.countDocuments(),
      // Get health risk statistics
      HealthData.aggregate([
        {
          $group: {
            _id: null,
            highBMICount: { $sum: { $cond: [{ $gt: ['$bmi', 30] }, 1, 0] } },
            highCholesterolCount: { $sum: { $cond: [{ $gt: ['$cholesterol', 200] }, 1, 0] } },
            highBloodSugarCount: { $sum: { $cond: [{ $gt: ['$bloodSugar', 126] }, 1, 0] } },
            chronicDiseaseCount: { $sum: { $cond: [{ $ne: ['$chronicDisease', null] }, 1, 0] } }
          }
        }
      ])
    ]);

    res.json({
      status: 'healthy',
      stats: {
        employeeCount,
        healthDataCount,
        wearableDataCount,
        predictionCount
      },
      healthRiskStats: healthRiskStats[0] || {
        highBMICount: 0,
        highCholesterolCount: 0,
        highBloodSugarCount: 0,
        chronicDiseaseCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};