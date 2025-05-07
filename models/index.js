const mongoose = require('mongoose');
const { 
  Employee, 
  HealthData, 
  WearableData, 
  SleepData, 
  Policy, 
  Claim,
  Doctor,
  Feedback,
  Attachment,
  PolicyDocument,
  Prediction
} = require('./schemas');

// Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  policyNumber: { type: String, required: true },
  // ... existing fields ...
  Age: String,
  Age_Group: String,
  Gender: String,
  Weight_kg: String,
  Height_cm: String,
  BMI: String,
  Children: String,
  Smoker: String,
  Chronic_Disease: String,
  family_medical_history: String,
  Hemoglobin: String,
  Cholesterol: String,
  Blood_Sugar: String,
  Creatinine: String,
  Policy_ID: String,
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
  Insurance_Score: { type: String, default: '0' },
  Smoker_Score: { type: String, default: '0' },
  Family_Score: { type: String, default: '0' },
  Lifestyle_Score: { type: String, default: '0' },
  BMI_Score: { type: String, default: '0' },
  Hemoglobin_Score: { type: String, default: '0' },
  Sugar_Score: { type: String, default: '0' },
  Cholesterol_Score: { type: String, default: '0' },
  Creatinine_Score: { type: String, default: '0' },
  Physical_Score: { type: String, default: '0' },
  Wellness_Score: { type: String, default: '0' }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Employee,
  HealthData,
  WearableData,
  SleepData,
  Policy,
  Claim,
  Doctor,
  Feedback,
  Attachment,
  PolicyDocument,
  Prediction,
  Admin
}; 