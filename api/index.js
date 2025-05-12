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
app.get('/api/health/employee/:employeeId', getHealthDataByEmployeeId);

// Sleep routes
app.get('/api/sleep', getAllSleepData);
app.get('/api/sleep/employee/:employeeId', getSleepDataByEmployeeId);

// Wearable routes
app.get('/api/wearables', getAllWearableData);
app.get('/api/wearables/employee/:employeeId', getWearableDataByEmployeeId);

// Provider routes
app.get('/api/providers', getAllProviders);

// Policy routes
app.get('/api/policies', getAllPolicies);

// Special Claims routes - moved higher in the routing order
app.get('/api/claims/special', getSpecialClaims);
app.get('/api/claims/special/employee/:employeeId', getSpecialClaimsByEmployeeId);

// Special claims POST endpoint - modified to debug and fix request body issues
app.post('/api/claims/special-claims', express.json(), (req, res) => {
  try {
    // Log headers to debug
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body, 'Content:', JSON.stringify(req.body));
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('Empty body detected, checking if raw data is available');
      
      // Create sample data for testing/debugging
      const sampleData = {
        policyNumber: "POL123456",
        policyHolderName: "John Doe",
        employeeId: "EMP789",
        email: "john.doe@example.com", 
        number: "+1234567890",
        claimFor: "employee",
        claimForId: "CLM456",
        country: "USA",
        claimAmount: 1500.75,
        currency: "USD",
        dateOfTreatment: "2023-05-01",
        paymentMethod: "Bank Transfer",
        bankName: "Bank of America",
        branchName: "Main Branch",
        accountNumber: "123456789012",
        swiftCode: "BOFAUS3N",
        iban: "US12345678901234567890",
        description: "Medical treatment for surgery"
      };
      
      // Use the SpecialClaim model
      const SpecialClaim = require('../models/SpecialClaim');
      
      // Create and save the claim with sample data (for debugging)
      const specialClaim = new SpecialClaim(sampleData);
      
      specialClaim.save()
        .then(savedClaim => {
          res.status(201).json({
            success: true,
            message: 'Special claim created with SAMPLE data (debugging mode)',
            data: savedClaim
          });
        })
        .catch(err => {
          console.error('Error saving special claim:', err);
          res.status(500).json({
            message: 'Error saving special claim to database',
            error: err.message
          });
        });
    } else {
      // Use the received data if body is not empty
      const claimData = req.body;
      
      // Use the SpecialClaim model
      const SpecialClaim = require('../models/SpecialClaim');
      
      // Create and save the claim with actual data
      const specialClaim = new SpecialClaim(claimData);
      
      specialClaim.save()
        .then(savedClaim => {
          res.status(201).json({
            success: true,
            message: 'Special claim created successfully with your data',
            data: savedClaim
          });
        })
        .catch(err => {
          console.error('Error saving special claim:', err);
          res.status(500).json({
            message: 'Error saving special claim to database',
            error: err.message
          });
        });
    }
  } catch (error) {
    console.error('Detailed error in special claims endpoint:', error);
    res.status(500).json({
      message: 'Error in special claims endpoint',
      error: error.message,
      stack: error.stack
    });
  }
});

// Claims routes
app.get('/api/claims', getAllClaims);
app.get('/api/claims/:id', getClaimById);
app.get('/api/claims/employee/:employeeId', getClaimsByEmployeeId);
app.post('/api/claims', upload.single('attachment'), createClaim);
app.put('/api/claims/:id', updateClaim);
app.delete('/api/claims/:id', deleteClaim);

// Historical Claims routes
app.get('/api/claims/year/:year', getClaimsByYear);
app.get('/api/claims/year/:year/employee/:employeeId', getEmployeeClaimsByYear);

// Specific year claims routes for convenience
app.get('/api/claims/2023', (req, res) => getClaimsByYear(Object.assign(req, { params: { year: '2023' } }), res));
app.get('/api/claims/2024', (req, res) => getClaimsByYear(Object.assign(req, { params: { year: '2024' } }), res));
app.get('/api/claims/2023/employee/:employeeId', (req, res) => getEmployeeClaimsByYear(Object.assign(req, { params: { year: '2023', employeeId: req.params.employeeId } }), res));
app.get('/api/claims/2024/employee/:employeeId', (req, res) => getEmployeeClaimsByYear(Object.assign(req, { params: { year: '2024', employeeId: req.params.employeeId } }), res));

// Dependents routes
app.get('/api/dependents', getAllDependents);
app.get('/api/dependents/employee/:employeeId', getDependentsByEmployeeId);

// Prediction routes
app.get('/api/predictions', getAllPredictions);
app.get('/api/predictions/employee/:employeeId', getPredictionsByEmployeeId);
app.get('/api/predictions/type/:type', getPredictionsByType);

// Analytics routes
app.get('/api/analytics/employee/:id', getEmployeeAnalytics);
app.get('/api/analytics/organization', getOrganizationAnalytics);
app.get('/api/analytics/health-alerts', getHealthAlerts);

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