const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', message: 'Test server running' }));
});

server.listen(3001, () => {
  console.log('Test server running on port 3001');
  
  // Make a test request
  http.get('http://localhost:3001', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      server.close();
    });
  });
});
