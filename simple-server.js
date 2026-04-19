const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Use absolute path to frontend
const PROJECT_ROOT = __dirname;
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend');

console.log('PROJECT_ROOT:', PROJECT_ROOT);
console.log('FRONTEND_PATH:', FRONTEND_PATH);
console.log('Frontend exists?', fs.existsSync(FRONTEND_PATH));
console.log('index.html exists?', fs.existsSync(path.join(FRONTEND_PATH, 'index.html')));

// Middleware
app.use(express.json());
app.use(express.static(FRONTEND_PATH));

// Root route
app.get('/', (req, res) => {
  const indexPath = path.join(FRONTEND_PATH, 'index.html');
  console.log('Serving:', indexPath);
  console.log('File exists?', fs.existsSync(indexPath));
  res.sendFile(indexPath);
});

// API routes (mock)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📁 Frontend: ${FRONTEND_PATH}`);
});
