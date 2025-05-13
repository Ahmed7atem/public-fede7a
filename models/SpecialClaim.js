// models/SpecialClaim.js
const mongoose = require('mongoose');

const specialClaimSchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    required: true
  },
  policyHolderName: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  claimFor: {
    type: String,
    required: true
  },
  claimForId: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  claimAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  dateOfTreatment: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  swiftCode: {
    type: String,
    required: true
  },
  iban: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware to update updatedAt
specialClaimSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if the model exists before creating a new one
module.exports = mongoose.models.SpecialClaim || mongoose.model('SpecialClaim', specialClaimSchema);