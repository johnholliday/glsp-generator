#!/usr/bin/env node

/**
 * Script to fix dependency injection binding issues
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function fixDIBindings() {
  console.log(chalk.bold.blue('\n🔧 Fixing Dependency Injection Bindings\n'));
  
  // Fix 1: Update src/config/di/container.ts to bind ILoggerService
  const containerPath = path.join(projectRoot, 'src/config/di/container.ts');
  if (await fs.pathExists(containerPath)) {
    console.log(chalk.yellow('Updating container.ts...'));
    let content = await fs.readFile(containerPath, 'utf-8');
    
    // Add ILoggerService binding if missing
    if (!content.includes('TYPES.ILoggerService')) {
      const bindingCode = `
    // Bind ILoggerService (alias for Logger)
    container.bind<ILogger>(TYPES.ILoggerService).toDynamicValue((context) => {
        const factory = context.container.get<ILoggerFactory>(TYPES.LoggerFactory);
        return factory.createLogger('GLSPGenerator');
    }).inTransientScope();
`;
      
      // Insert after Logger binding
      const loggerBindingIndex = content.indexOf('container.bind<ILogger>(TYPES.Logger)');
      if (loggerBindingIndex > -1) {
        const insertIndex = content.indexOf('\n', loggerBindingIndex) + 1;
        content = content.slice(0, insertIndex) + bindingCode + content.slice(insertIndex);
        await fs.writeFile(containerPath, content);
        console.log(chalk.green('  ✓ Added ILoggerService binding'));
      }
    }
  }
  
  // Fix 2: Create a test helper for GLSPGenerator
  const testHelperPath = path.join(projectRoot, 'test/helpers/glsp-generator-helper.ts');
  const testHelperContent = `import { GLSPGenerator } from '../../src/generator';
import { vi } from 'vitest';
import { ILogger } from '../../src/utils/logger';

/**
 * Create a mock GLSPGenerator with all required dependencies
 */
export function createMockGLSPGenerator() {
  const mockLogger: ILogger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis()
  };
  
  const mockServices = {
    parser: {
      parseGrammarFile: vi.fn().mockResolvedValue({
        projectName: 'test',
        interfaces: [],
        types: []
      }),
      parseGrammar: vi.fn().mockResolvedValue({})
    },
    linter: {
      lintGrammar: vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      }),
      formatResults: vi.fn().mockReturnValue('')
    },
    reporter: {
      generateHtmlReport: vi.fn().mockResolvedValue(undefined),
      generateMarkdownReport: vi.fn().mockResolvedValue(undefined)
    },
    documentationGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    typeSafetyGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    testGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    cicdGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    templateSystem: {
      initialize: vi.fn().mockResolvedValue({
        resolveTemplates: vi.fn().mockReturnValue([])
      })
    },
    performanceOptimizer: {
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn().mockResolvedValue(undefined),
      getProgress: vi.fn().mockReturnValue({
        start: vi.fn(),
        startPhase: vi.fn(),
        completePhase: vi.fn(),
        complete: vi.fn(),
        abort: vi.fn(),
        updateProgress: vi.fn()
      }),
      shouldOptimize: vi.fn().mockReturnValue(false),
      getStreamingParser: vi.fn(),
      getCacheManager: vi.fn(),
      getParallelProcessor: vi.fn(),
      getOptimizationRecommendations: vi.fn().mockReturnValue([])
    }
  };
  
  // Create generator with mocked dependencies
  const generator = new GLSPGenerator(
    mockLogger,
    mockServices.parser,
    mockServices.linter,
    mockServices.reporter,
    mockServices.documentationGenerator,
    mockServices.typeSafetyGenerator,
    mockServices.testGenerator,
    mockServices.cicdGenerator,
    mockServices.templateSystem,
    mockServices.performanceOptimizer
  );
  
  return {
    generator,
    mockLogger,
    mockServices
  };
}
`;
  
  await fs.ensureDir(path.dirname(testHelperPath));
  await fs.writeFile(testHelperPath, testHelperContent);
  console.log(chalk.green('  ✓ Created GLSPGenerator test helper'));
  
  // Fix 3: Update test files to use the helper
  const testFiles = [
    'src/__tests__/generator.test.ts',
    'src/__tests__/generator-with-di.test.ts'
  ];
  
  for (const testFile of testFiles) {
    const testPath = path.join(projectRoot, testFile);
    if (await fs.pathExists(testPath)) {
      console.log(chalk.yellow(`Updating ${testFile}...`));
      let content = await fs.readFile(testPath, 'utf-8');
      
      // Add import for test helper
      if (!content.includes('glsp-generator-helper')) {
        const importStatement = `import { createMockGLSPGenerator } from '../../test/helpers/glsp-generator-helper';\n`;
        content = importStatement + content;
      }
      
      // Replace direct instantiation with helper
      content = content.replace(
        /generator = new GLSPGenerator\([^)]*\);/g,
        'const { generator, mockLogger, mockServices } = createMockGLSPGenerator();'
      );
      
      await fs.writeFile(testPath, content);
      console.log(chalk.green(`  ✓ Updated ${testFile}`));
    }
  }
  
  // Fix 4: Update minimal-container to bind ILoggerService
  const minimalContainerPath = path.join(projectRoot, 'src/config/di/minimal-container.ts');
  if (await fs.pathExists(minimalContainerPath)) {
    console.log(chalk.yellow('Updating minimal-container.ts...'));
    let content = await fs.readFile(minimalContainerPath, 'utf-8');
    
    if (!content.includes('TYPES.ILoggerService')) {
      // Add after Logger binding
      const loggerBinding = content.indexOf('container.bind<ILogger>(TYPES.Logger)');
      if (loggerBinding > -1) {
        const endOfBinding = content.indexOf(';', loggerBinding) + 1;
        const bindingCode = `
  
  // Also bind as ILoggerService for compatibility
  container.bind<ILogger>(TYPES.ILoggerService).toDynamicValue((context) => {
    return context.container.get<ILogger>(TYPES.Logger);
  }).inTransientScope();`;
        
        content = content.slice(0, endOfBinding) + bindingCode + content.slice(endOfBinding);
        await fs.writeFile(minimalContainerPath, content);
        console.log(chalk.green('  ✓ Added ILoggerService binding to minimal container'));
      }
    }
  }
  
  console.log(chalk.bold.green('\n✨ DI binding fixes applied!'));
  console.log(chalk.gray('\nRun "yarn test" to verify the fixes\n'));
}

fixDIBindings().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});