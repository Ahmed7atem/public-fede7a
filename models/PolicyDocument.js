const mongoose = require('mongoose');

const policyDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Table of benefits', 'Benefit Guide', 'Insurance Certificate', 'Membership Card', 'Additional information', 'Treatment Guarantee Form']
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('PolicyDocument', policyDocumentSchema); 