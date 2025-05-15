const mongoose = require('mongoose');

const complaintTicketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
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
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }]
}, { 
  timestamps: true,
  collection: 'complainttickets'
});

// Update the updatedAt timestamp before saving
complaintTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.ComplaintTicket || mongoose.model('ComplaintTicket', complaintTicketSchema); 