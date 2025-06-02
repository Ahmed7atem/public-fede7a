const mongoose = require('mongoose');

const complaintTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
  },
  subject: String,
  category: String,
  description: String,
  employeeId: String,
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    fileData: String
  }]
}, { 
  timestamps: true,
  collection: 'complainttickets'
});

// Update the updatedAt timestamp and generate ticketId before saving
complaintTicketSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Generate ticketId if it doesn't exist
  if (!this.ticketId) {
    // Format: COMP-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.ticketId = `COMP-${dateStr}-${randomPart}`;
    
    // Check if this ticketId already exists and regenerate if needed
    try {
      const existingTicket = await mongoose.model('ComplaintTicket').findOne({ ticketId: this.ticketId });
      if (existingTicket) {
        // If exists, regenerate with a different random number
        const newRandomPart = Math.floor(1000 + Math.random() * 9000);
        this.ticketId = `COMP-${dateStr}-${newRandomPart}`;
      }
    } catch (error) {
      // If there's an error checking for duplicates, continue anyway
      console.error('Error checking for duplicate ticketId:', error);
    }
  }
  
  next();
});

module.exports = mongoose.models.ComplaintTicket || mongoose.model('ComplaintTicket', complaintTicketSchema); 