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
  deletePolicy
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

const {
  getAllPreApprovals,
  getPreApprovalById,
  getPreApprovalsByEmployeeId,
  getPreApprovalsByProviderId,
  updatePreApprovalStatus,
  deletePreApproval
} = require('../src/controllers/preApprovalController');

const {
  getAllFeedbacks,
  getFeedbackById,
  getFeedbacksByEmployeeId,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require('../src/controllers/feedbackController');

const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage();
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
    
    // Process uploaded files
    const processedAttachments = (req.files || []).map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date()
    }));

    // Create claim with processed attachments
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
      attachments: processedAttachments
    });

    const savedClaim = await claim.save();
    res.status(201).json({ success: true, data: savedClaim });
  } catch (error) {
    console.error('Error creating special claim:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Claims by year routes
app.get('/api/claims/year/:year', getClaimsByYear);
app.get('/api/claims/employee/:employeeId/year/:year', getEmployeeClaimsByYear);

// Specific year claims routes for convenience
app.get('/api/claims/2023', (req, res) => getClaimsByYear(Object.assign(req, { params: { year: '2023' } }), res));
app.get('/api/claims/2024', (req, res) => getClaimsByYear(Object.assign(req, { params: { year: '2024' } }), res));
app.get('/api/claims/2023/employee/:employeeId', (req, res) => getEmployeeClaimsByYear(Object.assign(req, { params: { year: '2023', employeeId: req.params.employeeId } }), res));
app.get('/api/claims/2024/employee/:employeeId', (req, res) => getEmployeeClaimsByYear(Object.assign(req, { params: { year: '2024', employeeId: req.params.employeeId } }), res));

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
app.get('/api/providers/type/:type', getProvidersByType);
app.get('/api/providers/:id', getProviderById);
app.get('/api/providers/specialty/:specialty', getProvidersBySpecialty);
app.post('/api/providers', createProvider);
app.post('/api/providers/:id/reviews', addReview);
app.get('/api/providers/:id/reviews', getProviderReviews);
app.get('/api/providers/categories', getCategories);
app.get('/api/providers/specializations', getSpecializations);

// Policy routes
app.get('/api/policies', getAllPolicies);
app.get('/api/policies/:id', getPolicyById);
app.get('/api/policies/employee/:employeeId', getPolicyByEmployeeId);
app.post('/api/policies', createPolicy);
app.put('/api/policies/:id', updatePolicy);
app.delete('/api/policies/:id', deletePolicy);

// Analytics routes
app.get('/api/analytics/employee/:employeeId', getEmployeeAnalytics);
app.get('/api/analytics/organization', getOrganizationAnalytics);
app.get('/api/analytics/alerts', getHealthAlerts);

// Prediction routes
app.get('/api/predictions', getAllPredictions);
app.get('/api/predictions/employee/:employeeId', getPredictionsByEmployeeId);
app.get('/api/predictions/type/:type', getPredictionsByType);

// Pre-approval routes
app.get('/api/preapprovals', getAllPreApprovals);
app.get('/api/preapprovals/:id', getPreApprovalById);
app.get('/api/preapprovals/employee/:employeeId', getPreApprovalsByEmployeeId);
app.post('/api/preapprovals', createPreApproval);
app.put('/api/preapprovals/:id', updatePreApproval);
app.delete('/api/preapprovals/:id', deletePreApproval);

// Feedback routes
app.get('/api/feedbacks', getAllFeedbacks);
app.get('/api/feedbacks/:id', getFeedbackById);
app.get('/api/feedbacks/employee/:employeeId', getFeedbacksByEmployeeId);
app.post('/api/feedbacks', createFeedback);
app.put('/api/feedbacks/:id', updateFeedback);
app.delete('/api/feedbacks/:id', deleteFeedback);

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