const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use /tmp for serverless compatibility
    cb(null, '/tmp');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Upload a file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    if (!req.body.type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type is required (special-claim, pre-approval, or complaint)' 
      });
    }

    const allowedTypes = ['special-claim', 'pre-approval', 'complaint'];
    if (!allowedTypes.includes(req.body.type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid type. Must be one of: special-claim, pre-approval, complaint' 
      });
    }

    // Create a new file document
    const fileDoc = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      type: req.body.type,
      uploadedBy: req.user?.id || 'anonymous',
      uploadDate: new Date()
    };

    // Save metadata to MongoDB
    const result = await mongoose.connection.db.collection('files').insertOne(fileDoc);

    res.status(201).json({
      success: true,
      file: {
        id: result.insertedId,
        filename: fileDoc.filename,
        originalName: fileDoc.originalName,
        contentType: fileDoc.contentType,
        type: fileDoc.type,
        uploadDate: fileDoc.uploadDate,
        size: fileDoc.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up the uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// Get file by ID
const getFile = async (req, res) => {
  try {
    const file = await mongoose.connection.db.collection('files')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Content-Length': file.size
    });

    // Stream the file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
};

// Get file metadata by ID
const getFileMetadata = async (req, res) => {
  try {
    const file = await mongoose.connection.db.collection('files')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        contentType: file.contentType,
        type: file.type,
        uploadDate: file.uploadDate,
        size: file.size,
        uploadedBy: file.uploadedBy
      }
    });
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file metadata',
      error: error.message
    });
  }
};

// Get files by type
const getFilesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['special-claim', 'pre-approval', 'complaint'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be one of: special-claim, pre-approval, complaint'
      });
    }

    const files = await mongoose.connection.db.collection('files')
      .find({ type: type })
      .toArray();
    
    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        contentType: file.contentType,
        type: file.type,
        uploadDate: file.uploadDate,
        size: file.size,
        uploadedBy: file.uploadedBy
      }))
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files',
      error: error.message
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await mongoose.connection.db.collection('files')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete metadata from database
    await mongoose.connection.db.collection('files')
      .deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  getFile,
  getFileMetadata,
  getFilesByType,
  deleteFile
}; 