#!/usr/bin/env node

/**
 * Script to prepare a generated Theia extension for VSIX packaging
 * This adds necessary VSCode extension fields to package.json
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const extensionPath = process.argv[2];

if (!extensionPath) {
  console.error(chalk.red('Usage: node prepare-vsix.js <extension-path>'));
  process.exit(1);
}

async function prepareForVSIX() {
  const packageJsonPath = path.join(extensionPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    console.error(chalk.red(`Package.json not found at: ${packageJsonPath}`));
    process.exit(1);
  }
  
  console.log(chalk.blue('📦 Preparing extension for VSIX packaging...'));
  
  // Read current package.json
  const packageJson = await fs.readJson(packageJsonPath);
  
  // Add VSCode-specific fields if missing
  if (!packageJson.engines?.vscode) {
    packageJson.engines = packageJson.engines || {};
    packageJson.engines.vscode = '^1.70.0';
  }
  
  if (!packageJson.categories) {
    packageJson.categories = ['Programming Languages', 'Other'];
  }
  
  if (!packageJson.activationEvents) {
    const langId = packageJson.name.replace('-glsp-extension', '');
    packageJson.activationEvents = [
      `onLanguage:${langId}`,
      `onCommand:${langId}.diagram.open`
    ];
  }
  
  if (!packageJson.main) {
    packageJson.main = './lib/src/extension/index.js';
  }
  
  if (!packageJson.contributes) {
    const langId = packageJson.name.replace('-glsp-extension', '');
    packageJson.contributes = {
      languages: [{
        id: langId,
        aliases: [langId],
        extensions: [`.${langId}`]
      }],
      commands: [{
        command: `${langId}.diagram.open`,
        title: `Open ${langId} Diagram`,
        category: langId
      }]
    };
  }
  
  // Ensure required scripts
  packageJson.scripts = packageJson.scripts || {};
  if (!packageJson.scripts['vscode:prepublish']) {
    packageJson.scripts['vscode:prepublish'] = packageJson.scripts.build || 'yarn build';
  }
  
  // Add repository information to avoid VSIX packaging errors
  if (!packageJson.repository) {
    packageJson.repository = {
      type: 'git',
      url: 'https://github.com/example/example.git'
    };
  }
  
  // Add publisher field (required for VSIX)
  if (!packageJson.publisher) {
    packageJson.publisher = 'example-publisher';
  }
  
  // Add VSCode dependencies if missing
  packageJson.devDependencies = packageJson.devDependencies || {};
  if (!packageJson.devDependencies['@types/vscode']) {
    packageJson.devDependencies['@types/vscode'] = '^1.70.0';
  }
  
  // Write updated package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  
  console.log(chalk.green('✅ Added VSCode extension fields to package.json'));
  
  // Don't create the extension file here - it should be generated
  // by the GLSP generator with the proper template
  console.log(chalk.green('✅ Extension is ready for VSIX packaging'));
  console.log(chalk.cyan('\nNext step: vsce package'));
}

prepareForVSIX().catch(console.error);