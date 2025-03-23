const pool = require('../config/database');
const axios = require('axios');
require('dotenv').config();
const HEALTH_AFFAIRS_API_URL = process.env.HEALTH_AFFAIRS_API_URL || 'http://health-affairs-api.example.com/tickets';

exports.getHealthSummary = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [healthRows] = await pool.query(
      'SELECT AVG(weight) as avg_weight, AVG(height) as avg_height, AVG(bmi) as avg_bmi, AVG(hemoglobin) as avg_hemoglobin, AVG(cholesterol) as avg_cholesterol, AVG(blood_sugar) as avg_blood_sugar, AVG(creatinine) as avg_creatinine FROM health_data WHERE employee_id = ?',
      [employeeId]
    );
    if (healthRows.length === 0 || !healthRows[0].avg_weight) return res.status(404).json({ error: 'No health data found for this employee' });
    res.json({
      employee_id: req.params.employeeId,
      avg_weight: parseFloat(healthRows[0].avg_weight).toFixed(2),
      avg_height: parseFloat(healthRows[0].avg_height).toFixed(2),
      avg_bmi: parseFloat(healthRows[0].avg_bmi).toFixed(2),
      avg_hemoglobin: parseFloat(healthRows[0].avg_hemoglobin).toFixed(2),
      avg_cholesterol: parseFloat(healthRows[0].avg_cholesterol).toFixed(2),
      avg_blood_sugar: parseFloat(healthRows[0].avg_blood_sugar).toFixed(2),
      avg_creatinine: parseFloat(healthRows[0].avg_creatinine).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWearableTrends = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [wearableRows] = await pool.query(
      'SELECT AVG(step_count) as avg_step_count, AVG(sleep_quality) as avg_sleep_quality, AVG(time_in_bed) as avg_time_in_bed, AVG(heart_rate_avg) as avg_heart_rate FROM wearable_log WHERE employee_id = ?',
      [employeeId]
    );
    if (wearableRows.length === 0 || !wearableRows[0].avg_step_count) return res.status(404).json({ error: 'No wearable data found for this employee' });
    res.json({
      employee_id: req.params.employeeId,
      avg_step_count: parseFloat(wearableRows[0].avg_step_count).toFixed(2),
      avg_sleep_quality: parseFloat(wearableRows[0].avg_sleep_quality).toFixed(2),
      avg_time_in_bed: parseFloat(wearableRows[0].avg_time_in_bed).toFixed(2),
      avg_heart_rate: parseFloat(wearableRows[0].avg_heart_rate).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSleepAnalysis = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [sleepRows] = await pool.query(
      'SELECT AVG(sleep_quality) as avg_sleep_quality, AVG(time_in_bed) as avg_sleep_duration, MIN(sleep_quality) as min_sleep_quality, MAX(sleep_quality) as max_sleep_quality FROM wearable_log WHERE employee_id = ? AND sleep_quality IS NOT NULL',
      [employeeId]
    );
    if (sleepRows.length === 0 || !sleepRows[0].avg_sleep_quality) return res.status(404).json({ error: 'No sleep data found for this employee' });
    res.json({
      employee_id: req.params.employeeId,
      avg_sleep_quality: parseFloat(sleepRows[0].avg_sleep_quality).toFixed(2),
      avg_sleep_duration: parseFloat(sleepRows[0].avg_sleep_duration).toFixed(2),
      min_sleep_quality: parseFloat(sleepRows[0].min_sleep_quality).toFixed(2),
      max_sleep_quality: parseFloat(sleepRows[0].max_sleep_quality).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityRecommendations = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [wearableRows] = await pool.query(
      'SELECT AVG(step_count) as avg_step_count, AVG(exercise_time_min) as avg_exercise_time FROM wearable_log WHERE employee_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
      [employeeId]
    );
    if (wearableRows.length === 0 || !wearableRows[0].avg_step_count) return res.status(404).json({ error: 'No recent wearable data found for this employee' });
    
    const avgStepCount = parseFloat(wearableRows[0].avg_step_count);
    const avgExerciseTime = parseFloat(wearableRows[0].avg_exercise_time);
    const recommendations = [];
    
    if (avgStepCount < 8000) {
      recommendations.push('Increase daily steps to at least 8,000 to improve overall activity level.');
    }
    if (avgExerciseTime < 30) {
      recommendations.push('Aim for at least 30 minutes of exercise per day to enhance cardiovascular health.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Great job! Your activity levels are on track.');
    }
    
    res.json({
      employee_id: req.params.employeeId,
      avg_step_count: avgStepCount.toFixed(2),
      avg_exercise_time: avgExerciseTime.toFixed(2),
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHealthAlerts = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [healthRows] = await pool.query(
      'SELECT cholesterol, blood_sugar, bmi FROM health_data WHERE employee_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [employeeId]
    );
    if (healthRows.length === 0) return res.status(404).json({ error: 'No health data found for this employee' });

    const { cholesterol, blood_sugar, bmi } = healthRows[0];
    const alerts = [];

    if (cholesterol > 240) {
      alerts.push('High cholesterol detected (>240 mg/dL). Consider consulting a doctor.');
    }
    if (blood_sugar > 126) {
      alerts.push('High blood sugar detected (>126 mg/dL). Monitor for diabetes risk.');
    }
    if (bmi > 30) {
      alerts.push('BMI indicates obesity (>30). Consider a weight management plan.');
    }
    if (alerts.length === 0) {
      alerts.push('No immediate health risks detected.');
    }

    res.json({
      employee_id: req.params.employeeId,
      cholesterol,
      blood_sugar,
      bmi,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitFeedbackTicket = async (req, res) => {
  try {
    const { employee_id, feedback } = req.body;
    if (!employee_id || !feedback) {
      return res.status(400).json({ error: 'employee_id and feedback are required' });
    }

    const employeeIdBinary = Buffer.from(employee_id.replace(/-/g, ''), 'hex');
    const [employee] = await pool.query('SELECT 1 FROM employee WHERE id = ?', [employeeIdBinary]);
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const ticketId = Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex');
    const submittedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      'INSERT INTO feedback_tickets (id, employee_id, submitted_at, feedback, status) VALUES (?, ?, ?, ?, ?)',
      [ticketId, employeeIdBinary, submittedAt, feedback, 'pending']
    );

    // Send to health affairs API
    try {
      await axios.post(HEALTH_AFFAIRS_API_URL, {
        employee_id,
        feedback,
        submitted_at: submittedAt,
      });
      await pool.query(
        'UPDATE feedback_tickets SET status = ? WHERE id = ?',
        ['sent', ticketId]
      );
      res.status(201).json({
        message: 'Feedback ticket submitted and sent successfully',
        id: ticketId.toString('hex').match(/.{1,8}/g).join('-')
      });
    } catch (apiError) {
      console.error('Failed to send feedback to health affairs API:', apiError.message);
      res.status(201).json({
        message: 'Feedback ticket submitted but not yet sent to health affairs',
        id: ticketId.toString('hex').match(/.{1,8}/g).join('-')
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;