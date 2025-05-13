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
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

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

// Database connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

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

// Historical Claims routes
app.get('/api/claims/year/:year', getClaimsByYear);
app.get('/api/claims/employee/:employeeId/year/:year', getEmployeeClaimsByYear);

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

// New POST endpoint for predictions with the new format
app.post('/api/predictions', async (req, res) => {
  try {
    const { 
      Patient_ID, 
      Health_Status, 
      Insurance_Consumption, 
      Needs_Insurance_Update, 
      Suggested_Plan, 
      Recommendations, 
      Message 
    } = req.body;

    // Validate required fields
    if (!Patient_ID || !Health_Status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Patient_ID and Health_Status are required'
      });
    }

    // Use the Prediction model
    const { Prediction } = require('../models');

    // Create new prediction using the provided format
    const newPrediction = new Prediction({
      employeeId: Patient_ID,
      predictionType: 'health_status',
      predictionValue: Health_Status,
      confidence: 0.9, // Default confidence
      factors: Recommendations || [],
      // Store the entire original payload in a custom property
      customData: {
        Insurance_Consumption,
        Needs_Insurance_Update,
        Suggested_Plan,
        Message
      }
    });

    // Save the prediction
    const savedPrediction = await newPrediction.save();

    res.status(201).json({
      success: true,
      message: 'Prediction added successfully',
      data: savedPrediction
    });
  } catch (error) {
    console.error('Error adding prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding prediction',
      error: error.message
    });
  }
});

// Analytics routes
app.get('/api/analytics/employee/:employeeId', getEmployeeAnalytics);
app.get('/api/analytics/organization', getOrganizationAnalytics);
app.get('/api/analytics/alerts', getHealthAlerts);

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
  res.status(500).json({
    success: false,
    message: 'Something broke!',
    error: err.message
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app; 