const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;

// Initialize GridFS bucket
const initGridFS = () => {
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, {
    bucketName: 'uploads'
  });
};

// Get file by ID
const getFileById = async (fileId) => {
  try {
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (files.length === 0) {
      throw new Error('File not found');
    }
    return files[0];
  } catch (error) {
    throw new Error(`Error getting file: ${error.message}`);
  }
};

// Get file stream by ID
const getFileStream = (fileId) => {
  try {
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    throw new Error(`Error getting file stream: ${error.message}`);
  }
};

// Delete file by ID
const deleteFile = async (fileId) => {
  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

// Get file metadata by ID
const getFileMetadata = async (fileId) => {
  try {
    const file = await getFileById(fileId);
    return {
      id: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName,
      contentType: file.contentType,
      length: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata
    };
  } catch (error) {
    throw new Error(`Error getting file metadata: ${error.message}`);
  }
};

module.exports = {
  initGridFS,
  getFileById,
  getFileStream,
  deleteFile,
  getFileMetadata
}; 