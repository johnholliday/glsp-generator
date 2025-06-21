#!/usr/bin/env node

/**
 * Manual test script for watch mode
 * Tests various watch mode scenarios
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

const TEST_DIR = path.join(__dirname, '..', 'test-watch');
const GRAMMAR_FILE = path.join(TEST_DIR, 'test.langium');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');

// Initial grammar content
const INITIAL_GRAMMAR = `
grammar TestGrammar

interface Element {
    id: string
    name: string
}

interface Node extends Element {
    x: number
    y: number
}
`;

// Modified grammar with error
const ERROR_GRAMMAR = `
grammar TestGrammar

interface Element {
    id: string
    name: string
    // Missing closing brace

interface Node extends Element {
    x: number
    y: number
}
`;

// Fixed grammar
const FIXED_GRAMMAR = `
grammar TestGrammar

interface Element {
    id: string
    name: string
    description?: string
}

interface Node extends Element {
    x: number
    y: number
    width?: number
    height?: number
}

interface Edge extends Element {
    source: @Node
    target: @Node
}
`;

async function setup() {
    console.log(chalk.blue('Setting up test environment...'));
    
    // Create test directory
    await fs.ensureDir(TEST_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    
    // Create initial grammar file
    await fs.writeFile(GRAMMAR_FILE, INITIAL_GRAMMAR);
    
    console.log(chalk.green('✓ Test environment ready'));
    console.log(chalk.gray(`  Grammar: ${GRAMMAR_FILE}`));
    console.log(chalk.gray(`  Output: ${OUTPUT_DIR}`));
}

async function cleanup() {
    console.log(chalk.yellow('\nCleaning up...'));
    await fs.remove(TEST_DIR);
    console.log(chalk.green('✓ Cleanup complete'));
}

async function runWatchMode(withServer = false) {
    console.log(chalk.blue('\n' + '='.repeat(50)));
    console.log(chalk.blue(`Testing watch mode ${withServer ? 'with dev server' : 'without server'}`));
    console.log(chalk.blue('='.repeat(50)));
    
    const args = ['dist/cli.js', 'watch', GRAMMAR_FILE, OUTPUT_DIR];
    if (withServer) {
        args.push('--serve', '--port', '3333');
    }
    args.push('--debounce', '300', '--verbose');
    
    const proc = spawn('node', args, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });
    
    // Wait for initial generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Simple change
    console.log(chalk.yellow('\n📝 Test 1: Making a simple change...'));
    await fs.writeFile(GRAMMAR_FILE, FIXED_GRAMMAR);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Introduce error
    console.log(chalk.yellow('\n📝 Test 2: Introducing an error...'));
    await fs.writeFile(GRAMMAR_FILE, ERROR_GRAMMAR);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Fix error
    console.log(chalk.yellow('\n📝 Test 3: Fixing the error...'));
    await fs.writeFile(GRAMMAR_FILE, FIXED_GRAMMAR);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Rapid changes (test debouncing)
    console.log(chalk.yellow('\n📝 Test 4: Making rapid changes...'));
    for (let i = 0; i < 5; i++) {
        await fs.writeFile(GRAMMAR_FILE, INITIAL_GRAMMAR + `\n// Change ${i}`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Stop the process
    console.log(chalk.yellow('\n⏹️  Stopping watch mode...'));
    proc.kill('SIGINT');
    
    // Wait for graceful shutdown
    await new Promise(resolve => {
        proc.on('exit', resolve);
    });
}

async function main() {
    try {
        await setup();
        
        // Test without server
        await runWatchMode(false);
        
        // Test with server
        await runWatchMode(true);
        
        console.log(chalk.green('\n✅ All tests completed successfully!'));
        
    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error);
    } finally {
        await cleanup();
    }
}

// Run tests
main();