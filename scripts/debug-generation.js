#!/usr/bin/env node

import { GLSPGenerator } from '../dist/generator.js';
import fs from 'fs-extra';

// Override the generateFiles method to log context
const generator = new GLSPGenerator();

const originalGenerateFiles = generator.generateFiles;
generator.generateFiles = async function(context, extensionDir, useOptimizations) {
    console.log('\n[DEBUG] generateFiles called with context:');
    console.log('Project name:', context.projectName);
    console.log('Interfaces count:', context.grammar.interfaces.length);
    
    const transition = context.grammar.interfaces.find(i => i.name === 'Transition');
    if (transition) {
        console.log('\nTransition interface:');
        transition.properties.forEach(p => {
            console.log(`  ${p.name}: reference=${p.reference}`);
        });
    }
    
    // Call original method
    return originalGenerateFiles.call(this, context, extensionDir, useOptimizations);
};

// Test generation
const testDir = '/tmp/debug-generation-test';
await fs.remove(testDir);

try {
    await generator.generateExtension(
        './integration-tests/example-statemachine/statemachine.langium',
        testDir
    );
} catch (error) {
    console.error('Generation failed:', error);
}