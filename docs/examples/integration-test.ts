#!/usr/bin/env node
/**
 * Integration test demonstrating dependency injection usage
 */
import { GLSPGenerator, LangiumGrammarParser } from '../dist/index.js';
import path from 'path';
import fs from 'fs-extra';

async function testWithDefaultParser() {
    console.log('Testing with default Langium parser...');
    const generator = new GLSPGenerator();
    
    // This will use the default LangiumGrammarParser internally
    const grammarPath = path.join(process.cwd(), 'examples/test-grammar.langium');
    const outputDir = path.join(process.cwd(), 'examples/output-default');
    
    try {
        await generator.generateExtension(grammarPath, outputDir);
        console.log('✅ Generation with default parser successful');
    } catch (error) {
        console.error('❌ Generation failed:', error);
    }
}

async function testWithExplicitParser() {
    console.log('\nTesting with explicitly injected parser...');
    
    // Create parser instance explicitly
    const parser = new LangiumGrammarParser();
    
    // Inject it into the generator
    const generator = new GLSPGenerator(undefined, parser);
    
    const grammarPath = path.join(process.cwd(), 'examples/test-grammar.langium');
    const outputDir = path.join(process.cwd(), 'examples/output-injected');
    
    try {
        await generator.generateExtension(grammarPath, outputDir);
        console.log('✅ Generation with injected parser successful');
    } catch (error) {
        console.error('❌ Generation failed:', error);
    }
}

// Create test grammar file
async function setupTestGrammar() {
    const grammarContent = `
grammar TestGrammar

interface Element {
    id: string
    name?: string
}

interface Node extends Element {
    x: number
    y: number
    type: NodeType
}

interface Edge extends Element {
    source: @Node
    target: @Node
}

type NodeType = 'task' | 'gateway' | 'event'
`;

    await fs.ensureDir('examples');
    await fs.writeFile('examples/test-grammar.langium', grammarContent);
}

// Run tests
async function main() {
    try {
        await setupTestGrammar();
        await testWithDefaultParser();
        await testWithExplicitParser();
        
        console.log('\n✨ All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

main();