#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 51204;

// Create a simple control server
const app = express();
const server = createServer(app);

let vitestProcess = null;

// Start Vitest UI in a controlled way
async function startVitestUI() {
  console.log('🚀 Starting Vitest UI Server...\n');
  
  // Start Vitest with specific config to prevent auto-run
  vitestProcess = spawn('yarn', [
    'vitest',
    '--ui',
    '--api.port', PORT.toString(),
    '--api.host', '0.0.0.0',
    '--watch',
    '--passWithNoTests',
    '--bail=0',
    '--run=false'
  ], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CI: 'false',
      NODE_ENV: 'test',
      FORCE_COLOR: '1'
    },
    stdio: 'pipe',
    shell: true
  });

  // Suppress initial test output
  let suppressOutput = true;
  
  vitestProcess.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Check if UI is ready
    if (output.includes('UI started at')) {
      suppressOutput = false;
      console.log('✅ Vitest UI is ready!\n');
      console.log(`🌐 Access at: http://localhost:${PORT}/__vitest__/`);
      console.log('\n📝 Instructions:');
      console.log('   • All test files are visible but NOT running');
      console.log('   • Click on test files to run them individually');
      console.log('   • Use the UI controls to manage test execution');
      console.log('\n🛑 To stop: Press Ctrl+C\n');
    }
    
    // Only show non-test output
    if (!suppressOutput && !output.includes('FAIL') && !output.includes('PASS') && !output.includes('Test Files')) {
      process.stdout.write(output);
    }
  });
  
  vitestProcess.stderr.on('data', (data) => {
    // Suppress most stderr output during startup
    const error = data.toString();
    if (!error.includes('MaxListenersExceededWarning')) {
      process.stderr.write(data);
    }
  });

  vitestProcess.on('exit', (code) => {
    console.log(`\nVitest UI stopped (exit code: ${code})`);
    process.exit(code || 0);
  });
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  if (vitestProcess) {
    vitestProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Start the server
startVitestUI().catch(console.error);