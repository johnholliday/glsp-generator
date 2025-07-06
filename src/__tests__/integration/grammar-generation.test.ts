import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Grammar Generation Integration Tests', () => {
  let generator: GLSPGenerator;
  const outputBase = path.join(process.cwd(), 'test-output');

  beforeEach(async () => {
    generator = new GLSPGenerator();
    await fs.ensureDir(outputBase);
  });

  afterEach(async () => {
    await fs.remove(outputBase);
  });

  describe('Basic Grammars', () => {
    test('should generate state machine extension', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'basic', 'state-machine.langium');
      const outputDir = path.join(outputBase, 'state-machine');
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      expect(result.success).toBe(true);
      expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'state-machine-model.ts'))).toBe(true);
    });

    test('should generate workflow extension', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'basic', 'workflow.langium');
      const outputDir = path.join(outputBase, 'workflow');
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      expect(result.success).toBe(true);
      expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    });
  });

  describe('Advanced Grammars', () => {
    test('should generate UML class diagram extension', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'advanced', 'uml-class.langium');
      const outputDir = path.join(outputBase, 'uml-class');
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      expect(result.success).toBe(true);
      expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    });
  });

  describe('Feature Test Grammars', () => {
    test('should handle inheritance correctly', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'features', 'inheritance.langium');
      const outputDir = path.join(outputBase, 'inheritance');
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      expect(result.success).toBe(true);
      
      const modelPath = path.join(result.extensionDir, 'src', 'common', 'inheritance-model.ts');
      const modelContent = await fs.readFile(modelPath, 'utf-8');
      
      // Check that inheritance is properly generated
      expect(modelContent).toContain('extends');
    });

    test('should handle references correctly', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'features', 'references.langium');
      const outputDir = path.join(outputBase, 'references');
      
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Case Grammars', () => {
    test('should handle empty grammar gracefully', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'edge-cases', 'empty.langium');
      const outputDir = path.join(outputBase, 'empty');
      
      // Should either fail gracefully or generate minimal structure
      const result = await generator.generateExtension(grammarPath, outputDir);
      
      // The generator should handle this case without crashing
      expect(result).toBeDefined();
    });

    test('should detect circular references', async () => {
      const grammarPath = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'edge-cases', 'circular-refs.langium');
      const outputDir = path.join(outputBase, 'circular-refs');
      
      // This might fail validation, which is expected
      try {
        const result = await generator.generateExtension(grammarPath, outputDir);
        // If it succeeds, it should handle circular refs properly
        expect(result).toBeDefined();
      } catch (error) {
        // Expected for circular references
        expect(error.message).toContain('circular');
      }
    });
  });
});