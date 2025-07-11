#!/usr/bin/env node

import { spawn } from 'child_process';
import chalk from 'chalk';
import { bumpVersion } from './bump-version.js';

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      } else {
        resolve();
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function build() {
  try {
    console.log(chalk.blue('🔨 Starting build process...\n'));
    
    // 1. Bump version
    console.log(chalk.cyan('📦 Bumping version...'));
    const newVersion = await bumpVersion();
    
    // 2. Clean dist directory
    console.log(chalk.cyan('\n🧹 Cleaning dist directory...'));
    await runCommand('rimraf', ['dist']);
    
    // 3. Run TypeScript compiler
    console.log(chalk.cyan('\n📝 Compiling TypeScript...'));
    await runCommand('tsc');
    
    // 4. Copy assets
    console.log(chalk.cyan('\n📋 Copying assets...'));
    await runCommand('node', ['scripts/copy-assets.js']);
    
    console.log(chalk.green.bold(`\n✨ Build completed successfully! Version: ${newVersion}`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Build failed:'), error.message);
    process.exit(1);
  }
}

// Run the build
build();