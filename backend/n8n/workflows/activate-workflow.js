const https = require('https');
const http = require('http');
const fs = require('fs');

const workflowId = 'h0INmbJOQ71cq6NQ';
const n8nUrl = 'http://localhost:5678';

// Read API key from environment variable
const apiKey = process.env.N8N_API_KEY || 'n8n-api-key-12345';

console.log('Using API Key:', apiKey ? 'Set' : 'Not set');
console.log('API Key value:', apiKey);

const options = {
  hostname: 'localhost',
  port: 5678,
  path: `/api/v1/workflows/${workflowId}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': apiKey
  }
};

const data = JSON.stringify({ active: true });

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    if (res.statusCode === 200) {
      console.log('✅ Workflow activated successfully!');
    } else if (res.statusCode === 401) {
      console.log('❌ Authentication failed. Check API key.');
      console.log('API Key being used:', apiKey);
    } else {
      console.log('❌ Failed to activate workflow');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
