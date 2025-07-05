#!/usr/bin/env node

/**
 * Vitest UI without continuous loops
 * Solution: Intercept and control test execution
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import fs from 'fs';

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

console.log('🚀 Starting Vitest UI (No-Loop Edition)...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('🎯 The Fix:');
console.log('   • Tests run ONCE when you click "Run"');
console.log('   • NO continuous looping');
console.log('   • Perfect for debugging');
console.log('\n🛑 To stop: Press Ctrl+C\n');

// Create a custom Vitest config that disables file watching
const configContent = `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'src/__tests__/setup.ts', '.unused'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: { enabled: false },
    reporters: ['verbose'],
    
    // Key settings to prevent loops
    watch: true,
    watchExclude: ['**/*'],  // Exclude everything from watch
    forceRerunTriggers: [],  // No automatic reruns
    
    // Disable file watching
    chokidarWatchOptions: {
      ignored: /.*/,  // Ignore all files
      persistent: false
    },
    
    // Pool settings
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});`;

// Write config
const configPath = join(projectRoot, '.vitest-no-loop.config.mjs');
fs.writeFileSync(configPath, configContent);

// Start Vitest UI with our custom config
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--config', '.vitest-no-loop.config.mjs',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--reporter=verbose'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// Cleanup on exit
process.on('exit', () => {
  try {
    fs.unlinkSync(configPath);
  } catch (e) {}
});

vitestProcess.on('exit', (code) => {
  try {
    fs.unlinkSync(configPath);
  } catch (e) {}
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vitest UI...');
  vitestProcess.kill('SIGTERM');
});