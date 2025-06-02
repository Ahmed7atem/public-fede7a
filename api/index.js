const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import middleware
const { protect, admin, employee } = require('./middlewares/authMiddleware');

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
  getHealthData2024,
  createHealthData,
  updateHealthData,
  deleteHealthData
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
const uploadRoutes = require('../src/routes/uploadRoutes');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const app = express();

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
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Ensure connection is established before handling requests
const ensureConnection = async (req, res, next) => {
  try {
    if (!mongoose.connection.readyState) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
};

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Root route for testing
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Health routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health check passed' });
});

// Auth routes
app.post('/api/auth/login', login);
app.get('/api/auth/profile', protect, getProfile);
app.put('/api/auth/profile', protect, updateProfile);

// Admin only routes
app.get('/api/health', protect, admin, getAllHealthData);
app.get('/api/health/year/:year', protect, admin, getHealthDataByYear);
app.get('/api/health/2020', protect, admin, getHealthData2020);
app.get('/api/health/2021', protect, admin, getHealthData2021);
app.get('/api/health/2022', protect, admin, getHealthData2022);
app.get('/api/health/2023', protect, admin, getHealthData2023);
app.get('/api/health/2024', protect, admin, getHealthData2024);
app.post('/api/health', protect, admin, createHealthData);
app.put('/api/health/:id', protect, admin, updateHealthData);
app.delete('/api/health/:id', protect, admin, deleteHealthData);

// Employee routes (accessible by both admin and employee)
app.get('/api/health/employee/:employeeId', protect, getHealthDataByEmployeeId);
app.get('/api/employees/:id', protect, getEmployeeById);
app.get('/api/claims/employee/:employeeId', protect, getClaimsByEmployeeId);
app.get('/api/sleep/employee/:employeeId', protect, getSleepDataByEmployeeId);
app.get('/api/wearables/employee/:employeeId', protect, getWearableDataByEmployeeId);
app.get('/api/policies/employee/:employeeId', protect, getPolicyByEmployeeId);
app.get('/api/pre-approvals/employee/:employeeId', protect, getPreApprovalsByEmployeeId);
app.get('/api/feedbacks/employee/:employeeId', protect, getFeedbacksByEmployeeId);
app.get('/api/analytics/employee/:id', protect, getEmployeeAnalytics);
app.get('/api/predictions/employee/:employeeId', protect, getPredictionsByEmployeeId);

// Admin management routes
app.get('/api/employees', protect, admin, getAllEmployees);
app.post('/api/employees', protect, admin, createEmployee);
app.put('/api/employees/:id', protect, admin, updateEmployee);
app.delete('/api/employees/:id', protect, admin, deleteEmployee);

// Claims routes
app.get('/api/claims', protect, admin, getAllClaims);
app.get('/api/claims/:id', protect, admin, getClaimById);
app.post('/api/claims', protect, admin, upload.single('attachment'), createClaim);
app.put('/api/claims/:id', protect, admin, updateClaim);
app.delete('/api/claims/:id', protect, admin, deleteClaim);

// Special claims routes
app.get('/api/claims/special', protect, admin, getSpecialClaims);
app.post('/api/claims/special-claims', protect, upload.array('attachments', 5), createSpecialClaim);
app.get('/api/claims/special/employee/:employeeId', protect, getSpecialClaimsByEmployeeId);

// Year-specific claims routes
app.get('/api/claims/2023', protect, admin, getClaims2023);
app.get('/api/claims/2024', protect, admin, getClaims2024);
app.get('/api/claims/2023/employee/:employeeId', protect, getClaimsByEmployeeId2023);
app.get('/api/claims/2024/employee/:employeeId', protect, getClaimsByEmployeeId2024);
app.get('/api/claims/year/:year', protect, admin, getClaimsByYear);
app.get('/api/claims/year/:year/employee/:employeeId', protect, getEmployeeClaimsByYear);

// Dependents routes
app.get('/api/dependents', protect, admin, getAllDependents);
app.get('/api/dependents/employee/:employeeId', protect, getDependentsByEmployeeId);

// Sleep data routes
app.get('/api/sleep', protect, admin, getAllSleepData);
app.get('/api/sleep/:id', protect, admin, getSleepDataById);
app.post('/api/sleep', protect, admin, createSleepData);
app.put('/api/sleep/:id', protect, admin, updateSleepData);
app.delete('/api/sleep/:id', protect, admin, deleteSleepData);

// Wearable data routes
app.get('/api/wearables', protect, admin, getAllWearableData);
app.post('/api/wearables', protect, admin, createWearableData);
app.put('/api/wearables/:id', protect, admin, updateWearableData);
app.delete('/api/wearables/:id', protect, admin, deleteWearableData);

// Provider routes
app.get('/api/providers', protect, admin, getAllProviders);
app.get('/api/providers/type/:type', protect, admin, getProvidersByType);
app.get('/api/providers/specialty/:specialty', protect, admin, getProvidersBySpecialty);
app.get('/api/providers/:id', protect, admin, getProviderById);
app.post('/api/providers', protect, admin, createProvider);
app.post('/api/providers/:id/reviews', protect, admin, addReview);
app.get('/api/providers/:id/reviews', protect, admin, getProviderReviews);
app.get('/api/providers/categories', protect, admin, getCategories);
app.get('/api/providers/specializations', protect, admin, getSpecializations);

// Policy routes
app.get('/api/policies', protect, admin, getAllPolicies);
app.get('/api/policies/:id', protect, admin, getPolicyById);
app.post('/api/policies', protect, admin, createPolicy);
app.put('/api/policies/:id', protect, admin, updatePolicy);
app.delete('/api/policies/:id', protect, admin, deletePolicy);
app.get('/api/policies/:id/documents', protect, admin, getPolicyDocuments);
app.post('/api/policies/:id/documents', protect, admin, upload.single('document'), uploadPolicyDocument);
app.delete('/api/policies/:id/documents/:documentId', protect, admin, deletePolicyDocument);

// Pre-approval routes
app.get('/api/pre-approvals', protect, admin, getAllPreApprovals);
app.get('/api/pre-approvals/:id', protect, admin, getPreApprovalById);
app.get('/api/pre-approvals/provider/:providerId', protect, admin, getPreApprovalsByProviderId);
app.post('/api/pre-approvals', protect, createPreApproval);
app.put('/api/pre-approvals/:id', protect, admin, updatePreApproval);
app.delete('/api/pre-approvals/:id', protect, admin, deletePreApproval);

// Prediction routes
app.get('/api/predictions', protect, admin, getAllPredictions);
app.get('/api/predictions/:id', protect, admin, getPredictionById);
app.get('/api/predictions/type/:type', protect, admin, getPredictionsByType);
app.post('/api/predictions', protect, admin, createPrediction);

// Feedback routes
app.get('/api/feedbacks', protect, admin, getAllFeedbacks);
app.get('/api/feedbacks/:id', protect, admin, getFeedbackById);
app.post('/api/feedbacks', protect, createFeedback);
app.put('/api/feedbacks/:id', protect, updateFeedback);
app.delete('/api/feedbacks/:id', protect, admin, deleteFeedback);

// Analytics routes
app.get('/api/analytics/organization', protect, admin, getOrganizationAnalytics);
app.get('/api/analytics/health-alerts', protect, admin, getHealthAlerts);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Complaint routes
app.use('/api/complaints', complaintRoutes);

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