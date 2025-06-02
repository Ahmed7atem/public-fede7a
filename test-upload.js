const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const testUpload = async () => {
  try {
    console.log('Starting upload test...');
    
    // Create form data
    const form = new FormData();
    const imagePath = path.join(__dirname, 'Screenshot 2025-04-23 at 11.19.27 PM.png');
    
    // Check if file exists
    console.log('Checking file path:', imagePath);
    if (!fs.existsSync(imagePath)) {
      console.error('Error: Image file not found at:', imagePath);
      return;
    }
    
    // Get file stats
    const stats = fs.statSync(imagePath);
    console.log('File size:', stats.size, 'bytes');
    
    console.log('Found image file, preparing upload...');
    form.append('file', fs.createReadStream(imagePath));
    form.append('type', 'special-claim');

    console.log('Sending upload request to: https://public-fede7a.vercel.app/api/upload');
    console.log('Headers:', {
      'Authorization': 'Bearer ADMIN_TOKEN',
      'Accept': 'application/json'
    });
    
    // Make request without timeout first
    console.log('Initiating request...');
    const response = await fetch('https://public-fede7a.vercel.app/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN',
        'Accept': 'application/json'
      },
      body: form
    });

    console.log('Response received. Status:', response.status);
    console.log('Response headers:', response.headers.raw());

    // Log response
    console.log('\nUpload Response:');
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success && result.file) {
      // Test getting file metadata
      console.log('\nTesting metadata endpoint...');
      const metadataUrl = `https://public-fede7a.vercel.app/api/upload/metadata/${result.file.id}`;
      console.log('Metadata URL:', metadataUrl);
      
      const metadataResponse = await fetch(metadataUrl, {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN',
          'Accept': 'application/json'
        }
      });
      console.log('Metadata Status:', metadataResponse.status);
      const metadata = await metadataResponse.json();
      console.log('Metadata:', JSON.stringify(metadata, null, 2));

      // Test getting file by type
      console.log('\nTesting get by type endpoint...');
      const typeUrl = `https://public-fede7a.vercel.app/api/upload/type/special-claim`;
      console.log('Type URL:', typeUrl);
      
      const typeResponse = await fetch(typeUrl, {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN',
          'Accept': 'application/json'
        }
      });
      console.log('Type Status:', typeResponse.status);
      const typeResult = await typeResponse.json();
      console.log('Type Result:', JSON.stringify(typeResult, null, 2));
    }
  } catch (error) {
    console.error('\nDetailed error information:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ENOENT') {
      console.error('File not found:', error.path);
    }
  }
};

console.log('Script started...');
testUpload().then(() => {
  console.log('Script completed.');
}).catch(error => {
  console.error('Unhandled error:', error);
}); 