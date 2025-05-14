// models/SpecialClaim.js
const mongoose = require('mongoose');

const specialClaimSchema = new mongoose.Schema({
  policyNumber: { type: String, required: true },
  policyHolderName: { type: String, required: true },
  employeeId: { type: String, required: true },
  email: { type: String, required: true },
  number: { type: String, required: true },
  claimFor: { type: String, required: true },
  claimForId: { type: String, required: true },
  country: { type: String, required: true },
  claimAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  dateOfTreatment: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
  bankName: { type: String },
  branchName: { type: String },
  accountNumber: { type: String },
  swiftCode: { type: String },
  iban: { type: String },
  description: { type: String, required: true },
  attachments: [{
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileData: { type: String, required: true } // Base64 encoded file data
  }]
}, {
  timestamps: true,
  collection: 'specialclaims'
});

// Check if the model exists before creating a new one
module.exports = mongoose.models.SpecialClaim || mongoose.model('SpecialClaim', specialClaimSchema);