const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const ENDPOINTS = [
  '/health',
  '/api/auth/login',
  '/api/health-data',
  '/api/wearable-logs',
  '/api/employees',
  '/api/reports',
  '/api/feedback'
];

const ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://your-frontend-domain.com'
];

async function testCORS(origin, endpoint) {
  try {
    // First test OPTIONS (preflight) request
    const preflightResponse = await fetch(`${API_URL}${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    const preflightHeaders = preflightResponse.headers;
    const preflightCorsHeaders = {
      'access-control-allow-origin': preflightHeaders.get('access-control-allow-origin'),
      'access-control-allow-methods': preflightHeaders.get('access-control-allow-methods'),
      'access-control-allow-headers': preflightHeaders.get('access-control-allow-headers')
    };
    
    console.log(`Testing preflight for ${origin} -> ${endpoint}`);
    console.log('Preflight CORS Headers:', preflightCorsHeaders);

    // Then test actual request
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      }
    });
    
    const headers = response.headers;
    const corsHeaders = {
      'access-control-allow-origin': headers.get('access-control-allow-origin'),
      'access-control-allow-methods': headers.get('access-control-allow-methods'),
      'access-control-allow-headers': headers.get('access-control-allow-headers')
    };
    
    console.log(`✅ Success: ${origin} -> ${endpoint}`);
    console.log('Actual Request CORS Headers:', corsHeaders);
    console.log('---');
    return true;
  } catch (error) {
    console.log(`❌ CORS error: ${origin} -> ${endpoint}`);
    console.log('Error:', error.message);
    console.log('---');
    return false;
  }
}

async function runTests() {
  console.log('Testing CORS configuration...');
  console.log('This script will test if your API endpoints are accessible from different origins.');
  console.log('If you see "CORS error" messages, your CORS configuration needs to be updated.');
  console.log('If you see "Success" messages, your CORS configuration is working correctly.\n');

  for (const origin of ORIGINS) {
    console.log(`\nTesting origin: ${origin}`);
    for (const endpoint of ENDPOINTS) {
      await testCORS(origin, endpoint);
    }
  }

  console.log('\nCORS testing completed.');
  console.log('If you see any errors, make sure to:');
  console.log('1. Update your CORS configuration in api/index.js');
  console.log('2. Set the correct FRONTEND_URL and FRONTEND_URL_PROD in your .env file');
  console.log('3. Restart your API server');
}

runTests().catch(console.error); 