const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    const formData = new FormData();
    
    // Add the test image
    const imagePath = path.join(__dirname, 'Screenshot 2025-04-23 at 11.19.27 PM.png');
    const imageStream = fs.createReadStream(imagePath);
    formData.append('file', imageStream);
    
    // Add the type
    formData.append('type', 'special-claim');

    console.log('Sending request to upload file...');
    
    // Add timeout and additional options
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout

    const response = await fetch('https://public-fede7a.vercel.app/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success && result.file) {
      // Test getting files by type
      console.log('\nTesting get files by type...');
      const typeResponse = await fetch('https://public-fede7a.vercel.app/api/upload/type/special-claim', {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN',
          'Accept': 'application/json'
        }
      });
      
      const typeResult = await typeResponse.json();
      console.log('Type Response:', JSON.stringify(typeResult, null, 2));

      // Test getting file by ID
      if (result.file.id) {
        console.log('\nTesting get file by ID...');
        const idResponse = await fetch(`https://public-fede7a.vercel.app/api/upload/${result.file.id}`, {
          headers: {
            'Authorization': 'Bearer ADMIN_TOKEN',
            'Accept': 'application/json'
          }
        });
        
        const idResult = await idResponse.json();
        console.log('ID Response:', JSON.stringify(idResult, null, 2));
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
    } else {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        try {
          const errorBody = await error.response.json();
          console.error('Error details:', errorBody);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    }
  }
}

testUpload(); 