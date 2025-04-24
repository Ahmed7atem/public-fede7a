const Claim = require('../models/Claim');
const fileUploadService = require('../services/fileUploadService');
const Attachment = require('../models/Attachment');

class ClaimController {
  async submitClaim(req, res) {
    try {
      // Create the claim
      const claim = await Claim.create({
        type: req.body.type,
        amount: req.body.amount,
        description: req.body.description,
        date: req.body.date,
        provider: req.body.provider,
        submittedBy: req.user._id,
        status: 'pending'
      });

      // Handle file attachments if any
      if (req.files && req.files.length > 0) {
        const attachments = [];
        for (const file of req.files) {
          const uploadResult = await fileUploadService.uploadFile(file, {
            uploadedBy: req.user._id,
            type: 'claim',
            referenceId: claim._id
          });

          const attachment = await Attachment.create({
            fileId: uploadResult.fileId,
            filename: uploadResult.filename,
            contentType: uploadResult.contentType,
            size: file.size,
            uploadedBy: req.user._id,
            type: 'claim',
            referenceId: claim._id,
            description: req.body.attachmentDescription || 'Claim supporting document'
          });

          attachments.push(attachment);
        }
        claim.attachments = attachments.map(a => a._id);
        await claim.save();
      }

      // Populate the attachments in the response
      const populatedClaim = await Claim.findById(claim._id)
        .populate('attachments', 'filename contentType size uploadDate')
        .populate('submittedBy', 'name email');

      res.status(201).json(populatedClaim);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ... other claim controller methods ...
}

module.exports = new ClaimController(); 