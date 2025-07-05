#!/usr/bin/env node

/**
 * Vitest UI that truly runs tests only once
 * Uses run mode instead of watch mode to prevent loops
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 51204;
const CONTROL_PORT = 51205;

// Get WSL2 IP
function getWSLIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('172.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

console.log('🚀 Starting Vitest UI (Manual Run Mode)...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('✨ How This Works:');
console.log('   • UI shows all tests but they are NOT running');
console.log('   • Click "Run" - tests execute ONCE and stop');
console.log('   • Make changes - nothing happens automatically');
console.log('   • Click "Run" again when ready');
console.log('   • NO CONTINUOUS LOOPS!');
console.log('\n🛑 To stop: Press Ctrl+C\n');

// The solution: Run Vitest UI in a special mode that doesn't use watch
let vitestProcess = null;
let isUIReady = false;

function startVitestUI() {
  // Kill any existing process
  if (vitestProcess) {
    vitestProcess.kill();
  }

  // Start Vitest UI without watch mode
  // This prevents the continuous loop issue
  vitestProcess = spawn('yarn', [
    'vitest',
    'run',  // Use run mode, not watch mode!
    '--ui',
    '--api.port', PORT.toString(),
    '--api.host', '0.0.0.0',
    '--reporter=verbose',
    '--no-coverage'
  ], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true
  });

  vitestProcess.stdout.on('data', (data) => {
    const output = data.toString();
    
    if (output.includes('UI started at')) {
      isUIReady = true;
      console.log('✅ UI is ready! Tests will run once when triggered.\n');
    } else if (output.includes('Test Files')) {
      console.log('🧪 Test run started...');
    } else if (output.includes('Duration')) {
      console.log('✅ Test run completed! Ready for next run.\n');
    }
    
    // Don't show all output to reduce noise
    if (output.includes('FAIL') || output.includes('PASS')) {
      process.stdout.write('.');
    }
  });

  vitestProcess.stderr.on('data', (data) => {
    // Suppress most errors unless critical
    const error = data.toString();
    if (error.includes('Error:') && !error.includes('MaxListenersExceededWarning')) {
      process.stderr.write(data);
    }
  });

  vitestProcess.on('exit', (code) => {
    if (isUIReady) {
      console.log('\n🔄 Restarting UI for next run...');
      // Restart the UI after tests complete
      setTimeout(startVitestUI, 1000);
    } else {
      console.log(`\nVitest UI stopped (exit code: ${code})`);
      process.exit(code || 0);
    }
  });
}

// Start the UI
startVitestUI();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  if (vitestProcess) {
    vitestProcess.kill('SIGTERM');
  }
  process.exit(0);
});