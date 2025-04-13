const { HealthData } = require('../models/schemas');
const { getEmployeeHealthData, saveHealthData } = require('../services/dataService');

exports.getHealthData = async (req, res) => {
  try {
    const healthData = await getEmployeeHealthData(req.user.id);
    if (!healthData) return res.status(404).json({ error: 'Health data not found' });
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHealthData = async (req, res) => {
  try {
    const healthData = await saveHealthData(req.user.id, req.body);
    res.status(201).json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findOneAndUpdate(
      { employeeId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!healthData) return res.status(404).json({ error: 'Health data not found' });
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHealthData = async (req, res) => {
  try {
    const healthData = await HealthData.findOneAndDelete({ employeeId: req.user.id });
    if (!healthData) return res.status(404).json({ error: 'Health data not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 