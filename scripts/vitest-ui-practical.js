#!/usr/bin/env node

/**
 * Practical Vitest UI Setup
 * Acknowledges that loops happen with "Run all" but provides workarounds
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

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

console.log('🚀 Starting Vitest UI...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('⚠️  IMPORTANT: About the Loop Issue');
console.log('══════════════════════════════════════');
console.log('When you click "Run all tests", they WILL loop continuously.');
console.log('This is how Vitest watch mode works.\n');
console.log('✅ SOLUTIONS:');
console.log('1. Run specific test files (click them individually)');
console.log('2. Use the filter to run subsets (e.g., type "parser")');
console.log('3. Press "q" in terminal to stop current run');
console.log('4. For one-time all tests: use "yarn test" instead\n');
console.log('💡 BEST PRACTICE:');
console.log('Use UI for debugging specific tests, not running all tests');
console.log('══════════════════════════════════════\n');

// Start Vitest UI normally
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--reporter=verbose'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

vitestProcess.on('exit', (code) => {
  console.log(`\nVitest UI stopped (exit code: ${code})`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  vitestProcess.kill('SIGTERM');
});