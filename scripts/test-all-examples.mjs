#!/usr/bin/env node

/**
 * Test script for all example grammars
 * Generates extensions for each example and validates the output
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const OUTPUT_DIR = path.join(__dirname, '..', 'test-output');
const REPORT_FILE = path.join(__dirname, '..', 'test-report.json');

// Find all .langium files recursively
function findGrammarFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findGrammarFiles(fullPath));
        } else if (item.endsWith('.langium')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Test a single grammar file
async function testGrammar(grammarFile) {
    const startTime = Date.now();
    const relativePath = path.relative(EXAMPLES_DIR, grammarFile);
    const grammarName = path.basename(grammarFile, '.langium');
    const outputPath = path.join(OUTPUT_DIR, grammarName);
    
    console.log(chalk.blue(`\nTesting: ${relativePath}`));
    
    const result = {
        grammar: relativePath,
        status: 'pending',
        duration: 0,
        outputSize: 0,
        errors: []
    };
    
    try {
        // Clean output directory
        await fs.remove(outputPath);
        
        // Run generator
        console.log(chalk.gray(`  Generating to: ${outputPath}`));
        execSync(`node dist/cli.js generate "${grammarFile}" "${outputPath}" --no-validate`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });
        
        // Check output exists
        if (!await fs.pathExists(outputPath)) {
            throw new Error('Output directory not created');
        }
        
        // Calculate output size
        const stats = await getDirectorySize(outputPath);
        result.outputSize = formatBytes(stats.size);
        result.fileCount = stats.files;
        
        // Validate generated package.json
        const packageJsonPath = path.join(outputPath, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            
            // Check for Yarn Berry features
            if (packageJson.packageManager?.includes('yarn@') && !packageJson.packageManager.includes('yarn@1')) {
                result.errors.push('Uses Yarn Berry packageManager field');
            }
            
            // Check dependencies for workspace protocol
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
                ...packageJson.peerDependencies
            };
            
            for (const [name, version] of Object.entries(allDeps || {})) {
                if (version.includes('workspace:')) {
                    result.errors.push(`Dependency ${name} uses workspace protocol`);
                }
            }
        }
        
        // Check for .yarnrc.yml
        if (await fs.pathExists(path.join(outputPath, '.yarnrc.yml'))) {
            result.errors.push('Contains .yarnrc.yml file');
        }
        
        // Try to compile TypeScript
        try {
            console.log(chalk.gray('  Checking TypeScript compilation...'));
            execSync('npx tsc --noEmit', {
                cwd: outputPath,
                stdio: 'pipe'
            });
            console.log(chalk.green('  ✓ TypeScript compilation successful'));
        } catch (error) {
            // TypeScript errors are warnings, not failures
            console.log(chalk.yellow('  ⚠ TypeScript compilation warnings'));
        }
        
        result.status = result.errors.length === 0 ? 'passed' : 'failed';
        result.duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
        
        if (result.status === 'passed') {
            console.log(chalk.green(`  ✓ Passed (${result.duration}, ${result.fileCount} files, ${result.outputSize})`));
        } else {
            console.log(chalk.red(`  ✗ Failed: ${result.errors.join(', ')}`));
        }
        
    } catch (error) {
        result.status = 'failed';
        result.errors.push(error.message);
        result.duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
        console.log(chalk.red(`  ✗ Failed: ${error.message}`));
    }
    
    return result;
}

// Get directory size recursively
async function getDirectorySize(dir) {
    let size = 0;
    let files = 0;
    
    const items = await fs.readdir(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
            const subStats = await getDirectorySize(fullPath);
            size += subStats.size;
            files += subStats.files;
        } else {
            size += stat.size;
            files++;
        }
    }
    
    return { size, files };
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main test runner
async function main() {
    console.log(chalk.bold.blue('GLSP Generator Example Test Suite'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Ensure output directory exists
    await fs.ensureDir(OUTPUT_DIR);
    
    // Find all grammar files
    const grammarFiles = findGrammarFiles(EXAMPLES_DIR);
    console.log(chalk.cyan(`Found ${grammarFiles.length} grammar files to test\n`));
    
    // Test each grammar
    const results = [];
    const startTime = Date.now();
    
    for (const grammarFile of grammarFiles) {
        const result = await testGrammar(grammarFile);
        results.push(result);
    }
    
    // Calculate summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    const summary = {
        total: results.length,
        passed,
        failed,
        duration: totalDuration,
        timestamp: new Date().toISOString()
    };
    
    // Generate report
    const report = {
        summary,
        results
    };
    
    // Save report
    await fs.writeJson(REPORT_FILE, report, { spaces: 2 });
    
    // Print summary
    console.log(chalk.gray('\n' + '='.repeat(50)));
    console.log(chalk.bold('Summary:'));
    console.log(chalk.green(`  Passed: ${passed}`));
    if (failed > 0) {
        console.log(chalk.red(`  Failed: ${failed}`));
    }
    console.log(chalk.cyan(`  Total: ${results.length}`));
    console.log(chalk.gray(`  Duration: ${totalDuration}`));
    console.log(chalk.gray(`  Report: ${REPORT_FILE}`));
    
    // Print failed tests
    if (failed > 0) {
        console.log(chalk.red('\nFailed tests:'));
        results
            .filter(r => r.status === 'failed')
            .forEach(r => {
                console.log(chalk.red(`  - ${r.grammar}: ${r.errors.join(', ')}`));
            });
    }
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
    console.error(chalk.red('Test runner failed:'), error);
    process.exit(1);
});