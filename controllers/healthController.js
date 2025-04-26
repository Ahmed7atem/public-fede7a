const getHealthDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    const healthData = await HealthData.findOne({ employeeId: id }).lean();
    if (!healthData) {
      return res.status(404).json({ message: 'Health data not found for this employee' });
    }
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health data', error: error.message });
  }
}; 