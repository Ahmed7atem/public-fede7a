const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

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
  avgTrainingScore: { type: Number }
}, { timestamps: true });

// Health Data Schema
const healthDataSchema = new mongoose.Schema({
  employee: { type: String, ref: 'Employee', required: true },
  recordedAt: { type: Date, required: true },
  weight: { type: Number },
  height: { type: Number },
  bmi: { type: Number },
  hemoglobin: { type: Number },
  cholesterol: { type: Number },
  bloodSugar: { type: Number },
  creatinine: { type: Number },
  chronicDisease: String,
  chronicDiseaseCount: { type: Number },
  familyMedicalHistory: String,
  claimedAmount: { type: Number },
  insuranceScore: { type: Number },
  smokerScore: { type: Number },
  familyScore: { type: Number },
  lifestyleScore: { type: Number },
  bmiScore: { type: Number },
  hemoglobinScore: { type: Number },
  sugarScore: { type: Number },
  cholesterolScore: { type: Number },
  creatinineScore: { type: Number },
  physicalScore: { type: Number },
  wellnessScore: { type: Number }
}, { timestamps: true });

// Wearable Data Schema
const wearableDataSchema = new mongoose.Schema({
  employee: { type: String, ref: 'Employee', required: true },
  logDate: { type: Date, required: true },
  stepCount: { type: Number },
  activeEnergyKj: { type: Number },
  exerciseTimeMin: { type: Number },
  standHours: { type: Number },
  standTimeMin: { type: Number },
  envAudioExposure: { type: Number },
  flightsClimbed: { type: Number },
  headphoneAudioExposure: { type: Number },
  heartRateMin: { type: Number },
  heartRateMax: { type: Number },
  heartRateAvg: { type: Number },
  heartRateVariability: { type: Number },
  physicalEffortMet: { type: Number },
  restingEnergyKj: { type: Number },
  restingHeartRate: { type: Number },
  walkingRunningDistanceKm: { type: Number },
  walkingHeartRateAvg: { type: Number },
  walkingSpeedKmh: { type: Number },
  walkingStepLengthCm: { type: Number },
  sleepStart: { type: String },
  sleepEnd: { type: String },
  sleepQuality: { type: Number },
  timeInBed: { type: Number },
  heartRateSleep: { type: Number },
  notes: String
}, { timestamps: true });

// Prediction Schema
const predictionSchema = new mongoose.Schema({
  employee: { type: String, ref: 'Employee', required: true },
  predictedAt: { type: Date, required: true },
  predictionType: { type: String, required: true },
  predictionValue: { type: mongoose.Schema.Types.Mixed, required: true },
  confidence: { type: Number },
  factors: [String],
  notes: String
}, { timestamps: true });

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  employee: { type: String, ref: 'Employee', required: true },
  message: { type: String, required: true },
  rating: { type: Number },
  submittedAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
}, { timestamps: true });

// Policy Document Schema
const policyDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const PolicyDocument = mongoose.model('PolicyDocument', policyDocumentSchema);

module.exports = {
  Employee,
  HealthData,
  WearableData,
  Prediction,
  Feedback,
  PolicyDocument
}; 