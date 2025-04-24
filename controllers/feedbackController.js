const { Feedback } = require('../models/schemas');

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const {
      employee,
      message,
      rating
    } = req.body;

    if (!employee || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const feedback = new Feedback({
      employee,
      message,
      rating: rating || 0,
      status: 'pending',
      submittedAt: new Date()
    });

    await feedback.save();

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const {
      message,
      rating,
      status,
      response
    } = req.body;

    if (message) feedback.message = message;
    if (rating !== undefined) feedback.rating = rating;
    if (status) feedback.status = status;
    if (response) feedback.response = response;

    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.deleteOne();

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
}; 