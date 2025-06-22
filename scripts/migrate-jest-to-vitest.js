#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to migrate
const testFiles = [
  'src/__tests__/generator.test.ts',
  'src/scripts/validate-templates.test.ts',
  'src/cicd/__tests__/workflow-generator.test.ts',
  'test/test-generation/factory-generator.test.ts',
  'test/test-generation/unit-test-generator.test.ts',
  'src/type-safety/__tests__/type-safety-generator.test.ts',
  'src/type-safety/__tests__/validation-generator.test.ts',
  'src/type-safety/__tests__/zod-generator.test.ts',
  'src/type-safety/__tests__/declaration-generator.test.ts',
  'src/documentation/__tests__/example-generator.test.ts',
  'src/documentation/__tests__/documentation-generator.test.ts',
  'src/documentation/__tests__/readme-generator.test.ts',
  'src/watch/integration.test.ts',
  'src/__tests__/langium-parser.test.ts',
  'src/examples/examples.test.ts',
  'src/validation/linter.test.ts',
  'src/config/config-loader.test.ts'
];

async function migrateFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    
    // Replace Jest imports with Vitest imports
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@jest\/globals['"]/g,
      (match, imports) => {
        // Parse the imports and check what needs to be imported from vitest
        const importList = imports.split(',').map(i => i.trim());
        const vitestImports = [];
        
        importList.forEach(imp => {
          if (['describe', 'test', 'it', 'expect', 'beforeEach', 'afterEach', 
               'beforeAll', 'afterAll', 'vi'].includes(imp)) {
            vitestImports.push(imp);
          } else if (imp === 'jest') {
            vitestImports.push('vi');
          }
        });
        
        return `import { ${vitestImports.join(', ')} } from 'vitest'`;
      }
    );
    
    // Replace jest. with vi.
    content = content.replace(/\bjest\./g, 'vi.');
    
    // Replace jest.Mock with vi.Mock
    content = content.replace(/\bjest\.Mock/g, 'vi.Mock');
    
    // Replace jest.fn() with vi.fn()
    content = content.replace(/\bjest\.fn\(/g, 'vi.fn(');
    
    // Replace jest.spyOn with vi.spyOn
    content = content.replace(/\bjest\.spyOn/g, 'vi.spyOn');
    
    // Replace jest.mocked with vi.mocked
    content = content.replace(/\bjest\.mocked/g, 'vi.mocked');
    
    // Write back the modified content
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✅ Migrated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Jest to Vitest migration...\n');
  
  for (const file of testFiles) {
    await migrateFile(file);
  }
  
  // Also check output directories (skip these as they are generated)
  console.log('\n⚠️  Skipping output directory test files (these are generated)');
  
  console.log('\n✨ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Run "yarn test" to verify all tests pass');
  console.log('2. Review any test failures and fix manually');
  console.log('3. Update any remaining Jest references in mock files');
}

main().catch(console.error);