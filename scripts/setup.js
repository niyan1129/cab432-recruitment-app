const fs = require('fs');
const path = require('path');

// Create necessary directories
const directories = [
  './uploads',
  './uploads/processed',
  './uploads/thumbnails'
];

console.log('🚀 Setting up project directories...');

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory already exists: ${dir}`);
  }
});

// Create .gitkeep files to ensure directories are tracked in git
const gitkeepFiles = [
  './uploads/.gitkeep',
  './uploads/processed/.gitkeep',
  './uploads/thumbnails/.gitkeep'
];

gitkeepFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '');
    console.log(`✅ Created .gitkeep: ${file}`);
  }
});

console.log('✨ Setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Copy .env.example to .env and configure settings');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');
console.log('5. Initialize users: POST /api/auth/init-users');

