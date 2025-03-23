const pool = require('../config/database');
const { getCurrentTimestamp } = require('../utils');

async function addHealthData(req, res) {
  try {
    const {
      employee_id,
      weight,
      height,
      bmi,
      hemoglobin,
      cholesterol,
      blood_sugar,
      creatinine,
      chronic_disease,
      family_medical_history
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id is required' });
    }

    const employeeIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!employeeIdRegex.test(employee_id)) {
      return res.status(400).json({ error: 'Invalid employee_id format' });
    }

    const employeeIdBinary = Buffer.from(employee_id.replace(/-/g, ''), 'hex');
    const [employee] = await pool.query('SELECT 1 FROM employee WHERE id = ?', [employeeIdBinary]);
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const [previous] = await pool.query(
      'SELECT * FROM health_data WHERE employee_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [employeeIdBinary]
    );
    const defaults = previous.length > 0 ? previous[0] : {
      weight: 70.0,
      height: 170.0,
      bmi: 24.0,
      hemoglobin: 14.0,
      cholesterol: 180.0,
      blood_sugar: 100.0,
      creatinine: 1.0
    };

    const healthData = {
      id: Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex'),
      employee_id: employeeIdBinary,
      recorded_at: getCurrentTimestamp(),
      weight: weight != null ? parseFloat(weight) : defaults.weight,
      height: height != null ? parseFloat(height) : defaults.height,
      bmi: bmi != null ? parseFloat(bmi) : defaults.bmi,
      hemoglobin: hemoglobin != null ? parseFloat(hemoglobin) : defaults.hemoglobin,
      cholesterol: cholesterol != null ? parseFloat(cholesterol) : defaults.cholesterol,
      blood_sugar: blood_sugar != null ? parseFloat(blood_sugar) : defaults.blood_sugar,
      creatinine: creatinine != null ? parseFloat(creatinine) : defaults.creatinine,
      chronic_disease: chronic_disease || (previous.length > 0 ? previous[0].chronic_disease : null),
      family_medical_history: family_medical_history || (previous.length > 0 ? previous[0].family_medical_history : null)
    };

    // Check and enforce 30-record limit
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM health_data WHERE employee_id = ?',
      [employeeIdBinary]
    );
    if (countResult[0].count >= 30) {
      await pool.query(
        'DELETE FROM health_data WHERE employee_id = ? ORDER BY recorded_at ASC LIMIT 1',
        [employeeIdBinary]
      );
    }

    await pool.query(
      'INSERT INTO health_data SET ?',
      healthData
    );

    res.status(201).json({
      message: 'Health data added successfully',
      id: healthData.id.toString('hex').match(/.{1,8}/g).join('-')
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to add health data: ${error.message}` });
  }
}

module.exports = {
  addHealthData,
};