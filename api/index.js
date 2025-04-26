const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API root route
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API endpoints available',
    endpoints: [
      '/api/auth',
      '/api/employees',
      '/api/health',
      '/api/wearables',
      '/api/sleep',
      '/api/policies',
      '/api/claims',
      '/api/providers',
      '/api/analytics',
      '/api/complaints'
    ]
  });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('MongoDB connected');
  
  // Test the connection by trying to get the collections
  const collections = await mongoose.connection.db.collections();
  console.log('Available collections:', collections.map(c => c.collectionName));

  // Test querying the employees collection
  const employeesCollection = mongoose.connection.db.collection('employees');
  const employeeCount = await employeesCollection.countDocuments();
  console.log('Total employees in database:', employeeCount);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import routes and controllers directly
console.log('Setting up routes...');
const authController = require('../controllers/authController');
const employeeRoutes = require('../routes/employeeRoutes');
const healthDataController = require('../controllers/healthDataController');
const wearableController = require('../controllers/wearableController');
const sleepDataController = require('../controllers/sleepDataController');
const policyController = require('../controllers/policyController');
const claimController = require('../controllers/claimController');
const providerController = require('../controllers/providerController');
const analyticsController = require('../controllers/analyticsController');
const complaintController = require('../controllers/complaintController');

// Routes
app.use('/api/auth', authController);
app.use('/api/employees', employeeRoutes);
app.use('/api/health', healthDataController);
app.use('/api/wearables', wearableController);
app.use('/api/sleep', sleepDataController);
app.use('/api/policies', policyController);
app.use('/api/claims', claimController);
app.use('/api/providers', providerController);
app.use('/api/analytics', analyticsController);
app.use('/api/complaints', complaintController);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;