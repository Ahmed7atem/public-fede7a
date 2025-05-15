const mongoose = require('mongoose');

const complaintTicketSchema = new mongoose.Schema({
  providerType: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  attachment: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }
}, { 
  timestamps: true,
  collection: 'complainttickets'  // Explicitly set the collection name
});

// Update the updatedAt timestamp before saving
complaintTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.ComplaintTicket || mongoose.model('ComplaintTicket', complaintTicketSchema); 