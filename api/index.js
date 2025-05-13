const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 1,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  waitQueueTimeoutMS: 10000
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Import controllers
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../src/controllers/employeeController');

const {
  getAllClaims,
  getClaimById,
  getClaimsByEmployeeId,
  createClaim,
  updateClaim,
  deleteClaim,
  getSpecialClaims,
  getSpecialClaimsByEmployeeId,
  getClaimsByYear,
  getEmployeeClaimsByYear,
  createSpecialClaim,
  getAllDependents,
  getDependentsByEmployeeId
} = require('../src/controllers/claimController');

const {
  getAllHealthData,
  getHealthDataByYear,
  getHealthDataByEmployeeId
} = require('../src/controllers/healthController');

const {
  getAllSleepData,
  getSleepDataByEmployeeId
} = require('../src/controllers/sleepController');

const {
  getAllWearableData,
  getWearableDataByEmployeeId
} = require('../src/controllers/wearableController');

const {
  getAllProviders
} = require('../src/controllers/providerController');

const {
  getAllPolicies
} = require('../src/controllers/policyController');

const {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts
} = require('../src/controllers/analyticsController');

const {
  getAllPredictions,
  getPredictionsByEmployeeId,
  getPredictionsByType
} = require('../src/controllers/predictionController');

const {
  login,
  getProfile,
  updateProfile
} = require('../src/controllers/authController');

const {
  getAllComplaints,
  getComplaintById,
  getComplaintsByEmployeeId,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../src/controllers/complaintController');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Health routes
app.get('/api/health', getAllHealthData);
app.get('/api/health/year/:year', getHealthDataByYear);
app.get('/api/health/employee/:employeeId', getHealthDataByEmployeeId);

// Employee routes
app.get('/api/employees', getAllEmployees);
app.get('/api/employees/:id', getEmployeeById);
app.post('/api/employees', createEmployee);
app.put('/api/employees/:id', updateEmployee);
app.delete('/api/employees/:id', deleteEmployee);

// Claim routes
app.get('/api/claims', getAllClaims);
app.get('/api/claims/:id', getClaimById);
app.get('/api/claims/employee/:employeeId', getClaimsByEmployeeId);
app.post('/api/claims', upload.single('attachment'), createClaim);
app.put('/api/claims/:id', updateClaim);
app.delete('/api/claims/:id', deleteClaim);

// Special claims routes
app.get('/api/claims/special', getSpecialClaims);
app.get('/api/claims/special/employee/:employeeId', getSpecialClaimsByEmployeeId);
app.post('/api/claims/special', express.json(), async (req, res) => {
  try {
    console.log('Received special claim data:', req.body);
    
    // Validate required fields
    const requiredFields = ['policyNumber', 'policyHolderName', 'employeeId', 'email', 'number', 'claimFor', 'claimForId', 'country', 'claimAmount', 'currency', 'dateOfTreatment', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Use the SpecialClaim model
    const SpecialClaim = require('../models/SpecialClaim');
    
    // Create and save the claim with only the provided form data
    const specialClaim = new SpecialClaim(req.body);
    const savedClaim = await specialClaim.save();
    
    res.status(201).json({
      success: true,
      message: 'Special claim created successfully',
      data: savedClaim
    });
  } catch (error) {
    console.error('Error creating special claim:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating special claim',
      error: error.message
    });
  }
});

// Claims by year routes
app.get('/api/claims/year/:year', getClaimsByYear);
app.get('/api/claims/employee/:employeeId/year/:year', getEmployeeClaimsByYear);

// Dependent routes
app.get('/api/dependents', getAllDependents);
app.get('/api/dependents/employee/:employeeId', getDependentsByEmployeeId);

// Sleep data routes
app.get('/api/sleep', getAllSleepData);
app.get('/api/sleep/employee/:employeeId', getSleepDataByEmployeeId);

// Wearable data routes
app.get('/api/wearable', getAllWearableData);
app.get('/api/wearable/employee/:employeeId', getWearableDataByEmployeeId);

// Provider routes
app.get('/api/providers', getAllProviders);

// Policy routes
app.get('/api/policies', getAllPolicies);

// Analytics routes
app.get('/api/analytics/employee/:employeeId', getEmployeeAnalytics);
app.get('/api/analytics/organization', getOrganizationAnalytics);
app.get('/api/analytics/alerts', getHealthAlerts);

// Prediction routes
app.get('/api/predictions', getAllPredictions);
app.get('/api/predictions/employee/:employeeId', getPredictionsByEmployeeId);
app.get('/api/predictions/type/:type', getPredictionsByType);

// Auth routes
app.post('/api/auth/login', login);
app.get('/api/auth/profile', getProfile);
app.put('/api/auth/profile', updateProfile);

// Complaint routes
app.get('/api/complaints', getAllComplaints);
app.get('/api/complaints/employee/:employeeId', getComplaintsByEmployeeId);
app.get('/api/complaints/:id', getComplaintById);
app.post('/api/complaints', createComplaint);
app.put('/api/complaints/:id', updateComplaint);
app.delete('/api/complaints/:id', deleteComplaint);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

module.exports = app; 