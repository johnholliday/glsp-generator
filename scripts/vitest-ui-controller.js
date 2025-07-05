#!/usr/bin/env node

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

console.log('🚀 Starting Vitest UI with single-run mode...\n');

const wslIP = getWSLIP();
console.log(`📍 WSL2 IP: ${wslIP}`);
console.log(`🌐 Access at: http://${wslIP}:${PORT}/__vitest__/\n`);
console.log('📝 Features:');
console.log('   • Tests run ONCE when triggered');
console.log('   • No continuous looping');
console.log('   • File changes detected but wait for manual trigger');
console.log('   • Perfect for iterative development');
console.log('\n🛑 To stop: Press Ctrl+C or run "yarn test:ui:stop"\n');

// Create a special config that prevents continuous runs
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
    watch: true,
    // Prevent continuous re-runs
    fileParallelism: false,
    isolate: false,
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        useAtomics: true,
        memoryLimit: '1GB'
      }
    }
  }
});
`;

// Write temporary config
import fs from 'fs';
const tempConfigPath = join(projectRoot, '.vitest.ui-temp.config.ts');
fs.writeFileSync(tempConfigPath, configContent);

// Start Vitest UI
const vitestProcess = spawn('yarn', [
  'vitest',
  '--ui',
  '--watch',
  '--standalone',
  '--config', '.vitest.ui-temp.config.ts',
  '--api.port', PORT.toString(),
  '--api.host', '0.0.0.0',
  '--reporter=verbose',
  '--file-parallelism=false'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// Cleanup on exit
const cleanup = () => {
  try {
    fs.unlinkSync(tempConfigPath);
  } catch (e) {
    // Ignore
  }
};

vitestProcess.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  vitestProcess.kill('SIGTERM');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  vitestProcess.kill('SIGTERM');
  cleanup();
  process.exit(0);
});