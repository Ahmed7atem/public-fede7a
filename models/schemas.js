const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Employee Schema
const employeeSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  id: { type: String, default: function() { return this._id; } },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  ageGroup: { type: String, required: true },
  gender: { type: String, required: true },
  password: { type: String, required: true },
  children: { type: Number, required: true, default: 0 },
  smoker: { type: Boolean, required: true, default: false },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  planName: { type: String },
  coverageDetails: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  department: { type: String },
  education: { type: String },
  recruitmentChannel: { type: String },
  noOfTrainings: { type: Number },
  previousYearRating: { type: Number },
  lengthOfService: { type: Number },
  kpisMet80: { type: Boolean },
  avgTrainingScore: { type: Number },
  version: { type: String, default: '1.0' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Ensure id and _id are always in sync
employeeSchema.pre('save', function(next) {
  if (this.isModified('_id')) {
    this.id = this._id;
  }
  next();
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

// Health Data Schema
const healthDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  recordedAt: Date,
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
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Sleep Data Schema
const sleepDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  startTime: Date,
  endTime: Date,
  sleepQuality: Number,
  timeInBed: Number,
  sleepNotes: [String],
  heartRate: Number,
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Wearable Data Schema
const wearableDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  logDate: Date,
  stepCount: Number,
  activeEnergy: Number,
  exerciseTime: Number,
  heartRate: Number,
  heartRateVariability: Number,
  sleepQuality: Number,
  timeInBed: Number,
  walkingDistance: Number,
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Prediction Schema
const predictionSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  predictionType: { type: String, enum: ['health', 'wellness', 'risk'], required: true },
  healthData: {
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    systolic: { type: Number, required: true },
    diastolic: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
    bloodSugar: { type: Number, required: true },
    smoker: { type: Boolean, required: true },
    age: { type: Number, required: true },
    chronicDisease: { type: String, required: true },
    chronicDiseaseCount: { type: Number, required: true },
    familyMedicalHistory: { type: String, required: true },
    sleepHours: { type: Number, required: true },
    exerciseHours: { type: Number, required: true },
    stressLevel: { type: Number, required: true },
    smokingStatus: { type: Boolean, required: true },
    alcoholConsumption: { type: Number, required: true }
  },
  predictionValue: Number,
  predictedAt: { type: Date, default: Date.now },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Policy Schema
const policySchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  policyNumber: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  policyType: { type: String, enum: ['Gold', 'Silver', 'Bronze', 'Platinum'], required: true },
  status: { type: String, enum: ['Active', 'Suspended', 'Inactive'], default: 'Active' },
  startDate: { type: Date, required: true },
  renewalDate: { type: Date, required: true },
  areaOfCover: { type: String, required: true },
  healthcarePlans: [{ type: String }],
  employeeId: { type: String, required: true },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Policy Document Schema
const policyDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['table-of-benefits', 'benefit-guide', 'insurance-certificate', 
           'membership-card', 'treatment-guarantee-form', 'additional-information'], 
    required: true 
  },
  policyId: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'application/pdf' },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Claim Schema
const claimSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  claimId: { type: String, unique: true, default: () => `CLM-${Date.now().toString().slice(-6)}` },
  status: { 
    type: String, 
    enum: ['Submitted', 'In Review', 'Approved', 'Rejected', 'Additional Information Required'], 
    default: 'Submitted' 
  },
  employeeId: { type: String, required: true, ref: 'Employee' },
  provider: { type: String, required: true },
  patient: { type: String, required: true },
  claimAmount: { type: Number, required: true },
  claimDate: { type: Date, default: Date.now },
  patientAge: { type: Number },
  providerSpecialty: { type: String },
  patientIncome: { type: Number },
  patientMaritalStatus: { type: String },
  patientEmploymentStatus: { type: String },
  claimType: { type: String },
  claimSubmissionMethod: { type: String, default: 'Online' },
  diagnosisDescription: { type: String },
  procedureDescription: { type: String },
  documents: [{ type: String }],
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Provider Schema
const providerSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true },
  type: { type: String, enum: ['Hospital', 'Clinic', 'Labs'], required: true },
  category: { type: String, required: true },
  location: { 
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  availability: {
    days: [{ type: String }],
    hours: { type: String }
  },
  ratings: { type: Number, default: 0 },
  experienceYears: { type: Number },
  contactInformation: {
    phone: { type: String },
    email: { type: String },
    website: { type: String }
  },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Complaint Ticket Schema
const complaintTicketSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  ticketId: { type: String, unique: true, default: () => `TKT-${Date.now().toString().slice(-6)}` },
  subject: { type: String, required: true },
  category: { type: String, enum: ['Claim', 'Policy', 'Others'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  attachments: [{ type: String }],
  employeeId: { type: String, required: true, ref: 'Employee' },
  submitDate: { type: Date, default: Date.now },
  responseNotes: [{ 
    text: { type: String },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Create models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const SleepData = mongoose.model('SleepData', sleepDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);
const Policy = mongoose.model('Policy', policySchema);
const PolicyDocument = mongoose.model('PolicyDocument', policyDocumentSchema);
const Claim = mongoose.model('Claim', claimSchema);
const Provider = mongoose.model('Provider', providerSchema);
const ComplaintTicket = mongoose.model('ComplaintTicket', complaintTicketSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = {
  Employee,
  HealthData,
  SleepData,
  WearableData,
  Prediction,
  Policy,
  PolicyDocument,
  Claim,
  Provider,
  ComplaintTicket,
  Feedback
}; 