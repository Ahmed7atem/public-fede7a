const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const path = require('path');

class FileUploadService {
  constructor() {
    this.bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
  }

  // Initialize multer storage for handling file uploads
  getMulterStorage() {
    return multer.memoryStorage();
  }

  // Upload a file to GridFS
  async uploadFile(file, metadata = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(file.originalname, {
        metadata: {
          ...metadata,
          originalName: file.originalname,
          uploadDate: new Date(),
          contentType: file.mimetype
        }
      });

      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: file.originalname,
          contentType: file.mimetype
        });
      });

      uploadStream.on('error', (error) => {
        reject(error);
      });

      uploadStream.end(file.buffer);
    });
  }

  // Get file stream for downloading
  getFileStream(fileId) {
    return this.bucket.openDownloadStream(fileId);
  }

  // Delete a file
  async deleteFile(fileId) {
    return this.bucket.delete(fileId);
  }

  // Get file metadata
  async getFileMetadata(fileId) {
    const files = await this.bucket.find({ _id: fileId }).toArray();
    return files[0];
  }
}

module.exports = new FileUploadService(); 