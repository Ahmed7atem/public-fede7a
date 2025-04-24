const fileUploadService = require('../services/fileUploadService');
const Attachment = require('../models/Attachment');

class AttachmentController {
  // Upload multiple files
  async uploadFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        const uploadResult = await fileUploadService.uploadFile(file, {
          uploadedBy: req.user._id,
          type: req.body.type,
          referenceId: req.body.referenceId
        });

        const attachment = await Attachment.create({
          fileId: uploadResult.fileId,
          filename: uploadResult.filename,
          contentType: uploadResult.contentType,
          size: file.size,
          uploadedBy: req.user._id,
          type: req.body.type,
          referenceId: req.body.referenceId,
          description: req.body.description
        });

        uploadedFiles.push(attachment);
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      res.status(500).json({ error: error.message });
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