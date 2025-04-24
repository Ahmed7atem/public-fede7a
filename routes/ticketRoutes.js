const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

// POST /api/tickets - Create a support ticket with file uploads
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { subject, category, description } = req.body;
    
    // Get uploaded files
    const attachments = req.files ? req.files.map(file => ({
      url: `/api/files/${file.filename}`,
      fileName: file.originalname,
      uploadDate: new Date()
    })) : [];
    
    const ticket = new Ticket({
      subject,
      category,
      description,
      createdBy: req.user._id,
      attachments
    });
    
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
});

// GET /api/tickets - List user's tickets
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
      
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Error handling middleware for file uploads
router.use(handleUploadError);

module.exports = router; 