#!/usr/bin/env node

/**
 * Script to analyze and fix failing tests in the GLSP Generator project
 * 
 * Main issues identified:
 * 1. Logger initialization in GLSPGenerator constructor
 * 2. DI container issues in minimal-container.ts
 * 3. fs-extra mock missing default export
 * 4. Memory manager mock expectations not matching reality
 * 5. tempDir undefined in tests
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// List of issues and their fixes
const fixes = [
  {
    name: 'Add missing crypto import in generator.ts',
    file: 'src/generator.ts',
    search: 'import { LogMethod } from \'./utils/decorators/log-method.js\';',
    replace: `import { LogMethod } from './utils/decorators/log-method.js';
import crypto from 'crypto';`
  },
  {
    name: 'Fix fs-extra mock to include default export',
    file: 'src/__tests__/commands/generate.command.test.ts',
    search: `vi.mock('fs-extra', () => ({
  pathExists: vi.fn().mockResolvedValue(true),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([])
}));`,
    replace: `vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn().mockResolvedValue(true),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readJsonSync: vi.fn().mockReturnValue({}),
    stat: vi.fn().mockResolvedValue({ size: 1024 })
  },
  pathExists: vi.fn().mockResolvedValue(true),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([])
}));`
  },
  {
    name: 'Fix minimal-container context issue',
    file: 'src/config/di/minimal-container.ts',
    search: `  container.bind<ILogger>(TYPES.Logger).toDynamicValue((context: any) => {
    const factory = context.container.get(TYPES.LoggerFactory) as ILoggerFactory;
    return factory.createLogger('CLI');
  }).inTransientScope();`,
    replace: `  container.bind<ILogger>(TYPES.Logger).toDynamicValue((context) => {
    const factory = context.container.get<ILoggerFactory>(TYPES.LoggerFactory);
    return factory.createLogger('CLI');
  }).inTransientScope();`
  },
  {
    name: 'Add missing TYPES symbols',
    file: 'src/config/di/types.ts',
    search: 'export const TYPES = {',
    multipleReplacements: [
      {
        search: '    // Services',
        replace: `    // Service Interfaces
    ILoggerService: Symbol.for('ILoggerService'),
    IGrammarParserService: Symbol.for('IGrammarParserService'),
    ILinterService: Symbol.for('ILinterService'),
    IValidationReporterService: Symbol.for('IValidationReporterService'),
    IDocumentationGeneratorService: Symbol.for('IDocumentationGeneratorService'),
    ITypeSafetyGeneratorService: Symbol.for('ITypeSafetyGeneratorService'),
    ITestGeneratorService: Symbol.for('ITestGeneratorService'),
    ICICDGeneratorService: Symbol.for('ICICDGeneratorService'),
    ITemplateSystemService: Symbol.for('ITemplateSystemService'),
    IPerformanceOptimizerService: Symbol.for('IPerformanceOptimizerService'),
    
    // Services`
      }
    ]
  },
  {
    name: 'Fix tempDir initialization in test files',
    searchPattern: 'tempDir: string;',
    replacementPattern: 'tempDir: string = \'\';',
    filePattern: '**/*.test.ts'
  },
  {
    name: 'Create global fs-extra mock',
    createFile: 'test/mocks/fs-extra.ts',
    content: `import { vi } from 'vitest';

// Mock fs-extra module
export const mockFsExtra = {
  pathExists: vi.fn().mockResolvedValue(true),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  readFile: vi.fn().mockResolvedValue(''),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readJsonSync: vi.fn().mockReturnValue({}),
  readJson: vi.fn().mockResolvedValue({}),
  writeJson: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ 
    size: 1024,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date()
  }),
  remove: vi.fn().mockResolvedValue(undefined),
  mkdtemp: vi.fn().mockResolvedValue('/tmp/test-'),
  copy: vi.fn().mockResolvedValue(undefined),
  emptyDir: vi.fn().mockResolvedValue(undefined)
};

// Export both named and default
export default mockFsExtra;
`
  },
  {
    name: 'Update vitest setup to mock fs-extra',
    file: 'test/utils/setup.ts',
    search: `import 'reflect-metadata';
import { beforeEach } from 'vitest';

// Ensure test environment
beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
});`,
    replace: `import 'reflect-metadata';
import { beforeEach, vi } from 'vitest';

// Mock fs-extra globally
vi.mock('fs-extra', async () => {
  const mockFsExtra = await import('../mocks/fs-extra');
  return mockFsExtra.default;
});

// Ensure test environment
beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
});`
  },
  {
    name: 'Fix memory manager mock method calls',
    file: 'src/performance/__tests__/memory-manager.test.ts',
    multipleReplacements: [
      {
        search: 'getMemoryUsage: vi.fn().mockReturnValue(mockMemoryUsage),',
        replace: 'getMemoryUsage: vi.fn().mockResolvedValue(mockMemoryUsage),'
      },
      {
        search: 'isMemoryPressure: vi.fn().mockReturnValue(false),',
        replace: 'isMemoryPressure: vi.fn().mockResolvedValue(false),'
      },
      {
        search: 'forceGC: vi.fn().mockReturnValue(true),',
        replace: 'forceGC: vi.fn().mockResolvedValue(true),'
      }
    ]
  }
];

async function applyFix(fix) {
  console.log(chalk.blue(`\nApplying fix: ${fix.name}`));
  
  if (fix.createFile) {
    const filePath = path.join(projectRoot, fix.createFile);
    const dir = path.dirname(filePath);
    
    await fs.ensureDir(dir);
    await fs.writeFile(filePath, fix.content, 'utf-8');
    console.log(chalk.green(`  ✓ Created: ${fix.createFile}`));
    return true;
  }
  
  if (fix.file) {
    const filePath = path.join(projectRoot, fix.file);
    
    if (!await fs.pathExists(filePath)) {
      console.log(chalk.yellow(`  File not found: ${fix.file}`));
      return false;
    }
    
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    
    if (fix.search && fix.replace) {
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        modified = true;
      }
    }
    
    if (fix.multipleReplacements) {
      for (const replacement of fix.multipleReplacements) {
        if (content.includes(replacement.search)) {
          content = content.replace(replacement.search, replacement.replace);
          modified = true;
        }
      }
    }
    
    if (fix.search && fix.searchEnd && fix.additions) {
      const startIndex = content.indexOf(fix.search);
      const endIndex = content.indexOf(fix.searchEnd, startIndex);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const beforeEnd = content.substring(0, endIndex);
        const afterEnd = content.substring(endIndex);
        
        // Check if additions already exist
        const missingAdditions = fix.additions.filter(addition => 
          !beforeEnd.includes(addition.trim())
        );
        
        if (missingAdditions.length > 0) {
          const lines = beforeEnd.split('\n');
          const lastLine = lines[lines.length - 1];
          
          // Add missing additions
          const additions = missingAdditions.map(add => `  ${add}`).join('\n');
          content = beforeEnd + '\n' + additions + '\n' + afterEnd;
          modified = true;
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(chalk.green(`  ✓ Fixed: ${fix.file}`));
      return true;
    } else {
      console.log(chalk.gray(`  - No changes needed: ${fix.file}`));
      return false;
    }
  }
  
  if (fix.filePattern) {
    const { globby } = await import('globby');
    const files = await globby(fix.filePattern, { cwd: projectRoot });
    let fixedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      let content = await fs.readFile(filePath, 'utf-8');
      
      if (content.includes(fix.searchPattern)) {
        content = content.replace(new RegExp(fix.searchPattern, 'g'), fix.replacementPattern);
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(chalk.green(`  ✓ Fixed: ${file}`));
        fixedCount++;
      }
    }
    
    if (fixedCount === 0) {
      console.log(chalk.gray(`  - No files needed fixing`));
    }
    
    return fixedCount > 0;
  }
  
  return false;
}

async function createMissingTypesFile() {
  const typesPath = path.join(projectRoot, 'src/config/di/types.inversify.ts');
  
  if (!await fs.pathExists(typesPath)) {
    console.log(chalk.blue('\nCreating missing types.inversify.ts file'));
    
    const content = `/**
 * Inversify type symbols for dependency injection
 */

export const TYPES = {
  // Core services
  IGenerator: Symbol.for('IGenerator'),
  IParser: Symbol.for('IParser'),
  IValidator: Symbol.for('IValidator'),
  ITemplateEngine: Symbol.for('ITemplateEngine'),
  
  // Infrastructure
  ILogger: Symbol.for('ILogger'),
  ILoggerService: Symbol.for('ILoggerService'),
  LoggerFactory: Symbol.for('LoggerFactory'),
  IFileSystem: Symbol.for('IFileSystem'),
  IEventBus: Symbol.for('IEventBus'),
  IErrorHandler: Symbol.for('IErrorHandler'),
  
  // Parser services
  IGrammarParserService: Symbol.for('IGrammarParserService'),
  ILinterService: Symbol.for('ILinterService'),
  
  // Generation services
  IDocumentationGeneratorService: Symbol.for('IDocumentationGeneratorService'),
  IValidationReporterService: Symbol.for('IValidationReporterService'),
  ICICDGeneratorService: Symbol.for('ICICDGeneratorService'),
  ITemplateSystemService: Symbol.for('ITemplateSystemService'),
  IPerformanceOptimizerService: Symbol.for('IPerformanceOptimizerService'),
  ITypeSafetyGeneratorService: Symbol.for('ITypeSafetyGeneratorService'),
  ITestGeneratorService: Symbol.for('ITestGeneratorService'),
  
  // CLI services
  ConfigLoader: Symbol.for('ConfigLoader'),
  LangiumGrammarParser: Symbol.for('LangiumGrammarParser'),
  GLSPGenerator: Symbol.for('GLSPGenerator'),
  
  // Package info
  PackageInfo: Symbol.for('PackageInfo'),
  
  // Other services
  Logger: Symbol.for('Logger'),
};
`;
    
    await fs.writeFile(typesPath, content, 'utf-8');
    console.log(chalk.green('  ✓ Created types.inversify.ts'));
    return true;
  }
  
  return false;
}

async function main() {
  console.log(chalk.bold('\n🔧 Fixing failing tests in GLSP Generator\n'));
  
  // First ensure types file exists
  await createMissingTypesFile();
  
  let totalFixed = 0;
  
  for (const fix of fixes) {
    try {
      const fixed = await applyFix(fix);
      if (fixed) totalFixed++;
    } catch (error) {
      console.log(chalk.red(`  ✗ Error applying fix: ${error.message}`));
    }
  }
  
  console.log(chalk.bold(`\n✨ Fixes applied: ${totalFixed}`));
  console.log(chalk.gray('\nRun "yarn test" to verify the fixes\n'));
}

main().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});