const mongoose = require('mongoose');

// Employee Schema - Simplified for basic auth
const employeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Set id as the primary key
employeeSchema.set('id', false);

// Health Data Schema - Basic health metrics
const healthDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  weight: Number,
  height: Number,
  bmi: Number,
  bloodPressure: String,
  recordDate: { type: Date, default: Date.now }
});

// Wearable Data Schema - Essential tracking data
const wearableDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  stepCount: Number,
  heartRate: Number,
  sleepHours: Number,
  recordDate: { type: Date, default: Date.now }
});

// Sleep Data Schema - Sleep metrics
const SleepDataSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  date: { type: Date, required: true },
  sleepDuration: { type: Number, required: true },
  sleepEfficiency: { type: Number, required: true },
  sleepStages: {
    deep: { type: Number, required: true },
    light: { type: Number, required: true },
    rem: { type: Number, required: true },
    awake: { type: Number, required: true }
  },
  heartRate: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    avg: { type: Number, required: true }
  },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

// Prediction Schema - Basic health predictions
const predictionSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  predictionType: { type: String, required: true },
  predictionValue: Number,
  predictedAt: { type: Date, default: Date.now }
});

// Policy Schema - Essential policy information
const policySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'Active' },
  employeeId: { type: String, required: true }
});

// Claim Schema - Basic claim details
const claimSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  provider: { type: String, required: true },
  claimAmount: { type: Number, required: true },
  status: { type: String, default: 'Submitted' }
});

// Provider Schema - Essential provider information
const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { 
    type: String, 
    required: true,
    enum: [
      'Allergist', 'Andrologist', 'Anesthesiologist', 'Audiologist',
      'Cardiologist', 'Cardiothoracic Surgeon', 'Dentist', 'Dermatologist',
      'Endocrinologist', 'ENT Doctor', 'Family Doctor', 'Gastroenterologist',
      'General Surgeon', 'Gynecologist', 'Hematologist', 'Hepatologist',
      'Infertility Specialist', 'Internist', 'Laboratory', 'Nephrologist',
      'Neurologist', 'Neurosurgeon', 'Nutritionist', 'Obesity Surgeon',
      'Oncologist', 'Ophthalmologist', 'Orthopedist', 'Pediatric Surgeon',
      'Pediatrician', 'Phoniater', 'Physiotherapist', 'Plastic Surgeon',
      'Psychiatrist', 'Pulmonologist', 'Rheumatologist', 'Scan Center',
      'Spinal Surgeon', 'Surgical Oncologist', 'Urologist', 'Vascular Surgeon'
    ]
  },
  location: { 
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    years: Number,
    previousHospitals: [String]
  },
  availability: {
    days: [String],
    hours: {
      start: String,
      end: String
    }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Review Schema for providers
const reviewSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  patientId: { type: String, required: true },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  visitDate: Date,
  treatmentType: String,
  waitTime: Number, // in minutes
  staffFriendliness: { type: Number, min: 1, max: 5 },
  facilityCleanliness: { type: Number, min: 1, max: 5 },
  wouldRecommend: Boolean,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create and export models
const Employee = mongoose.model('Employee', employeeSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const WearableData = mongoose.model('WearableData', wearableDataSchema);
const SleepData = mongoose.model('SleepData', SleepDataSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);
const Policy = mongoose.model('Policy', policySchema);
const Claim = mongoose.model('Claim', claimSchema);
const Provider = mongoose.model('Provider', providerSchema);
const Review = mongoose.model('Review', reviewSchema);
const ComplaintTicket = mongoose.model('ComplaintTicket', complaintSchema);

module.exports = {
  Employee,
  HealthData,
  WearableData,
  SleepData,
  Prediction,
  Policy,
  Claim,
  Provider,
  Review,
  ComplaintTicket
}; 