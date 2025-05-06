const mongoose = require('mongoose');

// Employee Schema - Based on actual data in MongoDB
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  Age: String,
  Age_Group: String,
  Gender: String,
  Weight_kg: String,
  Height_cm: String,
  BMI: String,
  Children: String,
  Smoker: String,
  Chronic_Disease: String,
  Chronic_diseases_count: String,
  family_medical_history: String,
  Hemoglobin: String,
  Cholesterol: String,
  Blood_Sugar: String,
  Creatinine: String,
  Policy_ID: String,
  policyNumber: String,
  Plan_Name: String,
  Coverage_Details: String,
  Start_Date: String,
  End_Date: String,
  Claimed_Amount: String,
  Department: String,
  Education: String,
  Recruitment_Channel: String,
  No_of_Trainings: String,
  Previous_Year_Rating: String,
  Length_of_Service: String,
  KPIs_Met_80: String,
  Avg_Training_Score: String,
  Insurance_Score: String,
  Smoker_Score: String,
  Family_Score: String,
  Lifestyle_Score: String,
  BMI_Score: String,
  Hemoglobin_Score: String,
  Sugar_Score: String,
  Cholesterol_Score: String,
  Creatinine_Score: String,
  Physical_Score: String,
  Wellness_Score: String,
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Health Data Schema - Based on actual MongoDB structure
const healthDataSchema = new mongoose.Schema({
  employee: { type: String, required: true }, // Reference to employee UUID
  recordedAt: { type: Date, default: Date.now },
  weight: Number,
  height: Number,
  bmi: Number,
  hemoglobin: Number,
  cholesterol: Number,
  bloodSugar: Number, 
  creatinine: Number,
  chronicDisease: String,
  chronicDiseaseCount: Number,
  familyMedicalHistory: String,
  claimedAmount: Number,
  insuranceScore: Number,
  smokerScore: Number,
  familyScore: Number,
  lifestyleScore: Number,
  bmiScore: Number,
  hemoglobinScore: Number,
  sugarScore: Number,
  cholesterolScore: Number,
  creatinineScore: Number,
  physicalScore: Number,
  wellnessScore: Number,
  version: String,
  policy: Object
}, { timestamps: true });

// Wearable Data Schema - Based on actual MongoDB structure
const wearableDataSchema = new mongoose.Schema({
  employee: { type: String, required: true }, // Reference to employee UUID
  date: { type: Date, required: true },
  activeEnergy: Number,
  exerciseTime: Number,
  standHours: Number,
  standTime: Number,
  environmentalAudioExposure: Number,
  flightsClimbed: Number,
  headphoneAudioExposure: Number,
  heartRateMin: Number,
  heartRateMax: Number,
  heartRateAvg: Number,
  heartRateVariability: Number,
  physicalEffort: Number,
  restingEnergy: Number,
  restingHeartRate: Number,
  stepCount: Number,
  walkingRunningDistance: Number,
  walkingHeartRateAvg: Number,
  walkingSpeed: Number,
  walkingStepLength: Number,
  version: String
}, { timestamps: true });

// Sleep Data Schema - Based on actual MongoDB structure
const sleepDataSchema = new mongoose.Schema({
  employee: { type: String, required: true }, // Reference to employee UUID
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  sleepQuality: { type: Number, required: true },
  timeInBed: { type: Number, required: true },
  sleepNotes: { type: Array, default: [] },
  heartRate: { type: Number },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Prediction Schema - Based on actual MongoDB structure
const predictionSchema = new mongoose.Schema({
  employeeId: { type: String, required: true }, // Reference to employee UUID
  predictedAt: { type: Date, default: Date.now },
  predictionType: { type: String, required: true },
  predictionValue: { type: String, required: true },
  confidence: { type: Number, required: true },
  factors: { type: Array, default: [] }
}, { timestamps: true });

// Policy Schema - Based on expected structure (though collection is empty)
const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  policyNumber: { type: String, required: true },
  type: { type: String, required: true },
  coverage: { type: Object, required: true },
  premium: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  employeeId: { type: String, required: true }
}, { timestamps: true });

// Claim Schema - Based on actual MongoDB structure
const claimSchema = new mongoose.Schema({
  id: { type: String, required: true },
  patientId: { type: String, required: true },
  providerType: { 
    type: String, 
    required: true,
    enum: ['Hospital', 'Clinic', 'Labs', 'Other']
  },
  claimDescription: { type: String, required: true },
  documents: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    required: true,
    enum: ['Pending', 'Approved', 'Denied', 'Processing'],
    default: 'Pending'
  },
  processedAt: Date,
  processedBy: String,
  notes: String
}, { timestamps: true });

// Pre-approval Claim Schema
const preApprovalClaimSchema = new mongoose.Schema({
  id: { type: String, required: true },
  patientId: { type: String, required: true },
  providerType: { 
    type: String, 
    required: true,
    enum: ['Hospital', 'Clinic', 'Labs']
  },
  category: { type: String, required: true },
  appointmentDateTime: { type: Date, required: true },
  documents: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  }],
  additionalDetails: String,
  status: { 
    type: String, 
    required: true,
    enum: ['Pending', 'Approved', 'Denied'],
    default: 'Pending'
  },
  processedAt: Date,
  processedBy: String,
  notes: String
}, { timestamps: true });

// Doctor Schema - Based on actual MongoDB structure
const doctorSchema = new mongoose.Schema({
  specialization: { type: String, required: true },
  fees: { type: String, required: true },
  avg_rate: { type: Number, required: true },
  waiting_time: { type: String, required: true },
  clinic_location: { type: String, required: true },
  rate_count: { type: Number, required: true }
});

// Feedback Schema - Based on actual MongoDB structure
const feedbackSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, required: true },
  submittedAt: { type: Date, required: true },
  status: { type: String, required: true }
}, { timestamps: true });

// Attachment Schema - Based on actual MongoDB structure
const attachmentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  type: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String },
  uploadDate: { type: Date, default: Date.now }
});

// Policy Document Schema - Based on actual MongoDB structure
const policyDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  uploadDate: { type: Date, default: Date.now }
});

// Register models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);
const SleepData = mongoose.model('SleepData', sleepDataSchema);
const Policy = mongoose.model('Policy', policySchema);
const Claim = mongoose.model('Claim', claimSchema);
const PreApprovalClaim = mongoose.model('PreApprovalClaim', preApprovalClaimSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const Attachment = mongoose.model('Attachment', attachmentSchema);
const PolicyDocument = mongoose.model('PolicyDocument', policyDocumentSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = {
  Employee,
  HealthData,
  WearableData,
  SleepData,
  Policy,
  Claim,
  PreApprovalClaim,
  Doctor,
  Feedback,
  Attachment,
  PolicyDocument,
  Prediction
}; 