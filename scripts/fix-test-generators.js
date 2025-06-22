#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const filesToFix = [
  'src/test-generation/config-generator.ts',
  'src/test-generation/integration-test-generator.ts',
  'src/test-generation/unit-test-generator.ts'
];

async function fixTestGenerator(filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    
    // Replace Jest imports with Vitest in template strings
    content = content.replace(
      /@jest\/globals/g,
      'vitest'
    );
    
    // Also fix any jest. references in the templates
    content = content.replace(/\bjest\./g, 'vi.');
    
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Fixing test generator templates...\n');
  
  for (const file of filesToFix) {
    await fixTestGenerator(file);
  }
  
  console.log('\n✨ Test generators updated to use Vitest!');
}

main().catch(console.error);