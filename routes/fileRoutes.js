const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { auth } = require('../middleware/auth');

// Initialize GridFS
let gfs;
mongoose.connection.once('open', () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

// GET /api/files/:filename - Download a file
router.get('/:filename', auth, async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.metadata.originalName}"`);
    
    // Create read stream
    const readstream = gfs.createReadStream({ filename: file.filename });
    readstream.pipe(res);
    
    // Handle stream errors
    readstream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ message: 'Error streaming file' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving file', error: error.message });
  }
});

module.exports = router; 