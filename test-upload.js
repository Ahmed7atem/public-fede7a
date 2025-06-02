const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testSpecialClaim() {
  try {
    const formData = new FormData();
    
    // Add all the required fields from the Postman collection
    formData.append('policyNumber', 'POL123456');
    formData.append('policyHolderName', 'John Doe');
    formData.append('employeeId', 'EMP789');
    formData.append('email', 'john.doe@example.com');
    formData.append('number', '+1234567890');
    formData.append('claimFor', 'Medical');
    formData.append('claimForId', 'CLM456');
    formData.append('country', 'USA');
    formData.append('claimAmount', '1500.75');
    formData.append('currency', 'USD');
    formData.append('dateOfTreatment', '2024-05-14');
    formData.append('paymentMethod', 'Bank Transfer');
    formData.append('bankName', 'Bank of America');
    formData.append('branchName', 'Main Branch');
    formData.append('accountNumber', '123456789012');
    formData.append('swiftCode', 'BOFAUS3N');
    formData.append('iban', 'US12345678901234567890');
    formData.append('description', 'Medical treatment for surgery');

    // Add the test image
    const imagePath = path.join(__dirname, 'Screenshot 2025-04-23 at 11.19.27 PM.png');
    const imageStream = fs.createReadStream(imagePath);
    formData.append('attachments', imageStream);

    console.log('Sending request to create special claim...');
    
    // Add timeout and additional options
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout

    const response = await fetch('https://public-fede7a.vercel.app/api/claims/special-claims', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN', // Replace with actual token
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
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

testSpecialClaim(); 