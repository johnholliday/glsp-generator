import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Feature Grammar Integration Tests', () => {
  let generator: GLSPGenerator;
  const fixturesDir = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'features');
  const outputBase = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'feature-grammars');

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

  test('should handle inheritance correctly', async () => {
    const grammarPath = path.join(fixturesDir, 'inheritance.langium');
    const outputDir = path.join(outputBase, 'inheritance');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'inheritance-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check inheritance is properly generated
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toMatch(/interface\s+\w+\s+extends\s+\w+/);
  });

  test('should handle references correctly', async () => {
    const grammarPath = path.join(fixturesDir, 'references.langium');
    const outputDir = path.join(outputBase, 'references');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'references-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check references are handled
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toContain('interface');
    // References should be typed correctly
    expect(modelContent).toMatch(/:\s*\w+/);
  });

  test('should handle arrays and optionals correctly', async () => {
    const grammarPath = path.join(fixturesDir, 'arrays-optionals.langium');
    const outputDir = path.join(outputBase, 'arrays-optionals');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'arrays-optionals-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check arrays and optionals
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toMatch(/\[\]/); // Array syntax
    expect(modelContent).toMatch(/\?:/); // Optional property syntax
  });

  test('should handle type unions correctly', async () => {
    const grammarPath = path.join(fixturesDir, 'type-unions.langium');
    const outputDir = path.join(outputBase, 'type-unions');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'type-unions-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check union types
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toMatch(/type\s+\w+\s*=\s*.*\|/); // Union type syntax
  });

  test('should handle literals correctly', async () => {
    const grammarPath = path.join(fixturesDir, 'literals.langium');
    const outputDir = path.join(outputBase, 'literals');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'literals-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check literal types
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toContain('type');
  });

  test('should generate proper TypeScript for all features', async () => {
    const grammarFiles = await fs.readdir(fixturesDir);
    const langiumFiles = grammarFiles.filter(f => f.endsWith('.langium'));
    
    for (const file of langiumFiles) {
      const grammarPath = path.join(fixturesDir, file);
      const outputDir = path.join(outputBase, `feature-${file.replace('.langium', '')}`);
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      expect(result.success).toBe(true);
      
      // All feature grammars should generate valid TypeScript
      const modelPath = path.join(result.extensionDir, 'src', 'common', `${file.replace('.langium', '')}-model.ts`);
      if (await fs.pathExists(modelPath)) {
        const content = await fs.readFile(modelPath, 'utf-8');
        // Should have export statements
        expect(content).toContain('export');
        // Should not have syntax errors (basic check)
        expect(content).not.toContain('undefined');
        expect(content).not.toContain('null');
      }
    }
  });
});