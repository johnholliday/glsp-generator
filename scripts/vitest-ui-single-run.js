#!/usr/bin/env node

/**
 * Vitest UI with controlled test execution
 * Prevents continuous loop when running all tests
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

console.log('🚀 Starting Vitest UI (No-Loop Mode)...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('✨ Key Features:');
console.log('   • Tests run ONCE per trigger');
console.log('   • No continuous looping');
console.log('   • File changes detected but wait for manual run');
console.log('   • Perfect for debugging without spam');
console.log('\n💡 Usage:');
console.log('   1. Open UI in browser');
console.log('   2. Click "Run all" or specific tests');
console.log('   3. Tests run once and stop');
console.log('   4. Make code changes');
console.log('   5. Click "Run" again when ready');
console.log('\n🛑 To stop: Press Ctrl+C or run "yarn test:ui:stop"\n');

// Start Vitest UI in standalone mode
// This is the key to preventing continuous test runs
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--standalone',  // Prevents auto-run on file changes
  '--watch',       // Required for standalone mode
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--reporter=verbose',
  '--passWithNoTests'
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