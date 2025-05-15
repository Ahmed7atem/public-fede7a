const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { protect, admin } = require('../src/middleware/auth');

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
  getDependentsByEmployeeId,
  getSpecialClaims,
  getSpecialClaimsByEmployeeId,
  createSpecialClaim,
  getClaims2023,
  getClaims2024,
  getClaimsByEmployeeId2023,
  getClaimsByEmployeeId2024
} = require('../src/controllers/claimController');

const {
  getAllHealthData,
  getHealthDataByEmployeeId,
  getHealthDataByYear,
  getHealthData2020,
  getHealthData2021,
  getHealthData2022,
  getHealthData2023,
  getHealthData2024
} = require('../src/controllers/healthController');

const {
  getAllSleepData,
  getSleepDataByEmployeeId,
  getSleepDataById,
  createSleepData,
  updateSleepData,
  deleteSleepData
} = require('../src/controllers/sleepController');

const {
  getAllWearableData,
  getWearableDataByEmployeeId,
  createWearableData,
  updateWearableData,
  deleteWearableData
} = require('../src/controllers/wearableController');

const {
  getAllProviders,
  getProvidersByType,
  getProviderById,
  getProvidersBySpecialty,
  createProvider,
  addReview,
  getProviderReviews,
  getCategories,
  getSpecializations
} = require('../src/controllers/providerController');

const {
  getAllPolicies,
  getPolicyById,
  getPolicyByEmployeeId,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicyDocuments,
  uploadPolicyDocument,
  deletePolicyDocument
} = require('../src/controllers/policyController');

const {
  getEmployeeAnalytics,
  getOrganizationAnalytics,
  getHealthAlerts
} = require('../src/controllers/analyticsController');

const {
  getAllPredictions,
  getPredictionsByEmployeeId,
  getPredictionsByType,
  getPredictionById,
  createPrediction
} = require('../src/controllers/predictionController');

const {
  login,
  getProfile,
  updateProfile
} = require('../src/controllers/authController');

const {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByEmployeeId,
  getPreApprovalsByProviderId,
  updatePreApproval,
  deletePreApproval,
  createPreApproval
} = require('../src/controllers/preApprovalController');

const {
  getAllFeedbacks,
  getFeedbackById,
  getFeedbacksByEmployeeId,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require('../src/controllers/feedbackController');

// Import routes
const complaintRoutes = require('../src/routes/complaintRoutes');

const app = express();

// Configure multer for file uploads using memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept all file types for now
    cb(null, true);
  }
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
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
  }
};

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

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

// Health routes
app.get('/api/health', protect, admin, getAllHealthData);
app.get('/api/health/year/:year', protect, admin, getHealthDataByYear);
app.get('/api/health/employee/:employeeId', protect, getHealthDataByEmployeeId);
app.post('/api/health', protect, admin, createHealthData);
app.put('/api/health/:id', protect, admin, updateHealthData);
app.delete('/api/health/:id', protect, admin, deleteHealthData);

// Employee routes
app.get('/api/employees', protect, admin, getAllEmployees);
app.get('/api/employees/:id', protect, getEmployeeById);
app.post('/api/employees', protect, admin, createEmployee);
app.put('/api/employees/:id', protect, admin, updateEmployee);
app.delete('/api/employees/:id', protect, admin, deleteEmployee);

// Claim routes
app.get('/api/claims', protect, admin, getAllClaims);
app.get('/api/claims/:id', protect, getClaimById);
app.get('/api/claims/employee/:employeeId', protect, getClaimsByEmployeeId);
app.post('/api/claims', protect, upload.single('attachment'), createClaim);
app.put('/api/claims/:id', protect, admin, updateClaim);
app.delete('/api/claims/:id', protect, admin, deleteClaim);

// Claims 2023 routes
app.get('/api/claims/2023', protect, admin, getClaims2023);
app.get('/api/claims/2023/employee/:employeeId', protect, getClaimsByEmployeeId2023);

// Claims 2024 routes
app.get('/api/claims/2024', protect, admin, getClaims2024);
app.get('/api/claims/2024/employee/:employeeId', protect, getClaimsByEmployeeId2024);

// Special claims routes
app.get('/api/claims/special', protect, admin, getSpecialClaims);
app.get('/api/claims/special/employee/:employeeId', protect, getSpecialClaimsByEmployeeId);
app.post('/api/claims/special', protect, upload.array('attachments', 5), createSpecialClaim);

// Claims by year routes
app.get('/api/claims/year/:year', protect, admin, getClaimsByYear);
app.get('/api/claims/year/:year/employee/:employeeId', protect, getEmployeeClaimsByYear);

// Dependent routes
app.get('/api/dependents', protect, admin, getAllDependents);
app.get('/api/dependents/employee/:employeeId', protect, getDependentsByEmployeeId);

// Sleep data routes
app.get('/api/sleep', protect, admin, getAllSleepData);
app.get('/api/sleep/employee/:employeeId', protect, getSleepDataByEmployeeId);
app.get('/api/sleep/:id', protect, getSleepDataById);
app.post('/api/sleep', protect, createSleepData);
app.put('/api/sleep/:id', protect, admin, updateSleepData);
app.delete('/api/sleep/:id', protect, admin, deleteSleepData);

// Wearable data routes
app.get('/api/wearables', protect, admin, getAllWearableData);
app.get('/api/wearables/employee/:employeeId', protect, getWearableDataByEmployeeId);
app.post('/api/wearables', protect, createWearableData);
app.put('/api/wearables/:id', protect, admin, updateWearableData);
app.delete('/api/wearables/:id', protect, admin, deleteWearableData);

// Provider routes
app.get('/api/providers', protect, getAllProviders);
app.get('/api/providers/type/:type', protect, getProvidersByType);
app.get('/api/providers/specialty/:specialty', protect, getProvidersBySpecialty);
app.get('/api/providers/:id', protect, getProviderById);
app.post('/api/providers', protect, admin, createProvider);
app.post('/api/providers/:id/reviews', protect, addReview);
app.get('/api/providers/:id/reviews', protect, getProviderReviews);
app.get('/api/providers/categories', protect, getCategories);
app.get('/api/providers/specializations', protect, getSpecializations);

// Policy routes
app.get('/api/policies', protect, admin, getAllPolicies);
app.get('/api/policies/:id', protect, getPolicyById);
app.get('/api/policies/employee/:employeeId', protect, getPolicyByEmployeeId);
app.post('/api/policies', protect, admin, createPolicy);
app.put('/api/policies/:id', protect, admin, updatePolicy);
app.delete('/api/policies/:id', protect, admin, deletePolicy);

// Policy document routes
app.get('/api/policies/documents', protect, getPolicyDocuments);
app.post('/api/policies/documents', protect, admin, upload.single('document'), uploadPolicyDocument);
app.delete('/api/policies/documents/:id', protect, admin, deletePolicyDocument);

// Pre-approval routes
app.get('/api/pre-approvals', protect, admin, getAllPreApprovals);
app.get('/api/pre-approvals/:id', protect, getPreApprovalById);
app.get('/api/pre-approvals/employee/:employeeId', protect, getPreApprovalsByEmployeeId);
app.get('/api/pre-approvals/provider/:providerId', protect, admin, getPreApprovalsByProviderId);
app.post('/api/pre-approvals', protect, createPreApproval);
app.put('/api/pre-approvals/:id', protect, admin, updatePreApproval);
app.delete('/api/pre-approvals/:id', protect, admin, deletePreApproval);

// Feedback routes
app.get('/api/feedbacks', protect, admin, getAllFeedbacks);
app.get('/api/feedbacks/:id', protect, getFeedbackById);
app.get('/api/feedbacks/employee/:employeeId', protect, getFeedbacksByEmployeeId);
app.post('/api/feedbacks', protect, createFeedback);
app.put('/api/feedbacks/:id', protect, updateFeedback);
app.delete('/api/feedbacks/:id', protect, admin, deleteFeedback);

// Auth routes
app.post('/api/auth/login', login);
app.get('/api/auth/profile', protect, getProfile);
app.put('/api/auth/profile', protect, updateProfile);

// Complaint routes
app.use('/api/complaints', complaintRoutes);

// Analytics routes
app.get('/api/analytics/employee/:id', protect, getEmployeeAnalytics);
app.get('/api/analytics/organization', protect, admin, getOrganizationAnalytics);
app.get('/api/analytics/health-alerts', protect, admin, getHealthAlerts);

// Prediction routes
app.get('/api/predictions', protect, admin, getAllPredictions);
app.get('/api/predictions/employee/:employeeId', protect, getPredictionsByEmployeeId);
app.get('/api/predictions/type/:type', protect, getPredictionsByType);
app.get('/api/predictions/:id', protect, getPredictionById);
app.post('/api/predictions', protect, admin, createPrediction);

// Error handling middleware
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