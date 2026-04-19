const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import server components (using JS directly, no compilation)
const SERVER_ROOT = __dirname;
const FRONTEND_PATH = path.join(SERVER_ROOT, 'frontend');

console.log('=================================');
console.log('🔍 Torrent Search Server (Manual Mode)');
console.log('=================================');
console.log('__dirname:', __dirname);
console.log('SERVER_ROOT:', SERVER_ROOT);
console.log('FRONTEND_PATH:', FRONTEND_PATH);

// Check files
const indexPath = path.join(FRONTEND_PATH, 'index.html');
const cssPath = path.join(FRONTEND_PATH, 'style.css');
const jsPath = path.join(FRONTEND_PATH, 'app.js');

console.log('index.html path:', indexPath);
console.log('index.html exists?', fs.existsSync(indexPath));
console.log('style.css path:', cssPath);
console.log('style.css exists?', fs.existsSync(cssPath));
console.log('app.js path:', jsPath);
console.log('app.js exists?', fs.existsSync(jsPath));
console.log('=================================');

// Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to serve static files manually
function serveFile(filePath, mimeType) {
  return (req, res) => {
    try {
      console.log(`Serving ${filePath}`);
      if (fs.existsSync(filePath)) {
        res.type(mimeType);
        res.send(fs.readFileSync(filePath));
      } else {
        console.error(`File not found: ${filePath}`);
        res.status(404).send('Not found');
      }
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).send('Server error');
    }
  };
}

// Serve static files
app.get('/style.css', serveFile(cssPath, 'text/css'));
app.get('/app.js', serveFile(jsPath, 'text/javascript'));

// Serve index.html for root route
app.get('/', (req, res) => {
  try {
    console.log('Serving index.html');
    if (fs.existsSync(indexPath)) {
      res.type('text/html');
      res.send(fs.readFileSync(indexPath));
    } else {
      console.error('index.html not found');
      res.status(404).send('index.html not found');
    }
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server error');
  }
});

// Mock API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    trackers: { total: 3, available: 0 },
    proxies: { enabled: false }
  });
});

app.get('/api/trackers', (req, res) => {
  res.json({
    trackers: [
      { name: '1337x', available: false },
      { name: 'NYAA', available: false },
      { name: 'YTS', available: false }
    ]
  });
});

// Search endpoint - mock results
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  res.json({ query, page: 1, total: 0, results: [] });
});

// 404 handler
app.use((req, res) => {
  console.log('404:', req.method, req.path);
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`=================================`);
});
