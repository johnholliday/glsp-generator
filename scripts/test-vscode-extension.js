#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing VS Code extension...\n');

// List installed extensions
console.log('1. Checking installed extensions:');
const listExt = spawn('code', ['--list-extensions'], { shell: true });

listExt.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('glsp.glsp-generator-tools')) {
        console.log('   ✓ GLSP Generator Tools extension is installed');
    }
});

listExt.on('close', (code) => {
    // Check extension details
    console.log('\n2. Checking extension details:');
    const showExt = spawn('code', ['--show-versions'], { shell: true });
    
    showExt.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');
        const glspLine = lines.find(line => line.includes('glsp.glsp-generator-tools'));
        if (glspLine) {
            console.log(`   Extension info: ${glspLine}`);
        }
    });
    
    showExt.on('close', () => {
        console.log('\n3. To debug the extension:');
        console.log('   - Open VS Code Developer Tools: Help > Toggle Developer Tools');
        console.log('   - Check the Console tab for any errors');
        console.log('   - Look for "GLSP Generator Tools is now active!" message');
        console.log('   - Try the command and check for error messages in console');
        
        console.log('\n4. Manual verification steps:');
        console.log('   a. Open a .langium file in VS Code');
        console.log('   b. Open Command Palette (Ctrl/Cmd+Shift+P)');
        console.log('   c. Type "GLSP" - you should see the commands');
        console.log('   d. If commands appear but fail, check Developer Tools console');
        console.log('   e. If no commands appear, the extension may not be activating');
    });
});