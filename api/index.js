const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
const loadCsvData = require('../loadCsvData');
const { getAllData } = require('../services/dataService');
const { predict } = require('../services/predictionService');
const { getCurrentTimestamp } = require('../utils');
const pool = require('../config/database');

const app = express();

app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Load environment variables
require('dotenv').config();

// API to add or update health data
app.post('/api/health-data', authenticateToken, async (req, res) => {
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

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM health_data WHERE employee_id = ?',
      [employeeIdBinary]
    );
    if (countResult[

0].count >= 30) {
      await pool.query(
        'DELETE FROM health_data WHERE employee_id = ? ORDER BY recorded_at ASC LIMIT 1',
        [employeeIdBinary]
      );
    }

    await pool.query(
      'INSERT INTO health_data SET ?',
      healthData
    );

    res.status(201).json({ message: 'Health data added successfully', id: healthData.id.toString('hex').match(/.{1,8}/g).join('-') });
  } catch (error) {
    res.status(500).json({ error: `Failed to add health data: ${error.message}` });
  }
});

// Prediction API
app.post('/api/predict/:employeeId', authenticateToken, async (req, res) => {
  try {
    const result = await predict(req.params.employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to fetch all data (admin only)
app.get('/api/all-data', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to submit feedback
app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const employeeId = Buffer.from(req.user.id.replace(/-/g, ''), 'hex');
    const [result] = await pool.query(
      'INSERT INTO feedback (employee_id, message, rating) VALUES (?, ?, ?)',
      [employeeId, message, rating || null]
    );

    const feedback = {
      id: result.insertId.toString(),
      employee_id: req.user.id,
      message,
      rating: rating || null,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    };
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import routes
const employeeRoutes = require('../routes/employeeRoutes');
const healthDataRoutes = require('../routes/healthDataRoutes');
const wearableLogRoutes = require('../routes/wearableLogRoutes');
const reportRoutes = require('../routes/reportRoutes');
const authRoutes = require('../routes/authRoutes');

// Use routes
app.use('/api/employees', employeeRoutes);
app.use('/api/health-data', authenticateToken, healthDataRoutes);
app.use('/api/wearable-logs', authenticateToken, wearableLogRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/auth', authRoutes);

// Load CSV data in the background (without blocking startup)
loadCsvData()
  .then(() => console.log('CSV data loading completed.'))
  .catch((error) => console.error('Failed to load CSV data:', error.stack));

// Export the app as a serverless function
module.exports = serverless(app);