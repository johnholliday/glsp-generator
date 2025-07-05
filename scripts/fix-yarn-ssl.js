#!/usr/bin/env node

/**
 * Script to diagnose and fix Yarn SSL certificate issues
 * This helps with corporate proxy and certificate problems
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

console.log(chalk.cyan('🔧 Yarn SSL Certificate Fix Script\n'));

// Check current Yarn version
try {
  const yarnVersion = execSync('yarn --version', { encoding: 'utf-8' }).trim();
  console.log(chalk.green(`✓ Yarn version: ${yarnVersion}`));
} catch (error) {
  console.error(chalk.red('❌ Yarn not found'));
  process.exit(1);
}

// Check current SSL settings
console.log(chalk.blue('\n📋 Current Yarn SSL Configuration:'));
try {
  const strictSsl = execSync('yarn config get strict-ssl', { encoding: 'utf-8' }).trim();
  console.log(`  strict-ssl: ${strictSsl}`);
  
  const cafile = execSync('yarn config get cafile', { encoding: 'utf-8' }).trim();
  console.log(`  cafile: ${cafile}`);
  
  const registry = execSync('yarn config get registry', { encoding: 'utf-8' }).trim();
  console.log(`  registry: ${registry}`);
} catch (error) {
  console.error(chalk.yellow('  Unable to read some config values'));
}

// Provide solutions
console.log(chalk.blue('\n💡 Solutions for SSL Certificate Issues:\n'));

console.log(chalk.yellow('1. For corporate networks with self-signed certificates:'));
console.log('   yarn config set strict-ssl false');
console.log('   yarn config set cafile null');

console.log(chalk.yellow('\n2. For corporate proxy environments:'));
console.log('   yarn config set proxy http://proxy.company.com:8080');
console.log('   yarn config set https-proxy http://proxy.company.com:8080');

console.log(chalk.yellow('\n3. To reset to defaults:'));
console.log('   yarn config delete strict-ssl');
console.log('   yarn config delete cafile');
console.log('   yarn config delete proxy');
console.log('   yarn config delete https-proxy');

console.log(chalk.yellow('\n4. For offline installation (if you have cached dependencies):'));
console.log('   yarn install --offline');

console.log(chalk.yellow('\n5. To use npm registry mirror:'));
console.log('   yarn config set registry https://registry.npmmirror.com');

// Check if we're in a generated extension directory
const cwd = process.cwd();
const yarnrcPath = path.join(cwd, '.yarnrc');

if (fs.existsSync(yarnrcPath)) {
  console.log(chalk.blue('\n📄 Found .yarnrc file in current directory'));
  
  // Check for problematic settings
  const yarnrcContent = fs.readFileSync(yarnrcPath, 'utf-8');
  if (yarnrcContent.includes('strict-ssl true') && yarnrcContent.includes('cafile null')) {
    console.log(chalk.yellow('⚠️  Detected strict SSL with null cafile - this may cause issues'));
    console.log(chalk.yellow('   Consider temporarily disabling strict-ssl for corporate networks'));
    
    console.log(chalk.blue('\n🔧 Would you like to apply a temporary fix?'));
    console.log(chalk.gray('   This will set strict-ssl to false in the current directory only'));
    console.log(chalk.gray('   Run: yarn config set strict-ssl false'));
  }
}

console.log(chalk.green('\n✅ Diagnosis complete'));
console.log(chalk.cyan('\n📚 For more information:'));
console.log('   https://classic.yarnpkg.com/en/docs/cli/config/');
console.log('   https://classic.yarnpkg.com/blog/2016/09/30/yarn-configuration-options/');