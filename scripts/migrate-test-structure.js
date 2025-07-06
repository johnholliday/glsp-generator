#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function migrateTestStructure() {
  console.log('Migrating test structure...\n');

  // Directories to clean up
  const toRemove = [
    'examples',
    'integration-tests',
    'src/__tests__/fixtures'
  ];

  // Files to remove from test directory
  const testFilesToRemove = [
    'test/test-grammar.langium'
  ];

  console.log('This will:');
  console.log('1. Remove the /examples directory (grammars moved to /test/grammars)');
  console.log('2. Remove the /integration-tests directory (moved to /test/integration)');
  console.log('3. Remove src/__tests__/fixtures directory');
  console.log('4. Remove duplicate test-grammar.langium from /test');
  console.log('\nAll grammar files have been copied to /test/grammars/');
  console.log('Integration tests are now in /test/integration/\n');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Do you want to proceed? (y/N): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('Migration cancelled');
    return;
  }

  // Remove old directories
  for (const dir of toRemove) {
    const fullPath = path.join(projectRoot, dir);
    if (await fs.pathExists(fullPath)) {
      console.log(`Removing ${dir}...`);
      await fs.remove(fullPath);
    }
  }

  // Remove old test files
  for (const file of testFilesToRemove) {
    const fullPath = path.join(projectRoot, file);
    if (await fs.pathExists(fullPath)) {
      console.log(`Removing ${file}...`);
      await fs.remove(fullPath);
    }
  }

  console.log('\nMigration complete!');
  console.log('\nNew structure:');
  console.log('- All test grammars: /test/grammars/');
  console.log('- Unit tests: /test/unit/');
  console.log('- Integration tests: /test/integration/');
  console.log('\nVSCode integration:');
  console.log('- Right-click any .langium file to generate GLSP extension');
  console.log('- Generated output goes to: /generated/<grammar-name>/');
  console.log('\nTo set up VSCode context menus, run:');
  console.log('  node scripts/setup-vscode-menus.js');
}

migrateTestStructure().catch(console.error);