const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const claimSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  id: { type: String, default: function() { return this._id; } },
  claimId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Processing', 'Denied']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  patient: {
    type: String,
    required: true
  },
  claimAmount: {
    type: Number,
    required: true
  },
  claimDate: {
    type: Date,
    required: true
  },
  patientAge: {
    type: Number,
    required: true
  },
  providerSpecialty: {
    type: String,
    required: true
  },
  patientIncome: {
    type: Number,
    required: true
  },
  patientMaritalStatus: {
    type: String,
    required: true,
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  patientEmploymentStatus: {
    type: String,
    required: true,
    enum: ['Employed', 'Unemployed', 'Self-employed', 'Retired', 'Student']
  },
  claimType: {
    type: String,
    required: true,
    enum: ['Routine', 'Emergency', 'Inpatient', 'Outpatient']
  },
  claimSubmissionMethod: {
    type: String,
    required: true,
    enum: ['Online', 'In-person', 'Mail', 'Fax', 'Paper', 'Phone']
  },
  diagnosisDescription: {
    type: String,
    required: true
  },
  procedureDescription: {
    type: String,
    required: true
  },
  documents: [{
    url: String,
    fileName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Claim', claimSchema); 