#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this script is located
const scriptDir = path.dirname(__filename);
const packageDir = path.resolve(scriptDir, '..');

// Check if we're in a Taskmaster project (has .taskmaster directory)
const currentDir = process.cwd();
const taskmasterDir = path.join(currentDir, '.taskmaster');

if (!fs.existsSync(taskmasterDir)) {
  console.log('❌ No .taskmaster directory found in current directory');
  console.log('💡 Make sure you\'re in a Taskmaster project directory or run "task-master init" first');
  console.log('📂 Current directory:', currentDir);
  process.exit(1);
}

console.log('🚀 Starting Taskmaster UI...');
console.log('📂 Project directory:', currentDir);
console.log('📋 Tasks file:', path.join(taskmasterDir, 'tasks', 'tasks.json'));
console.log('🌐 UI will be available at: http://localhost:3001');
console.log('');

// Set environment variable to current directory
process.env.TASKMASTER_PROJECT_ROOT = currentDir;

// Change to the package directory and run the dev script
process.chdir(packageDir);

const npmScript = process.argv.includes('--prod') ? 'start' : 'dev';
const child = spawn('npm', ['run', npmScript], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('❌ Failed to start Taskmaster UI:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
}); 