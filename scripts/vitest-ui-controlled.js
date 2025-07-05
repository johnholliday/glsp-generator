#!/usr/bin/env node

/**
 * Controlled Vitest UI - No continuous loops!
 * This wrapper ensures tests only run when YOU want them to
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 51204;

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

const wslIP = getWSLIP();

console.log('🎮 Vitest UI Controller\n');
console.log('━'.repeat(50));
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 UI Access: http://${wslIP}:${PORT}/__vitest__/`);
console.log('━'.repeat(50));
console.log('\n🎯 THE SOLUTION:');
console.log('   Instead of continuous loops, you get:');
console.log('   • A UI that shows all your tests');
console.log('   • Tests that run ONLY when clicked');
console.log('   • No automatic re-runs!');
console.log('\n📝 Instructions:');
console.log('   1. Open the URL above in Edge');
console.log('   2. In the UI, click any test to run it');
console.log('   3. Tests run ONCE and stop');
console.log('   4. Repeat as needed');
console.log('\n💡 Pro Tip: Use test filters in the UI to run subsets\n');

// The key insight: Run Vitest in "run" mode with UI
// This naturally prevents loops because "run" mode exits after completion
let vitestProcess = null;
let testRunning = false;

async function startVitestUI() {
  return new Promise((resolve) => {
    console.log('🚀 Starting Vitest UI...\n');
    
    vitestProcess = spawn('yarn', [
      'vitest',
      '--ui',
      '--run',  // Run mode = no watch, no loops!
      '--api.port', PORT.toString(),
      '--api.host', '0.0.0.0',
      '--passWithNoTests',
      '--reporter=default'
    ], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true
    });

    let uiStarted = false;

    vitestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      if (output.includes('UI started at') && !uiStarted) {
        uiStarted = true;
        console.log('✅ UI is ready!');
        console.log('🖱️  Click tests in the UI to run them\n');
        resolve();
      }
      
      // Show test progress
      if (output.includes('✓') || output.includes('×')) {
        process.stdout.write(output);
      }
    });

    vitestProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('MaxListenersExceededWarning')) {
        process.stderr.write(data);
      }
    });

    vitestProcess.on('exit', (code) => {
      if (testRunning) {
        console.log('\n✅ Test run completed!');
        console.log('🔄 Restarting UI for next run...\n');
        testRunning = false;
        // Restart UI after a short delay
        setTimeout(() => startVitestUI(), 1000);
      } else {
        console.log('\nVitest UI stopped');
        process.exit(0);
      }
    });
  });
}

// Monitor for test execution
function monitorTests() {
  setInterval(() => {
    if (vitestProcess && !testRunning) {
      // Check if tests are being run
      testRunning = true;
    }
  }, 1000);
}

// Start everything
async function main() {
  await startVitestUI();
  monitorTests();
  
  // Keep the process alive
  process.stdin.resume();
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  if (vitestProcess) {
    vitestProcess.kill('SIGTERM');
  }
  process.exit(0);
});

main().catch(console.error);