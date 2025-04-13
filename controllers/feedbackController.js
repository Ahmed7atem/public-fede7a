const { Feedback } = require('../models/schemas');
const mongoose = require('mongoose');

// Helper function to convert UUID to ObjectId
const convertToObjectId = (id) => {
  try {
    // If it's already a valid ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(id)) {
      return id;
    }
    
    // If it's a UUID, convert it to a consistent ObjectId
    // We'll use the first 24 characters of the UUID (removing hyphens)
    const uuidWithoutHyphens = id.replace(/-/g, '');
    const objectIdString = uuidWithoutHyphens.substring(0, 24);
    
    // Ensure it's a valid hex string
    if (!/^[0-9a-fA-F]{24}$/.test(objectIdString)) {
      throw new Error('Invalid ID format');
    }
    
    return new mongoose.Types.ObjectId(objectIdString);
  } catch (error) {
    throw new Error(`Invalid ID format: ${error.message}`);
  }
};

exports.createFeedback = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { message, rating } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const objectId = convertToObjectId(req.employee._id);
      const feedback = new Feedback({
        employee: objectId,
        message,
        rating: rating || null,
        submittedAt: new Date(),
        status: 'pending'
      });

      await feedback.save();
      res.status(201).json(feedback);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in createFeedback:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let query = {};
    
    // If not admin, only show their own feedback
    if (req.employee.role !== 'admin') {
      try {
        query.employee = convertToObjectId(req.employee._id);
      } catch (error) {
        return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
      }
    }
    
    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error('Error in getFeedback:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Only admin can update feedback
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    try {
      const feedbackId = convertToObjectId(req.params.id);
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      feedback.status = status;
      await feedback.save();

      res.json(feedback);
    } catch (error) {
      return res.status(400).json({ error: `Invalid feedback ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in updateFeedback:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Only admin can delete feedback
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
      const feedbackId = convertToObjectId(req.params.id);
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      await Feedback.findByIdAndDelete(feedbackId);
      res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: `Invalid feedback ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    res.status(500).json({ error: error.message });
  }
}; 