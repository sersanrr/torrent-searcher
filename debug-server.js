const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Log paths for debugging
console.log('__dirname:', __dirname);
console.log('resolve(__dirname):', path.resolve(__dirname));
console.log('join(__dirname, "../../frontend"):', path.join(__dirname, '../../frontend'));
console.log('join(__dirname, "../../../frontend"):', path.join(__dirname, '../../../frontend'));

app.use(express.json());

// Try both paths
const frontendPath1 = path.join(__dirname, '../../frontend');
const frontendPath2 = path.join(__dirname, '../../../frontend');

console.log('Testing path 1:', frontendPath1);
app.use('/static1', express.static(frontendPath1));

console.log('Testing path 2:', frontendPath2);
app.use('/static2', express.static(frontendPath2));

// Root route
app.get('/', (req, res) => {
  res.json({
    paths: {
      __dirname,
      frontendPath1,
      frontendPath2
    },
    endpoints: [
      '/static1/index.html',
      '/static2/index.html'
    ]
  });
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});
