#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const integrationTestsDir = path.join(rootDir, 'integration-tests');

console.log(chalk.blue('🔍 Validating Integration Tests...\n'));

async function validateIntegrationTest(testDir) {
    const testName = path.basename(testDir);
    console.log(chalk.yellow(`\n📂 Testing: ${testName}`));
    
    try {
        // Check for required files
        const requiredFiles = ['debug.js', 'debug.ps1', '.gitignore', 'README.md'];
        const grammarFiles = (await fs.readdir(testDir)).filter(f => f.endsWith('.langium'));
        
        if (grammarFiles.length === 0) {
            throw new Error('No .langium grammar file found');
        }
        
        for (const file of requiredFiles) {
            if (!await fs.pathExists(path.join(testDir, file))) {
                console.log(chalk.red(`  ❌ Missing required file: ${file}`));
            } else {
                console.log(chalk.green(`  ✓ Found: ${file}`));
            }
        }
        
        console.log(chalk.green(`  ✓ Found grammar: ${grammarFiles.join(', ')}`));
        
        // Try to run the generator
        const outputDir = path.join(testDir, 'output');
        console.log(chalk.blue('\n  🏗️  Running generator...'));
        
        try {
            execSync(`node ${path.join(rootDir, 'dist/cli.js')} generate ${grammarFiles[0]} -o output`, {
                cwd: testDir,
                stdio: 'pipe'
            });
            console.log(chalk.green('  ✓ Generation successful'));
            
            // Check if output was created
            if (await fs.pathExists(outputDir)) {
                const files = await fs.readdir(outputDir);
                console.log(chalk.green(`  ✓ Generated ${files.length} items in output/`));
                
                // Try to validate the generated package.json
                const generatedDirs = files.filter(f => fs.statSync(path.join(outputDir, f)).isDirectory());
                for (const dir of generatedDirs) {
                    const packageJsonPath = path.join(outputDir, dir, 'package.json');
                    if (await fs.pathExists(packageJsonPath)) {
                        const packageJson = await fs.readJson(packageJsonPath);
                        console.log(chalk.green(`  ✓ Valid package.json found in ${dir}`));
                        console.log(chalk.gray(`    Name: ${packageJson.name}`));
                        console.log(chalk.gray(`    Version: ${packageJson.version}`));
                        
                        // Check for TypeScript compilation
                        const tsConfigPath = path.join(outputDir, dir, 'tsconfig.json');
                        if (await fs.pathExists(tsConfigPath)) {
                            console.log(chalk.blue('\n  🔨 Testing TypeScript compilation...'));
                            try {
                                execSync('yarn', {
                                    cwd: path.join(outputDir, dir),
                                    stdio: 'pipe'
                                });
                                execSync('yarn build', {
                                    cwd: path.join(outputDir, dir),
                                    stdio: 'pipe'
                                });
                                console.log(chalk.green('  ✓ TypeScript compilation successful'));
                            } catch (compileError) {
                                console.log(chalk.red('  ❌ TypeScript compilation failed'));
                                console.log(chalk.red(`     ${compileError.message}`));
                            }
                        }
                    }
                }
            }
            
        } catch (genError) {
            console.log(chalk.red('  ❌ Generation failed'));
            console.log(chalk.red(`     ${genError.message}`));
            if (genError.stderr) {
                console.log(chalk.red(`     ${genError.stderr.toString()}`));
            }
        }
        
    } catch (error) {
        console.log(chalk.red(`\n❌ Error in ${testName}: ${error.message}`));
    }
}

async function main() {
    // Ensure generator is built
    console.log(chalk.blue('📦 Building generator...'));
    try {
        execSync('yarn build', {
            cwd: rootDir,
            stdio: 'inherit'
        });
    } catch (error) {
        console.log(chalk.red('❌ Failed to build generator'));
        process.exit(1);
    }
    
    // Find all integration test directories
    const testDirs = (await fs.readdir(integrationTestsDir))
        .map(name => path.join(integrationTestsDir, name))
        .filter(p => fs.statSync(p).isDirectory());
    
    console.log(chalk.blue(`\nFound ${testDirs.length} integration test(s)\n`));
    
    for (const testDir of testDirs) {
        await validateIntegrationTest(testDir);
    }
    
    console.log(chalk.green('\n✅ Validation complete!\n'));
}

main().catch(console.error);