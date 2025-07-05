#!/usr/bin/env node
/**
 * Test runner script with comprehensive options
 * @module scripts
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  string: ['suite', 'grep', 'reporter'],
  boolean: ['coverage', 'watch', 'ui', 'debug', 'updateSnapshots'],
  alias: {
    c: 'coverage',
    w: 'watch',
    u: 'updateSnapshots',
    g: 'grep',
    s: 'suite',
    r: 'reporter',
  },
  default: {
    coverage: false,
    watch: false,
    ui: false,
    debug: false,
    updateSnapshots: false,
  },
});

// Show help
if (argv.help || argv.h) {
  console.log(chalk.cyan('GLSP Generator Test Runner'));
  console.log('\nUsage: yarn test [options]');
  console.log('\nOptions:');
  console.log('  -c, --coverage         Run with coverage report');
  console.log('  -w, --watch           Run in watch mode');
  console.log('  --ui                  Open Vitest UI');
  console.log('  -u, --updateSnapshots Update snapshots');
  console.log('  -g, --grep <pattern>  Run tests matching pattern');
  console.log('  -s, --suite <name>    Run specific test suite (unit, integration)');
  console.log('  -r, --reporter <name> Use specific reporter');
  console.log('  --debug               Run with debug output');
  console.log('  --help                Show this help');
  console.log('\nExamples:');
  console.log('  yarn test                          # Run all tests');
  console.log('  yarn test -c                       # Run with coverage');
  console.log('  yarn test -w                       # Watch mode');
  console.log('  yarn test -s unit                  # Run unit tests only');
  console.log('  yarn test -g "Parser"              # Run tests matching "Parser"');
  console.log('  yarn test --ui                     # Open test UI');
  process.exit(0);
}

// Ensure test results directory exists
const testResultsDir = join(projectRoot, 'test-results');
if (!existsSync(testResultsDir)) {
  mkdirSync(testResultsDir, { recursive: true });
}

// Build vitest command
const vitestArgs = ['vitest', 'run'];

// Remove 'run' for watch or UI mode
if (argv.watch || argv.ui) {
  vitestArgs.pop();
}

// Add mode flags
if (argv.watch) {
  vitestArgs.push('--watch');
}

if (argv.ui) {
  vitestArgs.push('--ui');
}

// Add coverage
if (argv.coverage) {
  vitestArgs.push('--coverage');
}

// Add update snapshots
if (argv.updateSnapshots) {
  vitestArgs.push('--update');
}

// Add grep pattern
if (argv.grep) {
  vitestArgs.push('--grep', argv.grep);
}

// Add reporter
if (argv.reporter) {
  vitestArgs.push('--reporter', argv.reporter);
}

// Add test suite filter
if (argv.suite) {
  const suiteMap = {
    unit: 'test/unit/**/*.test.ts',
    integration: 'test/integration/**/*.test.ts',
  };
  
  if (suiteMap[argv.suite]) {
    vitestArgs.push(suiteMap[argv.suite]);
  } else {
    console.error(chalk.red(`Unknown test suite: ${argv.suite}`));
    console.log(chalk.yellow('Available suites: unit, integration'));
    process.exit(1);
  }
}

// Add config file
vitestArgs.push('--config', 'test/vitest.config.ts');

// Add any remaining arguments
if (argv._.length > 0) {
  vitestArgs.push(...argv._);
}

// Set environment variables
const env = { ...process.env };

if (argv.debug) {
  env.DEBUG = 'glsp-generator:*';
  env.LOG_LEVEL = 'debug';
}

// Show command being run
console.log(chalk.cyan('Running tests with command:'));
console.log(chalk.gray(`  npx ${vitestArgs.join(' ')}`));
console.log();

// Run vitest
const vitest = spawn('npx', vitestArgs, {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: true,
});

// Handle exit
vitest.on('close', (code) => {
  if (code === 0) {
    console.log(chalk.green('\n✅ Tests completed successfully!'));
    
    if (argv.coverage) {
      console.log(chalk.cyan('\n📊 Coverage report generated:'));
      console.log(chalk.gray(`   HTML: ${join(projectRoot, 'coverage/index.html')}`));
      console.log(chalk.gray(`   LCOV: ${join(projectRoot, 'coverage/lcov.info')}`));
    }
  } else {
    console.log(chalk.red(`\n❌ Tests failed with code ${code}`));
  }
  
  process.exit(code || 0);
});

// Handle errors
vitest.on('error', (error) => {
  console.error(chalk.red('Failed to run tests:'), error);
  process.exit(1);
});