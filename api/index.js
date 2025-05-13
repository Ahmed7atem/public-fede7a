const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
require('dotenv').config();

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
  getClaimsByYear,
  getEmployeeClaimsByYear,
  getAllDependents,
  getDependentsByEmployeeId
} = require('../src/controllers/claimController');

const {
  getAllHealthData,
  getHealthDataByEmployeeId,
  getHealthDataByYear
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

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Root route for testing
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Auth routes
app.post('/api/auth/login', login);
app.get('/api/auth/profile', getProfile);
app.put('/api/auth/profile', updateProfile);

// Employee routes
app.get('/api/employees', getAllEmployees);
app.get('/api/employees/:id', getEmployeeById);
app.post('/api/employees', createEmployee);
app.put('/api/employees/:id', updateEmployee);
app.delete('/api/employees/:id', deleteEmployee);

// Health routes
app.get('/api/health', getAllHealthData);
app.get('/api/health/year/:year', getHealthDataByYear);
app.get('/api/health/employee/:employeeId', getHealthDataByEmployeeId);

// Sleep routes
app.get('/api/sleep', getAllSleepData);
app.get('/api/sleep/employee/:employeeId', getSleepDataByEmployeeId);

// Wearable routes
app.get('/api/wearable', getAllWearableData);
app.get('/api/wearable/employee/:employeeId', getWearableDataByEmployeeId);

// Provider routes
app.get('/api/providers', getAllProviders);

// Policy routes
app.get('/api/policies', getAllPolicies);

// Special claims routes
app.get('/api/claims/special', async (req, res) => {
  try {
    const SpecialClaim = require('../models/SpecialClaim');
    const claims = await SpecialClaim.find({});
    res.json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/claims/special/employee/:employeeId', async (req, res) => {
  try {
    const SpecialClaim = require('../models/SpecialClaim');
    const claims = await SpecialClaim.find({ employeeId: req.params.employeeId });
    res.json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/claims/special', upload.array('attachments', 5), async (req, res) => {
  try {
    const SpecialClaim = require('../models/SpecialClaim');
    
    // Create claim with exact data from request
    const claim = new SpecialClaim({
      policyNumber: req.body.policyNumber,
      policyHolderName: req.body.policyHolderName,
      employeeId: req.body.employeeId,
      email: req.body.email,
      number: req.body.number,
      claimFor: req.body.claimFor,
      claimForId: req.body.claimForId,
      country: req.body.country,
      claimAmount: req.body.claimAmount,
      currency: req.body.currency,
      dateOfTreatment: req.body.dateOfTreatment,
      paymentMethod: req.body.paymentMethod,
      bankName: req.body.bankName,
      branchName: req.body.branchName,
      accountNumber: req.body.accountNumber,
      swiftCode: req.body.swiftCode,
      iban: req.body.iban,
      description: req.body.description,
      attachments: req.files || []
    });

    const savedClaim = await claim.save();
    res.status(201).json({ success: true, data: savedClaim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claims routes
app.get('/api/claims', getAllClaims);
app.get('/api/claims/:id', getClaimById);
app.get('/api/claims/employee/:employeeId', getClaimsByEmployeeId);
app.post('/api/claims', upload.single('attachment'), createClaim);
app.put('/api/claims/:id', updateClaim);
app.delete('/api/claims/:id', deleteClaim);

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

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ok', mongodb: dbStatus });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

module.exports = app; 