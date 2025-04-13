const express = require('express');
const { getAllEmployeesData } = require('../services/dataService');
const { predict } = require('../services/predictionService');
const { getCurrentTimestamp } = require('../utils');
const connectDB = require('../config/database');
const { apiLimiter, authLimiter, dataSubmissionLimiter } = require('../middleware/rateLimiter');
const { auth, adminAuth } = require('../middleware/auth');

const app = express();

// Load environment variables
require('dotenv').config();

app.use(express.json());

// Connect to MongoDB
let dbConnection;
(async () => {
  try {
    dbConnection = await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
})();

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Import routes
const employeeRoutes = require('../routes/employeeRoutes');
const healthDataRoutes = require('../routes/healthDataRoutes');
const wearableLogRoutes = require('../routes/wearableLogRoutes');
const reportRoutes = require('../routes/reportRoutes');
const authRoutes = require('../routes/authRoutes');
const feedbackRoutes = require('../routes/feedbackRoutes');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', dbConnection: !!dbConnection });
});

// Use routes with appropriate rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/health-data', auth, dataSubmissionLimiter, healthDataRoutes);
app.use('/api/wearable-logs', auth, dataSubmissionLimiter, wearableLogRoutes);
app.use('/api/employees', auth, employeeRoutes);
app.use('/api/reports', auth, reportRoutes);
app.use('/api/feedback', auth, feedbackRoutes);

// Add a route for getting health data by employee ID
app.get('/api/health-data/:id', auth, (req, res, next) => {
  req.params.id = req.params.id;
  next();
}, healthDataRoutes);

// Prediction API
app.post('/api/predict/:employeeId', auth, async (req, res) => {
  try {
    // If admin, allow predicting for any employee
    if (req.employee.role === 'admin') {
      const result = await predict(req.params.employeeId);
      return res.json(result);
    }
    
    // Regular employees can only predict for themselves
    if (req.params.employeeId !== req.employee._id.toString()) {
      return res.status(403).json({ error: 'You can only predict for yourself' });
    }
    
    const result = await predict(req.employee._id);
    res.json(result);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to fetch all data (admin only)
app.get('/api/all-data', adminAuth, async (req, res) => {
  try {
    const data = await getAllEmployeesData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;