const mongoose = require('mongoose');
const multer = require('multer');

// Use memory storage for simplicity
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
        message: 'Type is required' 
      });
    }

    if (!req.body.employeeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID is required' 
      });
    }

    // Create file document
    const fileDoc = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      type: req.body.type,
      employeeId: req.body.employeeId,
      uploadDate: new Date(),
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',') : []
    };

    // Save to MongoDB
    const result = await mongoose.connection.db.collection('files').insertOne(fileDoc);

    res.status(201).json({
      success: true,
      file: {
        id: result.insertedId,
        filename: fileDoc.filename,
        type: fileDoc.type,
        employeeId: fileDoc.employeeId,
        uploadDate: fileDoc.uploadDate,
        size: fileDoc.size,
        description: fileDoc.description,
        tags: fileDoc.tags
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// Get all files
const getAllFiles = async (req, res) => {
  try {
    const files = await mongoose.connection.db.collection('files')
      .find({})
      .project({ buffer: 0 }) // Exclude the file buffer from the response
      .toArray();

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        type: file.type,
        employeeId: file.employeeId,
        uploadDate: file.uploadDate,
        size: file.size,
        description: file.description,
        tags: file.tags
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

// Get files by type
const getFilesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const files = await mongoose.connection.db.collection('files')
      .find({ type })
      .project({ buffer: 0 })
      .toArray();

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        type: file.type,
        employeeId: file.employeeId,
        uploadDate: file.uploadDate,
        size: file.size,
        description: file.description,
        tags: file.tags
      }))
    });
  } catch (error) {
    console.error('Error fetching files by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files by type',
      error: error.message
    });
  }
};

// Get files by employee ID
const getFilesByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const files = await mongoose.connection.db.collection('files')
      .find({ employeeId })
      .project({ buffer: 0 })
      .toArray();

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        type: file.type,
        employeeId: file.employeeId,
        uploadDate: file.uploadDate,
        size: file.size,
        description: file.description,
        tags: file.tags
      }))
    });
  } catch (error) {
    console.error('Error fetching files by employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files by employee',
      error: error.message
    });
  }
};

// Get file by ID
const getFileById = async (req, res) => {
  try {
    const file = await mongoose.connection.db.collection('files')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Length': file.size
    });

    // Send the file buffer
    res.send(file.buffer);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
};

// Delete file by ID
const deleteFile = async (req, res) => {
  try {
    const result = await mongoose.connection.db.collection('files')
      .deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

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

// Update file metadata
const updateFileMetadata = async (req, res) => {
  try {
    const { description, tags } = req.body;
    const updateData = {};

    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags.split(',');

    const result = await mongoose.connection.db.collection('files')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File metadata updated successfully'
    });
  } catch (error) {
    console.error('Error updating file metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating file metadata',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  getAllFiles,
  getFilesByType,
  getFilesByEmployeeId,
  getFileById,
  deleteFile,
  updateFileMetadata
}; 