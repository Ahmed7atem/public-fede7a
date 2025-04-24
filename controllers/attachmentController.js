const fileUploadService = require('../services/fileUploadService');
const Attachment = require('../models/Attachment');
const mongoose = require('mongoose');

class AttachmentController {
  // Upload multiple files
  async uploadFiles(req, res) {
    try {
      console.log('Request files:', req.files);
      console.log('Request body:', req.body);
      console.log('Request user:', req.employee);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        console.log('Processing file:', file);
        try {
          const uploadResult = await fileUploadService.uploadFile(file, {
            uploadedBy: req.employee._id,
            type: req.body.type,
            referenceId: new mongoose.Types.ObjectId(req.body.referenceId)
          });
          console.log('Upload result:', uploadResult);

          const attachment = await Attachment.create({
            fileId: uploadResult.fileId,
            filename: uploadResult.filename,
            contentType: uploadResult.contentType,
            size: file.size,
            uploadedBy: req.employee._id,
            type: req.body.type,
            referenceId: new mongoose.Types.ObjectId(req.body.referenceId),
            description: req.body.description
          });
          console.log('Created attachment:', attachment);

          uploadedFiles.push(attachment);
        } catch (fileError) {
          console.error('Error processing file:', file.originalname, fileError);
          throw fileError;
        }
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Something broke!' });
    }
  }

  // Download a file
  async downloadFile(req, res) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: 'File not found' });
      }

      const fileStream = fileUploadService.getFileStream(attachment.fileId);
      
      res.setHeader('Content-Type', attachment.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
      
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get file metadata
  async getFileMetadata(req, res) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: 'File not found' });
      }

      const metadata = await fileUploadService.getFileMetadata(attachment.fileId);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a file
  async deleteFile(req, res) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: 'File not found' });
      }

      await fileUploadService.deleteFile(attachment.fileId);
      await attachment.remove();

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all attachments for a specific reference
  async getAttachments(req, res) {
    try {
      const attachments = await Attachment.find({
        type: req.params.type,
        referenceId: req.params.referenceId
      }).populate('uploadedBy', 'name email');

      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AttachmentController(); 