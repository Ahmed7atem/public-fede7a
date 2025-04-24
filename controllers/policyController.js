const mongoose = require('mongoose');

// Define a schema for PolicyDocument if it doesn't exist elsewhere
const PolicyDocumentSchema = new mongoose.Schema({
  title: String,
  description: String,
  fileUrl: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create the model if it doesn't exist
const PolicyDocument = mongoose.models.PolicyDocument || 
  mongoose.model('PolicyDocument', PolicyDocumentSchema);

// Get all policy documents
const getDocuments = async (req, res) => {
  try {
    const documents = await PolicyDocument.find({ isActive: true });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy documents', error: error.message });
  }
};

module.exports = {
  getDocuments
}; 