const { PolicyDocument } = require('../models/schemas');

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