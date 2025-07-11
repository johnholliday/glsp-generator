#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Installing GLSP Generator CLI on Windows from WSL2...\n');

// Check if we're running in WSL
const isWSL = process.platform === 'linux' && 
              fs.existsSync('/proc/version') && 
              fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');

if (!isWSL) {
    console.error('❌ This script should be run from WSL2');
    process.exit(1);
}

// Build paths
const generatorPath = join(rootDir, 'packages', 'generator');
const distPath = join(generatorPath, 'dist');

// Check if built
if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found. Please build first with: yarn build');
    process.exit(1);
}

// Create a simplified approach - use npm pack to create a proper package
try {
    console.log('📦 Creating npm package...');
    
    // Run npm pack in the generator directory with quiet output
    const packResult = execSync('npm pack --quiet', { 
        cwd: generatorPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] // Capture stdout and stderr
    }).trim();
    
    const tarballName = packResult.split('\n').pop(); // Get the last line which is the tarball name
    const tarballPath = join(generatorPath, tarballName);
    
    console.log(`✅ Package created: ${tarballName}`);

    
    // Copy tarball to Windows user temp directory
    // Get Windows username
    let windowsUsername = 'John'; // Default
    try {
        windowsUsername = execSync('cd /mnt/c && cmd.exe /c "echo %USERNAME%"', { encoding: 'utf8', shell: true }).trim();
    } catch (e) {
        console.warn('Could not detect Windows username, using default');
    }
    
    const windowsTempDir = `/mnt/c/Users/${windowsUsername}/AppData/Local/Temp`;
    const windowsTarballPath = join(windowsTempDir, tarballName);
    
    console.log('📋 Copying package to Windows temp directory...');
    fs.copyFileSync(tarballPath, windowsTarballPath);
    
    // Verify the file was copied
    if (!fs.existsSync(windowsTarballPath)) {
        throw new Error(`Failed to copy tarball to Windows temp directory: ${windowsTarballPath}`);
    }
    console.log(`✅ Package copied to: ${windowsTarballPath}`);
    
    // Create installation script with full path
    const wrapperScript = `
@echo off
cd /d "%TEMP%"

echo Installing GLSP Generator CLI on Windows...
echo.

echo Cleaning previous installations...
call npm uninstall -g @glsp/generator glsp glspgen 2>nul

echo Installing from package...
if exist "${tarballName}" (
    echo Found package: ${tarballName}
    call npm install -g "%TEMP%\\${tarballName}" --force
) else (
    echo ERROR: Package not found at %TEMP%\\${tarballName}
    exit /b 1
)

echo.
echo Verifying installation...
where glspgen >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: glspgen command is available
    call glspgen --version
) else (
    where glsp >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: glsp command is available
        call glsp --version
    ) else (
        echo WARNING: Commands not found in PATH. You may need to restart your terminal.
        echo Try closing and reopening your terminal or VS Code.
    )
)

echo.
echo Cleaning up...
del "%TEMP%\\${tarballName}" 2>nul
`;

    const tempBatFile = `/mnt/c/Windows/Temp/install-glsp-${Date.now()}.bat`;
    const windowsTempBatFile = tempBatFile.replace('/mnt/c/', 'C:\\').replace(/\//g, '\\');

    // Write the batch file
    fs.writeFileSync(tempBatFile, wrapperScript);
    
    console.log('📦 Installing GLSP Generator on Windows...');
    
    // Execute the batch file on Windows (change to C: drive first to avoid UNC warning)
    execSync(`cd /mnt/c && cmd.exe /c "${windowsTempBatFile}"`, { 
        stdio: 'inherit',
        encoding: 'utf8',
        shell: true
    });
    
    // Clean up
    fs.unlinkSync(tempBatFile);
    fs.unlinkSync(tarballPath); // Remove the original tarball
    // Windows batch file will clean up the Windows temp tarball
    
    console.log('\n✅ Installation complete!');
    console.log('\n💡 Note: The glsp/glspgen commands are now available in Windows.');
    console.log('   You may need to restart VS Code for it to detect the commands.\n');
    
} catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
}