#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PID_FILE = join(projectRoot, '.vitest-ui.pid');

// Check if process is running
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

async function stopVitestUI() {
  console.log('🛑 Stopping Vitest UI...\n');
  
  try {
    // Try to read PID file
    const pidData = await fs.readFile(PID_FILE, 'utf8');
    const pid = parseInt(pidData.trim());
    
    if (isProcessRunning(pid)) {
      console.log(`📍 Found Vitest UI process (PID: ${pid})`);
      process.kill(pid, 'SIGTERM');
      console.log('✅ Vitest UI stopped successfully!');
    } else {
      console.log('⚠️  Vitest UI process not found (might have already stopped)');
    }
    
    // Clean up PID file
    await fs.unlink(PID_FILE);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('ℹ️  No Vitest UI process is running');
      
      // Also try to kill any vitest UI processes as backup
      try {
        if (process.platform === 'win32') {
          await execAsync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vitest*"');
        } else {
          await execAsync('pkill -f "vitest.*--ui" || true');
        }
        console.log('✅ Cleaned up any stray Vitest UI processes');
      } catch (killError) {
        // Ignore errors from kill commands
      }
    } else {
      console.error('❌ Error stopping Vitest UI:', e.message);
    }
  }
}

// Run
stopVitestUI().catch(console.error);