const express = require('express');
const cors = require('cors');
const connectDB = require('../src/config/database');
const requestLogger = require('../src/middlewares/requestLogger');
const errorHandler = require('../src/middlewares/errorHandler');

// Route imports
const employeeRoutes = require('../src/routes/employeeRoutes');
const healthRoutes = require('../src/routes/healthRoutes');
const sleepRoutes = require('../src/routes/sleepRoutes');
const wearableRoutes = require('../src/routes/wearableRoutes');
const authRoutes = require('../src/routes/authRoutes');
const providerRoutes = require('../src/routes/providerRoutes');
const analyticsRoutes = require('../src/routes/analyticsRoutes');
const policyRoutes = require('../src/routes/policyRoutes');
const claimRoutes = require('../src/routes/claimRoutes');
const complaintRoutes = require('../src/routes/complaintRoutes');
const predictionRoutes = require('../src/routes/predictions');
const preApprovalRoutes = require('../src/routes/preApprovalRoutes');
const dependentRoutes = require('../src/routes/dependentRoutes');
const claimsYearRoutes = require('../src/routes/claimsYearRoutes');

// Load environment variables
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Root route for testing
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API information 
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Available API endpoints',
    endpoints: [
      '/api/employees',
      '/api/employees/:id',
      '/api/sleep',
      '/api/sleep/employee/:employeeId',
      '/api/health',
      '/api/health/employee/:employeeId',
      '/api/wearables',
      '/api/wearables/employee/:employeeId',
      '/api/auth',
      '/api/providers',
      '/api/analytics',
      '/api/policies',
      '/api/claims',
      '/api/complaints',
      '/api/pre-approvals',
      '/api/dependents'
    ]
  });
});

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/wearables', wearableRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/claims', claimsYearRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/pre-approvals', preApprovalRoutes);
app.use('/api/dependents', dependentRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    let collections = [];
    let collectionStats = {};
    
    if (dbStatus === 'connected') {
      collections = (await mongoose.connection.db.collections())
        .map(c => c.collectionName);
      
      // Get count of documents in main collections
      const { Employee, SleepData, HealthData, WearableData, Admin } = require('../models');
      
      if (collections.includes('employees')) {
        collectionStats.employees = await Employee.countDocuments();
      }
      
      if (collections.includes('sleepdatas')) {
        collectionStats.sleep = await SleepData.countDocuments();
      }
      
      if (collections.includes('healthdatas')) {
        collectionStats.health = await HealthData.countDocuments();
      }
      
      if (collections.includes('wearabledatas')) {
        collectionStats.wearables = await WearableData.countDocuments();
      }

      if (collections.includes('admins')) {
        collectionStats.admins = await Admin.countDocuments();
      }
    }
    
    res.json({
      status: 'ok',
      mongodb: dbStatus,
      collections: collections,
      documentCounts: collectionStats
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Connect to MongoDB
connectDB();

// Export the Express API
module.exports = app; 