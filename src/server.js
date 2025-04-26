const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const employeeRoutes = require('./routes/employeeRoutes');
const healthRoutes = require('./routes/healthRoutes');
const sleepRoutes = require('./routes/sleepRoutes');
const wearableRoutes = require('./routes/wearableRoutes');
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const predictionRoutes = require('./routes/predictions');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
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
      '/api/complaints'
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
app.use('/api/complaints', complaintRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let collections = [];
  let collectionStats = {};
  
  if (dbStatus === 'connected') {
    try {
      collections = (await mongoose.connection.db.collections())
        .map(c => c.collectionName);
      
      // Get count of documents in main collections
      const { Employee, SleepData, HealthData, WearableData } = require('../models');
      
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
    } catch (error) {
      console.error('Error fetching DB info:', error);
    }
  }
  
  res.json({
    status: 'ok',
    mongodb: dbStatus,
    collections: collections,
    documentCounts: collectionStats
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 