const mongoose = require('mongoose');

// Define the feedback schema
const feedbackSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
  type: { type: String, enum: ['service', 'provider', 'claim', 'general'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'feedbacks' });

// Create the model only if it doesn't exist
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

/**
 * @desc    Get all feedbacks
 * @route   GET /api/feedbacks
 * @access  Private/Admin
 */
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).lean();
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
  }
};

/**
 * @desc    Get feedback by ID
 * @route   GET /api/feedbacks/:id
 * @access  Private
 */
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).lean();
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

/**
 * @desc    Get feedbacks by employee ID
 * @route   GET /api/feedbacks/employee/:employeeId
 * @access  Private
 */
const getFeedbacksByEmployeeId = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ employeeId: req.params.employeeId }).lean();
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
  }
};

/**
 * @desc    Create new feedback
 * @route   POST /api/feedbacks
 * @access  Private
 */
const createFeedback = async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    const savedFeedback = await feedback.save();
    
    res.status(201).json({
      success: true,
      data: savedFeedback
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating feedback', 
      error: error.message 
    });
  }
};

/**
 * @desc    Update feedback
 * @route   PUT /api/feedbacks/:id
 * @access  Private
 */
const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).lean();
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating feedback', 
      error: error.message 
    });
  }
};

/**
 * @desc    Delete feedback
 * @route   DELETE /api/feedbacks/:id
 * @access  Private/Admin
 */
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id).lean();
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting feedback', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllFeedbacks,
  getFeedbackById,
  getFeedbacksByEmployeeId,
  createFeedback,
  updateFeedback,
  deleteFeedback
}; 