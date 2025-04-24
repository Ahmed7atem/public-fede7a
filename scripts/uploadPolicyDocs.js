const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PolicyDocument = require('../models/PolicyDocument');

const uploadPolicyDocs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    console.log('GridFS bucket initialized');

    // Policy document types and their corresponding filenames
    const docs = [
      { name: 'Table of benefits', filename: 'table-of-benefits.pdf' },
      { name: 'Benefit Guide', filename: 'benefit-guide.pdf' },
      { name: 'Insurance Certificate', filename: 'insurance-certificate.pdf' },
      { name: 'Membership Card', filename: 'membership-card.pdf' },
      { name: 'Additional information', filename: 'additional-information.pdf' },
      { name: 'Treatment Guarantee Form', filename: 'treatment-guarantee-form.pdf' }
    ];

    // Upload each document
    for (const doc of docs) {
      try {
        const filePath = path.join(__dirname, `../PDFs/${doc.filename}`);
        
        if (fs.existsSync(filePath)) {
          console.log(`Processing ${doc.name}...`);
          
          // Check if document already exists
          const existingDoc = await PolicyDocument.findOne({ name: doc.name });
          if (existingDoc) {
            console.log(`Document ${doc.name} already exists, skipping...`);
            continue;
          }

          await new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(filePath);
            const uploadStream = bucket.openUploadStream(doc.filename, {
              metadata: {
                originalName: doc.filename,
                uploadDate: new Date()
              }
            });

            uploadStream.on('finish', async () => {
              try {
                // Create policy document record
                await PolicyDocument.create({
                  name: doc.name,
                  fileUrl: `/api/files/${uploadStream.id}`,
                  isActive: true
                });
                console.log(`Successfully uploaded ${doc.name}`);
                resolve();
              } catch (error) {
                reject(error);
              }
            });

            uploadStream.on('error', (error) => {
              console.error(`Error uploading ${doc.name}:`, error);
              reject(error);
            });

            readStream.pipe(uploadStream);
          });
        } else {
          console.log(`File not found: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing ${doc.name}:`, error);
      }
    }

    console.log('Policy document upload completed');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error uploading policy documents:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

uploadPolicyDocs(); 