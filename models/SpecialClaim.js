// models/SpecialClaim.js
const mongoose = require('mongoose');

const specialClaimSchema = new mongoose.Schema({
  policyNumber: String,
  policyHolderName: String,
  employeeId: String,
  email: String,
  number: String,
  claimFor: String,
  claimForId: String,
  country: String,
  claimAmount: Number,
  currency: String,
  dateOfTreatment: Date,
  paymentMethod: String,
  bankName: String,
  branchName: String,
  accountNumber: String,
  swiftCode: String,
  iban: String,
  description: String,
  attachments: [{
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileData: String // Base64 encoded file data
  }]
}, {
  timestamps: true,
  collection: 'specialclaims'
});

// Check if the model exists before creating a new one
module.exports = mongoose.models.SpecialClaim || mongoose.model('SpecialClaim', specialClaimSchema);