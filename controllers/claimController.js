const Claim = require('../models/Claim');
const fileUploadService = require('../services/fileUploadService');
const Attachment = require('../models/Attachment');
const { v4: uuidv4 } = require('uuid');

class ClaimController {
  async submitClaim(req, res) {
    try {
      // Create the claim with fields matching the model
      const claim = await Claim.create({
        claimId: uuidv4(), // Generate a unique ID
        status: 'Pending',
        provider: req.body.provider,
        patient: req.employee._id,
        claimAmount: req.body.claimAmount,
        claimDate: req.body.claimDate || new Date(),
        patientAge: req.body.patientAge,
        providerSpecialty: req.body.providerSpecialty,
        patientIncome: req.body.patientIncome,
        patientMaritalStatus: req.body.patientMaritalStatus || 'Single',
        patientEmploymentStatus: req.body.patientEmploymentStatus || 'Employed',
        claimType: req.body.claimType || 'Routine',
        claimSubmissionMethod: 'Online',
        diagnosisDescription: req.body.diagnosisDescription || 'Not provided',
        procedureDescription: req.body.procedureDescription || 'Not provided'
      });

      // Handle file attachments if any
      if (req.files && req.files.length > 0) {
        const documents = [];
        for (const file of req.files) {
          const uploadResult = await fileUploadService.uploadFile(file, {
            uploadedBy: req.employee._id,
            type: 'claim',
            referenceId: claim._id
          });

          documents.push({
            url: `/api/files/${uploadResult.fileId}`,
            fileName: uploadResult.filename,
            uploadDate: new Date()
          });
        }
        claim.documents = documents;
        await claim.save();
      }

      res.status(201).json(claim);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all claims (for admin) or user's claims
  async getClaims(req, res) {
    try {
      // If admin, get all claims, otherwise only get user's claims
      const filter = req.employee.role === 'admin' ? {} : { patient: req.employee._id };
      
      const claims = await Claim.find(filter)
        .populate('provider', 'name address specialty')
        .sort({ createdAt: -1 });
      
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get claim by ID
  async getClaimById(req, res) {
    try {
      const claim = await Claim.findById(req.params.id)
        .populate('provider', 'name address specialty');
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }
      
      // If not admin and not the claim owner, deny access
      if (req.employee.role !== 'admin' && claim.patient.toString() !== req.employee._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this claim' });
      }
      
      res.json(claim);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update claim status
  async updateClaimStatus(req, res) {
    try {
      // Only admin can update claim status
      if (req.employee.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update claim status' });
      }
      
      const { status } = req.body;
      
      if (!status || !['Pending', 'Approved', 'Rejected', 'Processing', 'Denied'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      
      const claim = await Claim.findById(req.params.id);
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }
      
      claim.status = status;
      claim.updatedAt = new Date();
      
      await claim.save();
      
      res.json(claim);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ClaimController(); 