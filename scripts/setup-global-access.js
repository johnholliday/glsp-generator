#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const generatorDir = join(rootDir, 'packages', 'generator');

console.log('🚀 Setting up global access to GLSP Generator...\n');

// Function to run command and display output
function runCommand(command, cwd = process.cwd()) {
    console.log(`📦 Running: ${command}`);
    try {
        execSync(command, { 
            cwd, 
            stdio: 'inherit',
            shell: true 
        });
        console.log('✅ Success\n');
        return true;
    } catch (error) {
        console.error(`❌ Failed: ${error.message}\n`);
        return false;
    }
}

// Step 1: Check if we're in the right directory
if (!fs.existsSync(join(rootDir, 'packages'))) {
    console.error('❌ Error: Not in monorepo root directory');
    console.error('Please run this script from the glsp-generator root directory');
    process.exit(1);
}

// Step 2: Build the generator
console.log('📨 Step 1: Building @glsp/generator package...');
if (!runCommand('yarn build:no-version', generatorDir)) {
    console.error('Failed to build generator');
    process.exit(1);
}

// Step 3: Create global link
console.log('🔗 Step 2: Creating global yarn link...');
if (!runCommand('yarn link', generatorDir)) {
    console.error('Failed to create yarn link');
    process.exit(1);
}

// Step 4: Check if VSCode is available
console.log('🎨 Step 3: Installing VSCode extension...');
try {
    execSync('code --version', { stdio: 'pipe' });
    
    const vsixPath = join(rootDir, 'packages', 'vscode-extension', 'glsp-generator-tools-1.0.0.vsix');
    if (!fs.existsSync(vsixPath)) {
        console.warn('⚠️  Warning: VSIX file not found at', vsixPath);
        console.warn('   You may need to build the VSCode extension first');
    } else {
        runCommand(`code --install-extension "${vsixPath}"`);
    }
} catch (error) {
    console.warn('⚠️  Warning: VSCode CLI not found in PATH');
    console.warn('   Please install the extension manually from:');
    console.warn(`   ${join('packages', 'vscode-extension', 'glsp-generator-tools-1.0.0.vsix')}`);
}

// Step 5: Verify installation
console.log('\n🔍 Verifying installation...');

// Check if glsp command is available
try {
    const yarnBin = execSync('yarn global bin', { encoding: 'utf8' }).trim();
    console.log(`\n📍 Yarn global bin directory: ${yarnBin}`);
    
    // Try to find the linked command
    const possiblePaths = [
        join(yarnBin, 'glsp'),
        join(yarnBin, 'glspgen'),
        'glsp',
        'glspgen'
    ];
    
    let commandFound = false;
    for (const cmd of possiblePaths) {
        try {
            execSync(`${cmd} --version`, { stdio: 'pipe' });
            console.log(`✅ Command '${cmd}' is available`);
            commandFound = true;
            break;
        } catch (e) {
            // Command not found, try next
        }
    }
    
    if (!commandFound) {
        console.warn('\n⚠️  Warning: glsp/glspgen commands not found in PATH');
        console.warn('   You may need to add yarn global bin to your PATH:');
        console.warn(`   export PATH="${yarnBin}:$PATH"`);
    }
} catch (error) {
    console.warn('⚠️  Could not verify command availability');
}

console.log('\n✨ Setup complete!');
console.log('\nNext steps:');
console.log('1. If commands are not found, add yarn global bin to your PATH');
console.log('2. Open VSCode and right-click any .langium file to see GLSP commands');
console.log('3. Or use: glsp generate <grammar-file> from the command line');