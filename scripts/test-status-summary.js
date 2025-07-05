#!/usr/bin/env node

/**
 * Script to provide a comprehensive summary of test status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function getTestSummary() {
  console.log(chalk.bold.blue('\n📊 GLSP Generator Test Status Summary\n'));
  
  try {
    // Run tests and capture output
    const { stdout, stderr } = await execAsync('yarn test --run 2>&1', {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const output = stdout + stderr;
    
    // Parse test results
    const testFileMatch = output.match(/Test Files\s+(\d+)\s+failed.*?\((\d+)\)/);
    const testsMatch = output.match(/Tests\s+(\d+)\s+failed.*?\((\d+)\)/);
    const passedMatch = output.match(/Tests\s+(\d+)\s+passed/);
    
    if (testFileMatch && testsMatch) {
      const failedFiles = parseInt(testFileMatch[1]);
      const totalFiles = parseInt(testFileMatch[2]);
      const failedTests = parseInt(testsMatch[1]);
      const totalTests = parseInt(testsMatch[2]);
      const passedTests = passedMatch ? parseInt(passedMatch[1]) : totalTests - failedTests;
      
      console.log(chalk.bold('Test Files:'));
      console.log(`  ${chalk.green('✓ Passed:')} ${totalFiles - failedFiles}/${totalFiles}`);
      console.log(`  ${chalk.red('✗ Failed:')} ${failedFiles}/${totalFiles}`);
      console.log();
      
      console.log(chalk.bold('Individual Tests:'));
      console.log(`  ${chalk.green('✓ Passed:')} ${passedTests}/${totalTests}`);
      console.log(`  ${chalk.red('✗ Failed:')} ${failedTests}/${totalTests}`);
      console.log();
      
      // Extract failing test files
      const failingFiles = [];
      const lines = output.split('\n');
      let inFailedSection = false;
      
      for (const line of lines) {
        if (line.includes('Failed Tests')) {
          inFailedSection = true;
          continue;
        }
        if (inFailedSection && line.includes('FAIL')) {
          const match = line.match(/FAIL\s+(.+?)\s+>/);
          if (match) {
            const file = match[1];
            if (!failingFiles.includes(file)) {
              failingFiles.push(file);
            }
          }
        }
      }
      
      if (failingFiles.length > 0) {
        console.log(chalk.bold.red('Failed Test Files:'));
        
        // Group by category
        const categories = {
          'commands': [],
          'generator': [],
          'performance': [],
          'documentation': [],
          'test-generation': [],
          'cicd': [],
          'other': []
        };
        
        failingFiles.forEach(file => {
          if (file.includes('commands/')) categories.commands.push(file);
          else if (file.includes('generator')) categories.generator.push(file);
          else if (file.includes('performance/')) categories.performance.push(file);
          else if (file.includes('documentation/')) categories.documentation.push(file);
          else if (file.includes('test-generation/')) categories['test-generation'].push(file);
          else if (file.includes('cicd/')) categories.cicd.push(file);
          else categories.other.push(file);
        });
        
        for (const [category, files] of Object.entries(categories)) {
          if (files.length > 0) {
            console.log(chalk.yellow(`\n  ${category}:`));
            files.forEach(file => console.log(`    - ${file}`));
          }
        }
      }
      
      // Extract common error patterns
      console.log(chalk.bold.yellow('\n\nCommon Error Patterns:'));
      
      const errorPatterns = {
        'fs-extra issues': /default\.existsSync is not a function|fs.*is not a function/g,
        'DI container issues': /Cannot read properties of undefined.*container/g,
        'Mock expectation mismatches': /expected.*to.*be called|expected.*to deeply equal/g,
        'Memory manager issues': /memory|MemoryManager/gi,
        'Path issues': /tempDir.*undefined|path.*undefined/g,
        'Logger issues': /logger.*undefined|ILoggerService/g
      };
      
      for (const [pattern, regex] of Object.entries(errorPatterns)) {
        const matches = output.match(regex);
        if (matches) {
          console.log(`  ${chalk.red('•')} ${pattern}: ${matches.length} occurrences`);
        }
      }
      
      // Provide fix suggestions
      console.log(chalk.bold.blue('\n\n💡 Suggested Fixes:'));
      
      if (output.includes('default.existsSync is not a function')) {
        console.log(chalk.cyan('\n1. fs-extra mock issues:'));
        console.log('   - Ensure test/mocks/fs-extra.ts exports both default and named exports');
        console.log('   - Check that vi.mock("fs-extra") is called before any imports');
        console.log('   - Verify test/utils/setup.ts includes the fs-extra mock');
      }
      
      if (output.includes('Cannot read properties of undefined')) {
        console.log(chalk.cyan('\n2. Dependency Injection issues:'));
        console.log('   - Check that all required TYPES symbols are defined');
        console.log('   - Verify services are properly bound in containers');
        console.log('   - Ensure @injectable() decorators are present');
      }
      
      if (output.includes('expected') && output.includes('to be called')) {
        console.log(chalk.cyan('\n3. Mock expectation issues:'));
        console.log('   - Review mock implementations vs actual usage');
        console.log('   - Check async vs sync method calls');
        console.log('   - Verify mock return values match expected types');
      }
      
      console.log(chalk.bold.green('\n\n✨ Next Steps:'));
      console.log('1. Run "node scripts/fix-failing-tests.js" to apply automated fixes');
      console.log('2. Run individual test files to debug specific issues');
      console.log('3. Check test file imports and mock setups');
      console.log('4. Review recent changes that might have broken tests\n');
      
    } else {
      console.log(chalk.red('Unable to parse test results. Raw output:'));
      console.log(output.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error(chalk.red('Error running tests:'), error.message);
    console.log(chalk.yellow('\nTry running "yarn test --run" directly to see the full output'));
  }
}

getTestSummary().catch(console.error);