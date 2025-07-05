#!/usr/bin/env node

import { GLSPGenerator } from '../dist/generator.js';
import fs from 'fs-extra';

// Create minimal test
const generator = new GLSPGenerator();

// Patch the generateFiles method to log what's passed
const originalGenerateFiles = generator.generateFiles;
let capturedContext = null;

generator.generateFiles = async function(context, extensionDir, useOptimizations) {
    capturedContext = context;
    return originalGenerateFiles.call(this, context, extensionDir, useOptimizations);
};

// Generate
await generator.generateExtension(
    './integration-tests/example-statemachine/statemachine.langium',
    '/tmp/minimal-test'
);

// Check what was captured
if (capturedContext) {
    const transition = capturedContext.grammar.interfaces.find(i => i.name === 'Transition');
    if (transition) {
        console.log('\nCaptured Transition interface:');
        transition.properties.forEach(p => {
            console.log(`  ${p.name}: reference=${p.reference}, type=${p.type}`);
        });
    }
}

// Check generated file
const generatedFile = '/tmp/minimal-test/statemachine-glsp-extension/src/server/model/statemachine-server-model.ts';
if (await fs.pathExists(generatedFile)) {
    const content = await fs.readFile(generatedFile, 'utf-8');
    const transitionSection = content.split('case StatemachineModel.TypeHierarchy.transition:')[1]?.split('default:')[0];
    console.log('\nGenerated transition section:');
    console.log(transitionSection?.trim());
}