#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 51204;
const PID_FILE = join(projectRoot, '.vitest-ui.pid');

// Get WSL2 IP address
function getWSLIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('172.')) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.error('Error getting WSL IP:', e);
  }
  return 'localhost';
}

// Check if process is running
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Stop existing Vitest UI if running
async function stopExistingProcess() {
  try {
    const pidData = await fs.readFile(PID_FILE, 'utf8');
    const pid = parseInt(pidData.trim());
    if (isProcessRunning(pid)) {
      console.log('🛑 Stopping existing Vitest UI process...');
      process.kill(pid, 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    // No PID file or process not running
  }
}

// Open browser based on platform
function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  
  if (platform === 'win32') {
    cmd = `start ${url}`;
  } else if (platform === 'darwin') {
    cmd = `open ${url}`;
  } else {
    // Linux/WSL - try multiple options
    cmd = `xdg-open ${url} || sensible-browser ${url} || x-www-browser ${url} || gnome-open ${url}`;
  }
  
  exec(cmd, (error) => {
    if (error) {
      console.log('\n📋 Could not open browser automatically.');
      console.log(`   Please open manually: ${url}`);
    }
  });
}

// Check if running in WSL
function isWSL() {
  try {
    const release = os.release().toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
  } catch (e) {
    return false;
  }
}

// Main function
async function startVitestUI() {
  console.log('🚀 Starting Vitest UI...\n');
  
  // Stop any existing process
  await stopExistingProcess();
  
  // Start Vitest UI
  const vitestProcess = spawn('yarn', [
    'vitest',
    '--watch',
    '--ui',
    '--api.port', PORT.toString(),
    '--api.host', '0.0.0.0',
    '--no-coverage',  // Disable coverage for better performance
    '--reporter=verbose'
    // Removed the filter - let UI handle test discovery
  ], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: false
  });
  
  // Save PID
  await fs.writeFile(PID_FILE, vitestProcess.pid.toString());
  
  // Handle process output
  let uiStarted = false;
  
  vitestProcess.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Check if UI started
    if (!uiStarted && output.includes('UI started at')) {
      uiStarted = true;
      console.log('✅ Vitest UI is running!\n');
      
      // Determine URL based on environment
      let url;
      if (isWSL()) {
        const wslIP = getWSLIP();
        url = `http://${wslIP}:${PORT}/__vitest__/`;
        
        console.log('📍 Running in WSL2');
        console.log(`   WSL2 IP: ${wslIP}`);
        console.log('\n🌐 Access Vitest UI at:');
        console.log(`   From Windows: http://${wslIP}:${PORT}/__vitest__/`);
        console.log(`   From WSL2: http://localhost:${PORT}/__vitest__/`);
        console.log('\n💡 Tip: If Windows access fails, run this PowerShell command as Admin:');
        console.log(`   netsh interface portproxy add v4tov4 listenport=${PORT} listenaddress=localhost connectport=${PORT} connectaddress=${wslIP}`);
      } else {
        url = `http://localhost:${PORT}/__vitest__/`;
        console.log(`🌐 Access Vitest UI at: ${url}`);
      }
      
      console.log('\n📝 Instructions:');
      console.log('   • Tests are listed but NOT running automatically');
      console.log('   • Click on specific test files to run them');
      console.log('   • Use the play button to run selected tests');
      console.log('   • Use filters to focus on specific tests');
      console.log('   • Press "a" to run all tests, "f" for failed tests');
      console.log('\n🛑 To stop: run "yarn test:ui:stop" or press Ctrl+C\n');
      
      // Try to open browser
      setTimeout(() => {
        if (!isWSL()) {
          openBrowser(url);
        } else {
          console.log('🔗 Opening browser is not supported in WSL2.');
          console.log('   Please manually open the URL in Windows.\n');
        }
      }, 1000);
    }
    
    // Don't flood console with test output
    if (output.includes('Test Files') || output.includes('FAIL') || output.includes('PASS')) {
      // Suppress repetitive test output
      return;
    }
    
    process.stdout.write(output);
  });
  
  vitestProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  // Handle process exit
  vitestProcess.on('exit', async (code) => {
    console.log(`\n✋ Vitest UI stopped (exit code: ${code})`);
    try {
      await fs.unlink(PID_FILE);
    } catch (e) {
      // Ignore
    }
    process.exit(code || 0);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping Vitest UI...');
    vitestProcess.kill('SIGTERM');
    try {
      await fs.unlink(PID_FILE);
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  });
  
  // Keep process alive
  process.stdin.resume();
}

// Run
startVitestUI().catch(console.error);