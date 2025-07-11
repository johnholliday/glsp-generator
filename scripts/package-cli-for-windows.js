#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const generatorDir = join(rootDir, 'packages', 'generator');

console.log('📦 Packaging GLSP Generator CLI for Windows installation...\n');

// Create a temporary directory for packaging
const tempDir = join(rootDir, '.tmp-windows-cli');
const packageDir = join(tempDir, 'glsp-generator-cli');

try {
    // Clean up any existing temp directory
    await fs.remove(tempDir);
    await fs.ensureDir(packageDir);
    
    // Copy essential files
    console.log('📋 Copying distribution files...');
    await fs.copy(join(generatorDir, 'dist'), join(packageDir, 'dist'));
    await fs.copy(join(generatorDir, 'package.json'), join(packageDir, 'package.json'));
    
    // Copy templates if they exist
    const templatesDir = join(generatorDir, 'templates');
    if (await fs.pathExists(templatesDir)) {
        await fs.copy(templatesDir, join(packageDir, 'templates'));
    }
    
    // Create a minimal package.json for global installation
    const packageJson = await fs.readJson(join(packageDir, 'package.json'));
    
    // Remove dev dependencies and scripts we don't need
    delete packageJson.devDependencies;
    delete packageJson.scripts;
    
    // Ensure bin paths are correct
    packageJson.bin = {
        glsp: "./dist/cli.js",
        glspgen: "./dist/cli.js"
    };
    
    await fs.writeJson(join(packageDir, 'package.json'), packageJson, { spaces: 2 });
    
    // Create a Windows installation script
    const installScript = `@echo off
echo Installing GLSP Generator CLI...
cd /d "%~dp0"
call npm install --production --no-save
call npm install -g . --force
echo.
echo Installation complete!
glspgen --version
pause`;
    
    await fs.writeFile(join(tempDir, 'install-windows.bat'), installScript);
    
    // Create a README for the package
    const readme = `# GLSP Generator CLI for Windows

This package contains the GLSP Generator CLI ready for Windows installation.

## Installation

1. Run install-windows.bat
2. The glsp and glspgen commands will be available globally

## Usage

glspgen generate <grammar-file> -o <output-dir>
`;
    
    await fs.writeFile(join(tempDir, 'README.md'), readme);
    
    console.log(`✅ Package created at: ${tempDir}`);
    console.log('\n📁 Contents:');
    console.log('   - glsp-generator-cli/ (the CLI package)');
    console.log('   - install-windows.bat (installation script)');
    console.log('   - README.md');
    
    return tempDir;
    
} catch (error) {
    console.error('❌ Packaging failed:', error);
    throw error;
}