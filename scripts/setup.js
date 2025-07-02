#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up OSINT Nexus...\n');

// Check if .env exists, if not copy from .env.example
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('.env file created');
} else {
    console.log('.env file already exists');
}

// Create necessary directories
const dirs = ['logs', 'uploads', 'uploads/temp'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

console.log('\nSetup complete! Next steps:');
console.log('1. Edit your .env file with your configuration');
console.log('2. Start MongoDB service');
console.log('3. Run: npm run seed (to populate sample OSINT tools)');
console.log('4. Run: npm start (to start the application)');
console.log('\nVisit http://localhost:5000 to access OSINT Nexus');
console.log('\nFor development, use: npm run dev');
