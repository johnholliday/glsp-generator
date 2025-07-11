#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Parse command line arguments
const action = process.argv[2];
if (!action || !['install', 'uninstall'].includes(action)) {
    console.error('Usage: node manage-vscode-extension.js [install|uninstall]');
    process.exit(1);
}

const EXTENSION_ID = 'docuGenix.glspgen';
const VSIX_FILE = 'glspgen-latest.vsix';
const VSIX_PATH = join(rootDir, 'packages', VSIX_FILE);

// Check if we're in WSL
const isWSL = process.platform === 'linux' && 
              fs.existsSync('/proc/version') && 
              fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');

function runCommand(command, description, silent = false) {
    try {
        if (!silent) {
            console.log(`📦 ${description}...`);
        }
        execSync(command, { stdio: silent ? 'pipe' : 'inherit' });
        if (!silent) {
            console.log(`✅ ${description} - Success`);
        }
        return true;
    } catch (error) {
        if (!silent) {
            console.warn(`⚠️  ${description} - Failed (VS Code might not be installed)`);
        }
        return false;
    }
}

if (action === 'install') {
    console.log('🚀 Installing GLSP Generator VS Code Extension...\n');
    
    // Check if VSIX file exists
    if (!fs.existsSync(VSIX_PATH)) {
        console.error(`❌ Error: VSIX file not found at ${VSIX_PATH}`);
        console.error('   Please build the VS Code extension first');
        process.exit(1);
    }
    
    let installed = false;
    
    // Install in WSL VS Code
    if (isWSL) {
        installed = runCommand(
            `code --install-extension "${VSIX_PATH}"`,
            'Installing in WSL VS Code'
        ) || installed;
        
        // Also try to install in Windows VS Code
        // Copy VSIX to Windows temp directory first to avoid WSL path issues
        try {
            const windowsTempDir = `/mnt/c/Windows/Temp`;
            const tempVsixPath = path.join(windowsTempDir, VSIX_FILE);
            
            // Copy the VSIX file to Windows temp
            execSync(`cp "${VSIX_PATH}" "${tempVsixPath}"`);
            
            // Install from Windows temp directory
            const windowsPath = `C:\\Windows\\Temp\\${VSIX_FILE}`;
            installed = runCommand(
                `cd /mnt/c && cmd.exe /c "code --install-extension ${windowsPath}"`,
                'Installing in Windows VS Code'
            ) || installed;
            
            // Clean up temp file
            try {
                execSync(`rm -f "${tempVsixPath}"`);
            } catch (e) {
                // Ignore cleanup errors
            }
        } catch (error) {
            console.warn('⚠️  Installing in Windows VS Code - Failed (unable to copy VSIX)');
        }
    } else {
        // Running on native system (not WSL)
        installed = runCommand(
            `code --install-extension "${VSIX_PATH}"`,
            'Installing in VS Code'
        ) || installed;
    }
    
    if (installed) {
        console.log('\n✨ Installation complete!');
        console.log('   Restart VS Code to activate the extension');
    } else {
        console.error('\n❌ No VS Code installation found');
        process.exit(1);
    }
    
} else if (action === 'uninstall') {
    console.log('🗑️  Uninstalling GLSP Generator VS Code Extension...\n');
    
    let uninstalled = false;
    
    // Uninstall from WSL VS Code
    if (isWSL) {
        uninstalled = runCommand(
            `code --uninstall-extension ${EXTENSION_ID}`,
            'Uninstalling from WSL VS Code'
        ) || uninstalled;
        
        // Also try to uninstall from Windows VS Code
        uninstalled = runCommand(
            `cmd.exe /c "code --uninstall-extension ${EXTENSION_ID}"`,
            'Uninstalling from Windows VS Code'
        ) || uninstalled;
    } else {
        // Running on native system (not WSL)
        uninstalled = runCommand(
            `code --uninstall-extension ${EXTENSION_ID}`,
            'Uninstalling from VS Code'
        ) || uninstalled;
    }
    
    if (uninstalled) {
        console.log('\n✨ Uninstallation complete!');
    } else {
        console.log('\n⚠️  Extension was not installed or VS Code not found');
    }
}