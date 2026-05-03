const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '..', 'apps', 'backend', 'dist', 'main.js');
if (!fs.existsSync(distPath)) {
  console.error('Backend build artifact not found');
  process.exit(1);
}
process.exit(0);
