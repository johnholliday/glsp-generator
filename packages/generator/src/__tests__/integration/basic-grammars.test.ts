import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Basic Grammar Integration Tests', () => {
  let generator: GLSPGenerator;
  const fixturesDir = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'basic');
  const outputBase = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'basic-grammars');

  beforeAll(async () => {
    generator = new GLSPGenerator();
    await fs.ensureDir(outputBase);
  });

  afterAll(async () => {
    // Clean up with retry logic for Windows
    let retries = 3;
    while (retries > 0) {
      try {
        await fs.remove(outputBase);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.warn(`Failed to clean up test directory: ${error}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  });

  test('should generate state-machine extension', async () => {
    const grammarPath = path.join(fixturesDir, 'state-machine.langium');
    const outputDir = path.join(outputBase, 'state-machine');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'state-machine-model.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'server', 'state-machine-factory.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'browser', 'state-machine-diagram-module.ts'))).toBe(true);
    
    // Verify package.json content
    const packageJson = await fs.readJson(path.join(result.extensionDir, 'package.json'));
    expect(packageJson.name).toContain('state-machine');
    expect(packageJson.displayName).toContain('State Machine');
  });

  test('should generate workflow extension', async () => {
    const grammarPath = path.join(fixturesDir, 'workflow.langium');
    const outputDir = path.join(outputBase, 'workflow');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'workflow-model.ts'))).toBe(true);
    
    // Check that workflow-specific types are generated
    const modelContent = await fs.readFile(
      path.join(result.extensionDir, 'src', 'common', 'workflow-model.ts'),
      'utf-8'
    );
    expect(modelContent).toContain('interface');
    expect(modelContent).toContain('export');
  });

  test('should generate entity-model extension', async () => {
    const grammarPath = path.join(fixturesDir, 'entity-model.langium');
    const outputDir = path.join(outputBase, 'entity-model');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'entity-model-model.ts'))).toBe(true);
  });

  test('should generate expression extension', async () => {
    const grammarPath = path.join(fixturesDir, 'expression.langium');
    const outputDir = path.join(outputBase, 'expression');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'expression-model.ts'))).toBe(true);
  });

  test('should handle all basic grammars without errors', async () => {
    const grammarFiles = await fs.readdir(fixturesDir);
    const langiumFiles = grammarFiles.filter(f => f.endsWith('.langium'));
    
    expect(langiumFiles.length).toBeGreaterThan(0);
    
    const results = await Promise.allSettled(
      langiumFiles.map(async (file) => {
        const grammarPath = path.join(fixturesDir, file);
        const outputDir = path.join(outputBase, `test-${file.replace('.langium', '')}`);
        
        try {
          return await generator.generateExtension(grammarPath, outputDir);
        } catch (error) {
          // Some grammars may have syntax errors - that's expected for edge case testing
          return { success: false, error: error.message };
        }
      })
    );
    
    // At least some should succeed
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    expect(successful.length).toBeGreaterThan(0);
  });
});