#!/usr/bin/env node

/**
 * Debug script for GLSP generator integration testing
 * This script generates the GLSP extension and optionally launches VSCode
 */

import fs from 'fs-extra';
import path from 'path';
import { spawn, execSync } from 'child_process';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GRAMMAR_FILE = 'statemachine.langium';
const OUTPUT_DIR = 'output';
const GLSP_CLI = path.join(__dirname, '..', '..', 'dist', 'cli.js');

// Parse command line arguments
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');
const noLaunch = args.includes('--no-launch');
const debug = args.includes('--debug');

// Check if GLSP CLI exists
if (!fs.existsSync(GLSP_CLI)) {
  console.error(chalk.red('❌ GLSP CLI not found. Please run "yarn build" first.'));
  process.exit(1);
}

// Check if grammar file exists
const grammarPath = path.join(__dirname, GRAMMAR_FILE);
if (!fs.existsSync(grammarPath)) {
  console.error(chalk.red(`❌ Grammar file not found: ${GRAMMAR_FILE}`));
  process.exit(1);
}

/**
 * Clean the output directory
 */
async function cleanOutput() {
  const outputPath = path.join(__dirname, OUTPUT_DIR);
  if (await fs.pathExists(outputPath)) {
    console.log(chalk.yellow('🧹 Cleaning output directory...'));
    await fs.remove(outputPath);
  }
}

/**
 * Generate the GLSP extension
 */
async function generate() {
  console.log(chalk.blue('🚀 Generating GLSP extension...'));
  
  return new Promise((resolve, reject) => {
    const args = ['generate', GRAMMAR_FILE, '-o', OUTPUT_DIR];
    if (debug) args.push('--debug');
    
    const proc = spawn('node', [GLSP_CLI, ...args], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Generation completed successfully!'));
        resolve();
      } else {
        reject(new Error(`Generation failed with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Build the generated extension
 */
async function buildExtension(extensionPath) {
  console.log(chalk.blue('🔨 Building extension...'));
  
  try {
    // First install dependencies
    console.log(chalk.yellow('📦 Installing dependencies...'));
    execSync('yarn install', {
      cwd: extensionPath,
      stdio: 'inherit'
    });
  } catch (error) {
    if (error.toString().includes('certificate') || error.toString().includes('SSL')) {
      console.error(chalk.red('\n❌ SSL Certificate error detected'));
      console.log(chalk.yellow('\n💡 To fix this issue:'));
      console.log(chalk.yellow('   1. Run: node ../../scripts/fix-yarn-ssl.js'));
      console.log(chalk.yellow('   2. Or temporarily disable SSL: yarn config set strict-ssl false'));
      console.log(chalk.yellow('   3. For corporate proxies, configure proxy settings'));
      throw new Error('SSL certificate issue - see instructions above');
    }
    throw error;
  }
  
  // Then build
  console.log(chalk.yellow('🏗️  Compiling TypeScript...'));
  execSync('yarn build', {
    cwd: extensionPath,
    stdio: 'inherit'
  });
  
  console.log(chalk.green('✅ Build completed successfully!'));
}

/**
 * Package the extension as VSIX
 */
async function packageExtension(extensionPath) {
  console.log(chalk.blue('📦 Packaging extension as VSIX...'));
  
  // Prepare the extension for VSIX packaging
  console.log(chalk.yellow('🔧 Preparing extension for VSCode...'));
  execSync(`node ${path.join(__dirname, '..', '..', 'scripts', 'prepare-vsix.js')} "${extensionPath}"`, {
    stdio: 'inherit'
  });
  
  // Check if vsce is installed globally
  try {
    execSync('vsce --version', { stdio: 'ignore' });
  } catch {
    console.log(chalk.yellow('📥 Installing vsce...'));
    execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
  }
  
  // Create VSIX
  return new Promise((resolve, reject) => {
    try {
      execSync('vsce package --no-dependencies --no-yarn --no-git-tag-version --allow-missing-repository', {
        cwd: extensionPath,
        stdio: 'inherit'
      });
      
      // Find the created VSIX file
      const files = fs.readdirSync(extensionPath);
      const vsixFile = files.find(f => f.endsWith('.vsix'));
      
      if (!vsixFile) {
        throw new Error('VSIX file not found after packaging');
      }
      
      const vsixPath = path.join(extensionPath, vsixFile);
      console.log(chalk.green(`✅ VSIX created: ${vsixFile}`));
      resolve(vsixPath);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create VSCode launch configuration
 */
async function createLaunchConfig() {
  const extensionPath = path.join(__dirname, OUTPUT_DIR);
  const extensions = await fs.readdir(extensionPath);
  const extensionDir = extensions.find(dir => dir.endsWith('-glsp-extension'));
  
  if (!extensionDir) {
    throw new Error('Generated extension directory not found');
  }
  
  const fullExtensionPath = path.join(extensionPath, extensionDir);
  const vscodeDir = path.join(fullExtensionPath, '.vscode');
  
  await fs.ensureDir(vscodeDir);
  
  const launchConfig = {
    version: '0.2.0',
    configurations: [
      {
        name: 'Debug GLSP Extension',
        type: 'extensionHost',
        request: 'launch',
        runtimeExecutable: '${execPath}',
        args: [
          '--extensionDevelopmentPath=${workspaceFolder}'
        ],
        outFiles: [
          '${workspaceFolder}/lib/**/*.js'
        ],
        preLaunchTask: 'npm: build'
      },
      {
        name: 'Debug GLSP Server',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/lib/node/main.js',
        args: ['--stdio'],
        outFiles: [
          '${workspaceFolder}/lib/**/*.js'
        ],
        preLaunchTask: 'npm: build'
      }
    ]
  };
  
  await fs.writeJson(path.join(vscodeDir, 'launch.json'), launchConfig, { spaces: 2 });
  console.log(chalk.green('✅ Created VSCode launch configuration'));
  
  return fullExtensionPath;
}

/**
 * Launch VSCode with the generated extension
 */
function launchVSCode(extensionPath, vsixPath) {
  console.log(chalk.blue('🚀 Launching VSCode...'));
  
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'code.cmd' : 'code';
    
    // Install the VSIX extension
    console.log(chalk.yellow('📥 Installing extension in VSCode...'));
    execSync(`${command} --install-extension "${vsixPath}"`, { stdio: 'inherit' });
    
    // Launch VSCode with the extension development folder
    execSync(`${command} "${extensionPath}"`, { stdio: 'inherit' });
    console.log(chalk.green('✅ VSCode launched with extension installed'));
    
    // Create a test workspace file
    const testWorkspacePath = path.join(extensionPath, 'test-workspace');
    if (!fs.existsSync(testWorkspacePath)) {
      fs.mkdirSync(testWorkspacePath, { recursive: true });
      // Create a sample state machine file
      fs.writeFileSync(path.join(testWorkspacePath, 'example.sm'), `// Example state machine
statemachine TrafficLight {
  state Red {
    entry: "turnOnRed"
    exit: "turnOffRed"
  }
  
  state Yellow {
    entry: "turnOnYellow"
    exit: "turnOffYellow"
  }
  
  state Green {
    entry: "turnOnGreen"
    exit: "turnOffGreen"
  }
  
  transition RedToGreen {
    source: Red
    target: Green
    event: "timer"
  }
  
  transition GreenToYellow {
    source: Green
    target: Yellow
    event: "timer"
  }
  
  transition YellowToRed {
    source: Yellow
    target: Red
    event: "timer"
  }
}
`);
      console.log(chalk.green('✅ Created test workspace with example file'));
    }
    
    console.log(chalk.cyan('\n💡 To test the extension:'));
    console.log(chalk.cyan('   1. Open the test-workspace folder in VSCode'));
    console.log(chalk.cyan('   2. Open example.sm to see syntax highlighting'));
    console.log(chalk.cyan('   3. Use Command Palette to access GLSP commands'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to launch VSCode:'), error.message);
    console.log(chalk.yellow('💡 You can manually install the extension:'));
    console.log(chalk.yellow(`   code --install-extension "${vsixPath}"`));
    console.log(chalk.yellow(`   code "${extensionPath}"`));
  }
}

/**
 * Find the generated extension directory
 */
async function findExtensionDir() {
  const outputPath = path.join(__dirname, OUTPUT_DIR);
  const entries = await fs.readdir(outputPath);
  const extensionDir = entries.find(dir => dir.endsWith('-glsp-extension'));
  
  if (!extensionDir) {
    throw new Error('Generated extension directory not found');
  }
  
  return path.join(outputPath, extensionDir);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(chalk.cyan('\n🔧 GLSP Generator Debug Script\n'));
    
    // Build the generator first
    console.log(chalk.blue('🏗️  Building GLSP generator...'));
    execSync('yarn build', {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'inherit'
    });
    
    // Initial generation
    await cleanOutput();
    await generate();
    
    // Find the generated extension
    const extensionPath = await findExtensionDir();
    
    // Build and package the extension
    await buildExtension(extensionPath);
    const vsixPath = await packageExtension(extensionPath);
    
    // Setup VSCode if not in no-launch mode
    if (!noLaunch) {
      await createLaunchConfig();
      launchVSCode(extensionPath, vsixPath);
    } else {
      console.log(chalk.green(`\n✅ Extension packaged: ${vsixPath}`));
      console.log(chalk.cyan('💡 To install manually:'));
      console.log(chalk.cyan(`   code --install-extension "${vsixPath}"`));
    }
    
    // Watch mode
    if (watchMode) {
      console.log(chalk.blue('\n👀 Watching for changes...\n'));
      
      const watcher = chokidar.watch([
        path.join(__dirname, '*.langium'),
        path.join(__dirname, '..', '..', 'templates', '**/*'),
        path.join(__dirname, '..', '..', 'src', 'templates', '**/*')
      ], {
        ignored: /node_modules/,
        persistent: true
      });
      
      let isGenerating = false;
      
      watcher.on('change', async (filePath) => {
        if (!isGenerating) {
          isGenerating = true;
          console.log(chalk.yellow(`\n📝 File changed: ${path.relative(__dirname, filePath)}`));
          
          try {
            // Rebuild generator if source files changed
            if (filePath.includes('/src/') || filePath.includes('/templates/')) {
              console.log(chalk.blue('🏗️  Rebuilding GLSP generator...'));
              execSync('yarn build', {
                cwd: path.join(__dirname, '..', '..'),
                stdio: 'inherit'
              });
            }
            
            await cleanOutput();
            await generate();
            
            // Find and build the extension
            const extensionPath = await findExtensionDir();
            await buildExtension(extensionPath);
            const vsixPath = await packageExtension(extensionPath);
            
            if (!noLaunch) {
              await createLaunchConfig();
              console.log(chalk.yellow('💡 Reinstall extension in VSCode:'));
              console.log(chalk.yellow(`   code --install-extension "${vsixPath}"`));
              console.log(chalk.yellow('   Then reload VSCode window (Ctrl+R / Cmd+R)'));
            }
          } catch (error) {
            console.error(chalk.red('❌ Regeneration failed:'), error.message);
          }
          
          isGenerating = false;
        }
      });
      
      // Keep process alive
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n👋 Stopping watch mode...'));
        watcher.close();
        process.exit(0);
      });
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    if (debug) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);