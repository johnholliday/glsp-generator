import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Advanced Grammar Integration Tests', () => {
  let generator: GLSPGenerator;
  const fixturesDir = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'advanced');
  const outputBase = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'advanced-grammars');

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

  test('should generate uml-class extension', async () => {
    const grammarPath = path.join(fixturesDir, 'uml-class.langium');
    const outputDir = path.join(outputBase, 'uml-class');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'uml-class-model.ts'))).toBe(true);
    
    // Check UML-specific features
    const modelContent = await fs.readFile(
      path.join(result.extensionDir, 'src', 'common', 'uml-class-model.ts'),
      'utf-8'
    );
    expect(modelContent).toContain('interface');
    
    // UML class diagrams should have class-related types
    const packageJson = await fs.readJson(path.join(result.extensionDir, 'package.json'));
    expect(packageJson.displayName).toContain('Uml Class');
  });

  test('should generate bpmn-subset extension', async () => {
    const grammarPath = path.join(fixturesDir, 'bpmn-subset.langium');
    const outputDir = path.join(outputBase, 'bpmn-subset');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'bpmn-subset-model.ts'))).toBe(true);
  });

  test('should generate component-system extension', async () => {
    const grammarPath = path.join(fixturesDir, 'component-system.langium');
    const outputDir = path.join(outputBase, 'component-system');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'component-system-model.ts'))).toBe(true);
  });

  test('should generate hierarchical-fsm extension', async () => {
    const grammarPath = path.join(fixturesDir, 'hierarchical-fsm.langium');
    const outputDir = path.join(outputBase, 'hierarchical-fsm');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'hierarchical-fsm-model.ts'))).toBe(true);
    
    // Check for hierarchical features
    const modelContent = await fs.readFile(
      path.join(result.extensionDir, 'src', 'common', 'hierarchical-fsm-model.ts'),
      'utf-8'
    );
    expect(modelContent).toContain('interface');
  });

  test('should handle complex type hierarchies', async () => {
    const grammarFiles = await fs.readdir(fixturesDir);
    const langiumFiles = grammarFiles.filter(f => f.endsWith('.langium'));
    
    for (const file of langiumFiles) {
      const grammarPath = path.join(fixturesDir, file);
      const outputDir = path.join(outputBase, `complex-${file.replace('.langium', '')}`);
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      expect(result.success).toBe(true);
      
      // Advanced grammars should generate more complex structures
      const modelPath = path.join(result.extensionDir, 'src', 'common', `${file.replace('.langium', '')}-model.ts`);
      if (await fs.pathExists(modelPath)) {
        const content = await fs.readFile(modelPath, 'utf-8');
        // Should have multiple interfaces or types
        const interfaceMatches = content.match(/interface\s+\w+/g) || [];
        const typeMatches = content.match(/type\s+\w+\s*=/g) || [];
        expect(interfaceMatches.length + typeMatches.length).toBeGreaterThan(1);
      }
    }
  });
});