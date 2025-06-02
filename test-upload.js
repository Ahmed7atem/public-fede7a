const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const testUpload = async () => {
  try {
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(path.join(__dirname, 'test-image.jpg')));
    form.append('type', 'special-claim');

    // Set timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Make request
    const response = await fetch('https://public-fede7a.vercel.app/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN'
      },
      body: form,
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Log response
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', result);

    if (result.success && result.file) {
      // Test getting file metadata
      const metadataResponse = await fetch(`https://public-fede7a.vercel.app/api/upload/metadata/${result.file.id}`, {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN'
        }
      });
      console.log('Metadata Status:', metadataResponse.status);
      const metadata = await metadataResponse.json();
      console.log('Metadata:', metadata);

      // Test getting file by type
      const typeResponse = await fetch(`https://public-fede7a.vercel.app/api/upload/type/special-claim`, {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN'
        }
      });
      console.log('Type Status:', typeResponse.status);
      const typeResult = await typeResponse.json();
      console.log('Type Result:', typeResult);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testUpload(); 