const https = require('https');
const http = require('http');

const workflowId = 'h0INmbJOQ71cq6NQ';
const n8nUrl = 'http://localhost:5678';
const username = 'admin';
const password = 'password';

const auth = Buffer.from(`${username}:${password}`).toString('base64');

const options = {
  hostname: 'localhost',
  port: 5678,
  path: `/api/v1/workflows/${workflowId}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
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
