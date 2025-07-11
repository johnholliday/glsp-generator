#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

console.log('Testing VS Code extension command execution...\n');

// Test if glspgen is available
console.log('1. Checking if glspgen is available:');
const which = spawn('which', ['glspgen'], { shell: true });

which.stdout.on('data', (data) => {
    console.log(`   Found: ${data.toString().trim()}`);
});

which.on('close', (code) => {
    if (code !== 0) {
        console.log('   ERROR: glspgen not found in PATH');
    }
    
    // Test running glspgen directly
    console.log('\n2. Testing glspgen command:');
    const glspgen = spawn('glspgen', ['--version'], { shell: true });
    
    glspgen.stdout.on('data', (data) => {
        console.log(`   Version: ${data.toString().trim()}`);
    });
    
    glspgen.stderr.on('data', (data) => {
        console.log(`   Error: ${data.toString().trim()}`);
    });
    
    glspgen.on('close', (code) => {
        if (code === 0) {
            console.log('   SUCCESS: glspgen is working');
        } else {
            console.log('   ERROR: glspgen failed to execute');
        }
        
        // Test with a sample grammar file
        console.log('\n3. Testing generate command:');
        const grammarPath = path.join(process.cwd(), 'sandbox/statemachine/statemachine.langium');
        const outputPath = path.join(process.cwd(), 'test-output');
        
        console.log(`   Grammar: ${grammarPath}`);
        console.log(`   Output: ${outputPath}`);
        console.log(`   Command: glspgen generate "${grammarPath}" -o "${outputPath}"`);
        
        const generate = spawn('glspgen', ['generate', grammarPath, '-o', outputPath], { 
            shell: true,
            cwd: process.cwd()
        });
        
        generate.stdout.on('data', (data) => {
            console.log(`   Output: ${data.toString()}`);
        });
        
        generate.stderr.on('data', (data) => {
            console.log(`   Error: ${data.toString()}`);
        });
        
        generate.on('close', (code) => {
            if (code === 0) {
                console.log('   SUCCESS: Generation completed');
            } else {
                console.log(`   ERROR: Generation failed with code ${code}`);
            }
        });
    });
});