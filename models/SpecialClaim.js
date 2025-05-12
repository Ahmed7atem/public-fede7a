// models/SpecialClaim.js
const mongoose = require('mongoose');

const specialClaimSchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, trim: true },
  policyHolderName: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  number: { type: String, required: true, trim: true },
  claimFor: { type: String, required: true, trim: true },
  claimForId: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  claimAmount: { type: Number, required: true, min: [0, 'Claim amount cannot be negative'] },
  currency: { type: String, required: true, trim: true, enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD'] },
  dateOfTreatment: { type: Date, required: true },
  paymentMethod: { type: String, required: true, trim: true, enum: ['Bank Transfer', 'Cheque', 'Online Payment'] },
  bankName: { type: String, required: true, trim: true },
  branchName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  swiftCode: { type: String, required: true, trim: true },
  iban: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  attachments: [{
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('SpecialClaim', specialClaimSchema);