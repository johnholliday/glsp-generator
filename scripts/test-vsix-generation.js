#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'blue');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', reject);
  });
}

async function testVsixGeneration() {
  log('Testing VSIX Generation Workflows', 'yellow');
  log('================================', 'yellow');

  const testGrammar = path.join(projectRoot, 'examples', 'statemachine.langium');
  const outputDir = path.join(projectRoot, 'test-output');
  const cliPath = path.join(projectRoot, 'dist', 'cli.js');

  // Ensure test grammar exists
  if (!await fs.pathExists(testGrammar)) {
    log(`Test grammar not found: ${testGrammar}`, 'red');
    log('Creating a simple test grammar...', 'yellow');
    
    await fs.ensureDir(path.dirname(testGrammar));
    await fs.writeFile(testGrammar, `
grammar StateMachine

entry State;

State:
    'state' name=ID
    transitions+=Transition*;

Transition:
    'on' event=ID 'goto' target=[State:ID];

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal WS: /\\s+/;
hidden terminal WS;
`);
  }

  // Clean output directory
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);

  try {
    // Test 1: Default VSIX generation
    log('\nTest 1: Default VSIX Generation', 'green');
    log('-------------------------------', 'green');
    
    const vsixOutput = path.join(outputDir, 'vsix-test');
    await fs.ensureDir(vsixOutput);
    
    await runCommand('node', [cliPath, 'generate', testGrammar, vsixOutput]);
    
    // Check for VSIX file
    const files = await fs.readdir(vsixOutput);
    const vsixFile = files.find(f => f.endsWith('.vsix'));
    
    if (vsixFile) {
      log(`✓ VSIX generated: ${vsixFile}`, 'green');
    } else {
      throw new Error('No VSIX file found');
    }

    // Test 2: Project-only generation
    log('\nTest 2: Project-Only Generation (--no-vsix)', 'green');
    log('-------------------------------------------', 'green');
    
    const projectOutput = path.join(outputDir, 'project-test');
    await runCommand('node', [cliPath, 'generate', testGrammar, projectOutput, '--no-vsix']);
    
    // Check for project files
    const packageJsonPath = path.join(projectOutput, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      log('✓ Project files generated', 'green');
      const packageJson = await fs.readJson(packageJsonPath);
      log(`  Package: ${packageJson.name} v${packageJson.version}`, 'blue');
    } else {
      throw new Error('Project files not found');
    }

    // Test 3: Development mode (skip actual VSCode launch)
    log('\nTest 3: Development Mode (--dev)', 'green');
    log('--------------------------------', 'green');
    log('Skipping actual VSCode launch in test mode', 'yellow');
    
    // Test 4: Debug mode (skip actual VSCode launch)
    log('\nTest 4: Debug Mode (--debug)', 'green');
    log('----------------------------', 'green');
    log('Skipping actual VSCode launch in test mode', 'yellow');

    log('\n✓ All tests passed!', 'green');
    
  } catch (error) {
    log(`\n✗ Test failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Cleanup
    await fs.remove(outputDir);
  }
}

// Run tests
testVsixGeneration().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});