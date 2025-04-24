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

// Policy Document Schema
const policyDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ['pending', 'resolved', 'closed'], default: 'pending' },
  response: String,
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const SleepData = mongoose.model('SleepData', sleepDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);
const PolicyDocument = mongoose.model('PolicyDocument', policyDocumentSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = {
  Employee,
  HealthData,
  SleepData,
  WearableData,
  Prediction,
  PolicyDocument,
  Feedback
}; 