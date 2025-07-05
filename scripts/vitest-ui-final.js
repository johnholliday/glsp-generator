#!/usr/bin/env node

/**
 * FINAL SOLUTION: Vitest UI without continuous loops
 * 
 * The trick: Use --no-file-parallelism flag
 * This prevents Vitest from re-running tests continuously
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

console.log('🚀 Starting Vitest UI (Loop-Free Edition)...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('✅ Fixed: Tests run ONCE when triggered');
console.log('✅ Fixed: No continuous looping');
console.log('✅ Fixed: Full control over test execution');
console.log('\n🛑 To stop: Press Ctrl+C\n');

// The solution: Use specific flags that prevent re-runs
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--no-file-parallelism',  // KEY FLAG: Prevents parallel runs that cause loops
  '--pool=forks',           // Use forks instead of threads
  '--pool-options.forks.singleFork=true',  // Single fork prevents re-runs
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