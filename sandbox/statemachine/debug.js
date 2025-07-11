#!/usr/bin/env node

/**
 * Cross-platform debug script for GLSP extension generation and testing
 * 
 * Usage:
 *   node debug.js                  # Generate and launch VSCode
 *   node debug.js --watch          # Watch mode
 *   node debug.js --no-launch      # Skip VSCode launch
 *   node debug.js --no-clean       # Skip cleaning output
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');
const chokidar = require('chokidar');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    watch: args.includes('--watch') || args.includes('-w'),
    noLaunch: args.includes('--no-launch') || args.includes('-n'),
    clean: !args.includes('--no-clean'),
    help: args.includes('--help') || args.includes('-h')
};

// Show help if requested
if (options.help) {
    console.log(`
Cross-platform GLSP Extension Debug Script

Usage:
  node debug.js [options]

Options:
  --watch, -w       Enable watch mode for auto-regeneration
  --no-launch, -n   Skip launching VSCode after generation
  --no-clean        Skip cleaning output directory
  --help, -h        Show this help message

Examples:
  node debug.js                  # Generate and launch VSCode
  node debug.js --watch          # Watch for changes
  node debug.js --no-launch      # Generate only
`);
    process.exit(0);
}

// Terminal colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Logging helpers
const log = {
    step: (msg) => console.log(`\n${colors.cyan}==>${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    info: (msg) => console.log(`  ${msg}`)
};

// Configuration
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '../..');
const grammarFile = path.join(scriptDir, 'statemachine.langium');
const outputDir = path.join(scriptDir, 'output');
const generatorCli = path.join(projectRoot, 'dist', 'cli.js');

// Check prerequisites
async function checkPrerequisites() {
    log.step('Checking prerequisites...');

    // Check generator CLI
    if (!await fs.pathExists(generatorCli)) {
        log.error(`Generator CLI not found at: ${generatorCli}`);
        log.warning('Please run "yarn build" in the project root first');
        process.exit(1);
    }

    // Check grammar file
    if (!await fs.pathExists(grammarFile)) {
        log.error(`Grammar file not found at: ${grammarFile}`);
        process.exit(1);
    }

    // Check Node.js
    try {
        const nodeVersion = process.version;
        log.success(`Node.js ${nodeVersion} found`);
    } catch (error) {
        log.error('Node.js check failed');
        process.exit(1);
    }
}

// Clean output directory
async function cleanOutput() {
    if (options.clean && await fs.pathExists(outputDir)) {
        log.step('Cleaning output directory...');
        try {
            await fs.remove(outputDir);
            log.success('Output directory cleaned');
        } catch (error) {
            log.warning(`Failed to clean output directory: ${error.message}`);
        }
    }
}

// Generate the extension
async function generate() {
    log.step('Generating GLSP extension...');
    log.info(`Grammar: ${grammarFile}`);
    log.info(`Output: ${outputDir}`);

    return new Promise((resolve) => {
        const child = spawn('node', [generatorCli, 'generate', grammarFile, '-o', outputDir], {
            stdio: 'pipe',
            shell: false
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', async (code) => {
            if (code === 0) {
                log.success('Generation completed successfully');
                
                // Count generated files
                try {
                    const files = await countFiles(outputDir);
                    log.info(`Generated ${files} files`);
                } catch (error) {
                    // Ignore counting errors
                }
                
                resolve(true);
            } else {
                log.error(`Generation failed with exit code: ${code}`);
                if (stderr) {
                    console.error('\nError output:');
                    console.error(stderr);
                }
                resolve(false);
            }
        });

        child.on('error', (error) => {
            log.error(`Failed to run generator: ${error.message}`);
            resolve(false);
        });
    });
}

// Count files recursively
async function countFiles(dir) {
    let count = 0;
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            count += await countFiles(fullPath);
        } else if (item.isFile()) {
            count++;
        }
    }
    
    return count;
}

// Launch VSCode
async function launchVSCode() {
    log.step('Launching VSCode for debugging...');

    // Check if code command is available
    try {
        execSync('code --version', { stdio: 'ignore' });
    } catch (error) {
        log.warning('VSCode "code" command not found in PATH');
        log.info(`You can manually open the output directory in VSCode: ${outputDir}`);
        return;
    }

    // Create .vscode directory and launch.json
    const vscodeDir = path.join(outputDir, '.vscode');
    const launchJson = path.join(vscodeDir, 'launch.json');

    await fs.ensureDir(vscodeDir);

    if (!await fs.pathExists(launchJson)) {
        const launchConfig = {
            version: '0.2.0',
            configurations: [{
                type: 'node',
                request: 'launch',
                name: 'Debug GLSP Server',
                skipFiles: ['<node_internals>/**'],
                program: '${workspaceFolder}/server/server-module.js',
                outFiles: ['${workspaceFolder}/**/*.js'],
                sourceMaps: true,
                console: 'integratedTerminal'
            }]
        };

        await fs.writeJson(launchJson, launchConfig, { spaces: 4 });
    }

    // Open in VSCode
    try {
        spawn('code', [outputDir], { 
            detached: true, 
            stdio: 'ignore',
            shell: false 
        }).unref();
        log.success('VSCode launched');
    } catch (error) {
        log.warning(`Failed to launch VSCode: ${error.message}`);
    }
}

// Watch for changes
async function watchMode() {
    log.step('Starting watch mode...');
    log.info('Watching for changes in:');
    log.info(`  - Grammar file: ${grammarFile}`);
    log.info(`  - Templates directory: ${path.join(projectRoot, 'templates')}`);
    console.log('\nPress Ctrl+C to stop watching\n');

    // Set up file watcher
    const watcher = chokidar.watch([
        grammarFile,
        path.join(projectRoot, 'templates/**/*')
    ], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    });

    watcher.on('change', async (filePath) => {
        console.log(`\n${colors.yellow}File changed:${colors.reset} ${filePath}`);
        
        // Regenerate
        const success = await generate();
        if (success) {
            log.success('Regeneration complete');
        }
    });

    watcher.on('error', (error) => {
        log.error(`Watcher error: ${error.message}`);
    });

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\nStopping watch mode...');
        watcher.close();
        process.exit(0);
    });
}

// Main execution
async function main() {
    console.log(`${colors.magenta}GLSP Extension Debug Script${colors.reset}`);
    console.log('==========================');
    console.log(`Project Root: ${projectRoot}`);
    console.log(`Grammar: ${grammarFile}`);
    console.log(`Output: ${outputDir}`);

    try {
        // Check prerequisites
        await checkPrerequisites();

        // Clean if requested
        await cleanOutput();

        // Generate the extension
        const success = await generate();

        if (success) {
            // Launch VSCode if not disabled
            if (!options.noLaunch) {
                await launchVSCode();
            }

            // Start watch mode if requested
            if (options.watch) {
                await watchMode();
            } else {
                console.log('\nDone!');
            }
        } else {
            log.error('Generation failed. Please check the error messages above.');
            process.exit(1);
        }
    } catch (error) {
        log.error(`Unexpected error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main().catch(console.error);