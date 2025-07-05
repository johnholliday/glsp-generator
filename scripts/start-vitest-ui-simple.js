#!/usr/bin/env node

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

console.log('🚀 Starting Vitest UI in standalone mode...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('📝 Features:');
console.log('   • Tests DO NOT run automatically');
console.log('   • All test files are visible in the UI');
console.log('   • Click on files/folders to run tests');
console.log('   • Changes are detected but tests wait for manual trigger');
console.log('\n🛑 To stop: Press Ctrl+C or run "yarn test:ui:stop"\n');

// Start Vitest UI in standalone mode (no auto-run)
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--watch',
  '--standalone',  // Start without running tests!
  '--config', 'vitest.ui-standalone.config.ts',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--no-coverage'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

vitestProcess.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  vitestProcess.kill('SIGTERM');
});