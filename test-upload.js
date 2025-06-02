const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    const filePath = path.join(__dirname, 'Screenshot 2025-04-23 at 11.19.27 PM.png');
    const formData = new FormData();
    
    formData.append('attachment', fs.createReadStream(filePath));
    formData.append('type', 'test');
    formData.append('referenceId', 'test123');

    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Upload response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testUpload(); 