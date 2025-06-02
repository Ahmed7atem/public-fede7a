const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Hospital', 'Clinic', 'Labs', 'Other']
  },
  specialization: { type: String, required: true },
  category: { type: String, required: true },
  city: { type: String, required: true },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: { type: String, required: true },
  availability: [{
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true 
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],
  experienceYears: { type: Number, required: true },
  fees: { type: Number, required: true },
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isInNetwork: { type: Boolean, default: true },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String
  },
  reviews: [{
    userId: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Create a single 2dsphere index for location-based queries
providerSchema.index({ coordinates: '2dsphere' });

// Check if the model exists before creating a new one
module.exports = mongoose.models.Provider || mongoose.model('Provider', providerSchema); 