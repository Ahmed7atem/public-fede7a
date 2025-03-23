const { getAllData } = require('../services/dataService');

async function getAllDataHandler(req, res) {
  try {
    // Ensure the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllDataHandler,
};