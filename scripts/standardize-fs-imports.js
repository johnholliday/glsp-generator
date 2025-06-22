#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to update
const filesToUpdate = [
  // Files using regular 'fs'
  'src/documentation/collector.ts',
  'src/documentation/generator.ts',
  'src/documentation/renderer.ts',
  'src/performance/streaming-parser.ts',
  'src/utils/paths.ts',
  
  // Files using namespace import style
  'src/performance/cache-manager.ts',
  'src/performance/monitor.ts',
  
  // File with mixed imports
  'src/test-generation/e2e-test-generator.ts'
];

async function updateFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    let modified = false;
    
    // Replace various fs import patterns with consistent fs-extra
    const replacements = [
      // Replace namespace imports from 'fs'
      {
        pattern: /import\s*\*\s*as\s+fs\s+from\s+['"]fs['"]/g,
        replacement: "import fs from 'fs-extra'"
      },
      // Replace namespace imports from 'fs-extra'
      {
        pattern: /import\s*\*\s*as\s+fs\s+from\s+['"]fs-extra['"]/g,
        replacement: "import fs from 'fs-extra'"
      },
      // Replace named imports from 'fs'
      {
        pattern: /import\s*{\s*createReadStream\s*}\s*from\s+['"]fs['"]/g,
        replacement: "import fs from 'fs-extra'",
        note: 'createReadStream'
      },
      {
        pattern: /import\s*{\s*existsSync\s*}\s*from\s+['"]fs['"]/g,
        replacement: "import fs from 'fs-extra'",
        note: 'existsSync'
      }
    ];
    
    for (const { pattern, replacement, note } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        
        // Handle specific function calls that were using named imports
        if (note === 'createReadStream') {
          content = content.replace(/\bcreateReadStream\(/g, 'fs.createReadStream(');
        } else if (note === 'existsSync') {
          content = content.replace(/\bexistsSync\(/g, 'fs.existsSync(');
        }
      }
    }
    
    // Special handling for e2e-test-generator.ts template strings
    if (filePath.includes('e2e-test-generator.ts')) {
      // Don't modify the template string that generates test code
      // But ensure the main import is correct
      const mainImportPattern = /^import\s+.*\s+from\s+['"]fs-extra['"]/m;
      if (!mainImportPattern.test(content)) {
        // Add the import if it's missing at the top
        const firstImportMatch = content.match(/^import\s+/m);
        if (firstImportMatch) {
          const insertPosition = firstImportMatch.index;
          content = content.slice(0, insertPosition) + 
                   "import fs from 'fs-extra';\n" + 
                   content.slice(insertPosition);
          modified = true;
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

async function findAllFsImports() {
  console.log('🔍 Scanning for any remaining non-standard fs imports...\n');
  
  const srcDir = path.join(rootDir, 'src');
  const files = await findTypeScriptFiles(srcDir);
  const issues = [];
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const relativePath = path.relative(rootDir, file);
    
    // Check for problematic patterns
    if (/import\s+.*\s+from\s+['"]fs['"]/.test(content) && 
        !content.includes("from 'fs-extra'")) {
      issues.push({ file: relativePath, type: 'Uses built-in fs instead of fs-extra' });
    }
    
    if (/import\s*\*\s*as\s+fs\s+from/.test(content)) {
      issues.push({ file: relativePath, type: 'Uses namespace import style' });
    }
  }
  
  return issues;
}

async function findTypeScriptFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...await findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Standardizing fs imports to use fs-extra consistently...\n');
  
  // Update known files
  for (const file of filesToUpdate) {
    await updateFile(file);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Find any remaining issues
  const remainingIssues = await findAllFsImports();
  
  if (remainingIssues.length > 0) {
    console.log('⚠️  Found additional files with non-standard imports:\n');
    for (const issue of remainingIssues) {
      console.log(`  - ${issue.file}: ${issue.type}`);
    }
    console.log('\nConsider adding these files to the update list.');
  } else {
    console.log('✨ All fs imports are now standardized to use fs-extra!');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Run "yarn build" to ensure everything compiles');
  console.log('2. Run "yarn test" to verify tests still pass');
  console.log('3. Check that fs-extra methods are used correctly throughout');
}

main().catch(console.error);