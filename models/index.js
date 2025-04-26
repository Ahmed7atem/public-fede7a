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
  Prediction
}; 