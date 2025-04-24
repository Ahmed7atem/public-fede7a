const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  avgRate: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  waitingTime: {
    type: String
  },
  rateCount: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    location: String
  },
  contact: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  insuranceAccepted: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Provider', providerSchema); 