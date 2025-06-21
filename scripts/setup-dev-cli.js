#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log(chalk.blue.bold('🔧 Setting up GLSP CLI for development'));
console.log(chalk.gray('This will make the "glsp" command available globally\n'));

async function runCommand(command, description, options = {}) {
  const spinner = ora(description).start();
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: projectRoot,
      ...options 
    });
    spinner.succeed();
    return true;
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Failed to execute: ${command}`));
    console.error(chalk.gray(error.message));
    return false;
  }
}

async function checkYarnVersion() {
  try {
    const version = execSync('yarn --version', { encoding: 'utf-8' }).trim();
    console.log(chalk.gray(`Using Yarn version: ${version}`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Yarn is not installed or not in PATH'));
    console.error(chalk.yellow('Please install Yarn first: npm install -g yarn'));
    return false;
  }
}

async function checkExistingLink() {
  try {
    // Check if glsp command exists
    execSync('which glsp', { stdio: 'ignore' });
    console.log(chalk.yellow('⚠️  "glsp" command already exists'));
    
    // Try to determine if it's our package
    try {
      const linkedPath = execSync('which glsp', { encoding: 'utf-8' }).trim();
      console.log(chalk.gray(`Current location: ${linkedPath}`));
      
      const response = await import('prompts');
      const { overwrite } = await response.default({
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing link?',
        initial: true
      });
      
      if (!overwrite) {
        console.log(chalk.yellow('Setup cancelled'));
        process.exit(0);
      }
      
      // Unlink existing
      console.log(chalk.gray('Unlinking existing command...'));
      execSync('yarn unlink glsp-generator', { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors when checking
    }
  } catch (error) {
    // Command doesn't exist, which is good
  }
}

async function main() {
  try {
    // Check prerequisites
    if (!await checkYarnVersion()) {
      process.exit(1);
    }

    // Check if package.json exists
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      console.error(chalk.red('❌ package.json not found'));
      console.error(chalk.yellow('Are you running this from the glsp-generator directory?'));
      process.exit(1);
    }

    // Check for existing link
    await checkExistingLink();

    // Build the project first
    console.log(chalk.blue('\n📦 Building project...'));
    if (!await runCommand('yarn build', 'Compiling TypeScript and copying templates')) {
      console.error(chalk.red('\n❌ Build failed. Please fix build errors first.'));
      process.exit(1);
    }

    // Ensure dist/cli.js exists and is executable
    const cliPath = path.join(projectRoot, 'dist', 'cli.js');
    if (!await fs.pathExists(cliPath)) {
      console.error(chalk.red('❌ dist/cli.js not found after build'));
      process.exit(1);
    }

    // Create global link
    console.log(chalk.blue('\n🔗 Creating global link...'));
    if (!await runCommand('yarn link', 'Linking package globally')) {
      console.error(chalk.red('\n❌ Failed to create global link'));
      process.exit(1);
    }

    // Success message
    console.log(chalk.green.bold('\n✅ Setup complete!'));
    console.log(chalk.green('The "glsp" command is now available globally.\n'));
    
    // Show available commands
    console.log(chalk.blue('Available commands:'));
    console.log(chalk.gray('  glsp gen <grammar> [output]    ') + chalk.gray('# Generate GLSP extension'));
    console.log(chalk.gray('  glsp validate <grammar>        ') + chalk.gray('# Validate grammar file'));
    console.log(chalk.gray('  glsp watch <grammar> [output]  ') + chalk.gray('# Watch and regenerate'));
    console.log(chalk.gray('  glsp new <project-name>        ') + chalk.gray('# Create new project'));
    console.log(chalk.gray('  glsp clean                     ') + chalk.gray('# Clean generated files'));
    console.log(chalk.gray('  glsp help                      ') + chalk.gray('# Show help'));
    
    console.log(chalk.blue('\nShort aliases:'));
    console.log(chalk.gray('  glsp g   ') + chalk.gray('# Same as glsp gen'));
    console.log(chalk.gray('  glsp val ') + chalk.gray('# Same as glsp validate'));
    console.log(chalk.gray('  glsp w   ') + chalk.gray('# Same as glsp watch'));
    
    console.log(chalk.blue('\nInteractive mode:'));
    console.log(chalk.gray('  glsp     ') + chalk.gray('# Start interactive mode'));
    
    console.log(chalk.yellow('\nTo unlink later:'));
    console.log(chalk.gray('  yarn unlink glsp-generator'));
    console.log(chalk.gray('  # or'));
    console.log(chalk.gray('  yarn unlink'));

    // Test the command
    console.log(chalk.blue('\n🧪 Testing the command...'));
    try {
      const version = execSync('glsp --version', { encoding: 'utf-8' }).trim();
      console.log(chalk.green(`✅ glsp command works! Version: ${version}`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not verify glsp command'));
      console.warn(chalk.gray('You may need to restart your terminal or add Yarn global bin to PATH'));
      
      // Try to help with PATH
      try {
        const yarnBin = execSync('yarn global bin', { encoding: 'utf-8' }).trim();
        console.log(chalk.yellow(`\nAdd this to your PATH if needed:`));
        console.log(chalk.gray(yarnBin));
      } catch (e) {
        // Ignore
      }
    }

    // PowerShell completion hint
    if (process.platform === 'win32') {
      console.log(chalk.blue('\n💡 PowerShell Completion:'));
      console.log(chalk.gray('  To enable tab completion in PowerShell, run:'));
      console.log(chalk.gray('  . ./scripts/glsp-completion.ps1'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  }
}

// Run the setup
main();