#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..', '..');
const vscodeDir = path.join(rootDir, 'packages', 'vscode-extension');

async function buildVSCodeExtension() {
  console.log(chalk.blue('🔨 Building VS Code extension...'));
  
  try {
    // Check if VS Code extension directory exists
    if (!await fs.pathExists(vscodeDir)) {
      console.log(chalk.yellow('⚠️  VS Code extension directory not found, skipping build'));
      return;
    }

    // Change to VS Code extension directory
    process.chdir(vscodeDir);
    
    // Install dependencies if needed
    const nodeModulesExists = await fs.pathExists(path.join(vscodeDir, 'node_modules'));
    if (!nodeModulesExists) {
      console.log(chalk.gray('  Installing VS Code extension dependencies...'));
      execSync('yarn install', { stdio: 'inherit' });
    }
    
    // Compile TypeScript
    console.log(chalk.gray('  Compiling TypeScript...'));
    execSync('yarn compile', { stdio: 'inherit' });
    
    // Get current version from package.json
    const packageJson = await fs.readJson(path.join(vscodeDir, 'package.json'));
    const version = packageJson.version;
    
    // Package the extension with versioned filename
    console.log(chalk.gray(`  Packaging extension v${version}...`));
    const vsixFilename = `glspgen-${version}.vsix`;
    execSync(`yarn dlx @vscode/vsce package --out ${vsixFilename}`, { stdio: 'inherit' });
    
    // Copy VSIX to root packages directory for easy access
    const vsixSource = path.join(vscodeDir, vsixFilename);
    const vsixDest = path.join(rootDir, 'packages', vsixFilename);
    await fs.copy(vsixSource, vsixDest, { overwrite: true });
    
    console.log(chalk.green(`✅ VS Code extension built: ${vsixFilename}`));
    console.log(chalk.gray(`   Available at: ${path.relative(rootDir, vsixDest)}`));
    
    // Create a symlink to latest version for convenience
    const latestLink = path.join(rootDir, 'packages', 'glspgen-latest.vsix');
    if (await fs.pathExists(latestLink)) {
      await fs.unlink(latestLink);
    }
    await fs.copy(vsixDest, latestLink);
    console.log(chalk.gray(`   Latest link: ${path.relative(rootDir, latestLink)}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to build VS Code extension:'), error.message);
    // Don't exit with error - allow main build to continue
    console.log(chalk.yellow('⚠️  Continuing with main build despite VS Code extension build failure'));
  } finally {
    // Return to original directory
    process.chdir(path.join(__dirname, '..'));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildVSCodeExtension().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

export { buildVSCodeExtension };