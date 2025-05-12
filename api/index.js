const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

// Simple auth middleware
const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith('Bearer')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin check middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

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

// Claims routes
app.get('/api/claims', auth, admin, async (req, res) => {
  try {
    const claims = await mongoose.model('Claim').find().limit(10).lean();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
});

app.get('/api/claims/:id', auth, async (req, res) => {
  try {
    const claim = await mongoose.model('Claim').findOne({ patientId: req.params.id }).lean();
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ message: 'Error fetching claim', error: error.message });
  }
});

app.get('/api/claims/employee/:employeeId', auth, async (req, res) => {
  try {
    const claims = await mongoose.model('Claim').find({ patientId: req.params.employeeId }).lean();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching employee claims:', error);
    res.status(500).json({ message: 'Error fetching employee claims', error: error.message });
  }
});

app.post('/api/claims', auth, async (req, res) => {
  try {
    const claim = new mongoose.model('Claim')(req.body);
    const savedClaim = await claim.save();
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ message: 'Error creating claim', error: error.message });
  }
});

app.put('/api/claims/:id', auth, admin, async (req, res) => {
  try {
    const claim = await mongoose.model('Claim').findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ message: 'Error updating claim', error: error.message });
  }
});

app.delete('/api/claims/:id', auth, admin, async (req, res) => {
  try {
    const claim = await mongoose.model('Claim').findByIdAndDelete(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ message: 'Error deleting claim', error: error.message });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ok', mongodb: dbStatus });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
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