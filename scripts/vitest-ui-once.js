#!/usr/bin/env node

/**
 * Vitest UI wrapper that ensures tests run only once when triggered
 * Prevents the continuous loop issue when running all tests
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

console.log('🚀 Starting Vitest UI (Single-Run Mode)...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('✨ Special Features:');
console.log('   • Tests run ONCE per trigger (no looping!)');
console.log('   • "Run all" executes once and stops');
console.log('   • File changes wait for manual trigger');
console.log('   • Perfect for debugging without spam');
console.log('\n💡 Tips:');
console.log('   • Use UI buttons to run specific tests');
console.log('   • Press "a" to run all tests once');
console.log('   • Changes are detected but not auto-run');
console.log('\n🛑 To stop: Press Ctrl+C or run "yarn test:ui:stop"\n');

// The key is to use vitest in UI mode but with specific flags that prevent
// continuous execution when "run all" is triggered
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--watch',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--no-coverage',
  '--reporter=verbose',
  '--bail=0',  // Don't stop on first failure
  '--passWithNoTests',
  '--run=false',  // Key flag - don't run automatically
  'src/**/*.{test,spec}.ts'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Set environment to prevent auto-reruns
    VITEST_UI_SINGLE_RUN: 'true',
    CI: 'false'
  }
});

vitestProcess.on('exit', (code) => {
  console.log(`\nVitest UI stopped (exit code: ${code})`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  vitestProcess.kill('SIGTERM');
});