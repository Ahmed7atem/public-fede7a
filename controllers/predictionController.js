const { predict } = require('../services/predictionService');

async function predictHealth(req, res) {
  try {
    const result = await predict(req.params.employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  predictHealth,
};