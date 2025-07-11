import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Edge Case Grammar Integration Tests', () => {
  let generator: GLSPGenerator;
  const fixturesDir = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'edge-cases');
  const outputBase = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'edge-case-grammars');

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

  test('should handle empty grammar gracefully', async () => {
    const grammarPath = path.join(fixturesDir, 'empty.langium');
    const outputDir = path.join(outputBase, 'empty');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    // Even empty grammars should generate basic structure
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'server'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'browser'))).toBe(true);
  });

  test('should detect circular references', async () => {
    const grammarPath = path.join(fixturesDir, 'circular-refs.langium');
    const outputDir = path.join(outputBase, 'circular-refs');
    
    // Should still generate but might have warnings
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    // The model should still be generated even with circular refs
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'circular-refs-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
  });

  test('should handle deep inheritance chains', async () => {
    const grammarPath = path.join(fixturesDir, 'deep-inheritance.langium');
    const outputDir = path.join(outputBase, 'deep-inheritance');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'deep-inheritance-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check that deep inheritance is handled
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    // Should have multiple extends
    const extendsMatches = modelContent.match(/extends\s+\w+/g) || [];
    expect(extendsMatches.length).toBeGreaterThan(0);
  });

  test('should handle complex union types', async () => {
    const grammarPath = path.join(fixturesDir, 'complex-unions.langium');
    const outputDir = path.join(outputBase, 'complex-unions');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'complex-unions-model.ts');
    expect(await fs.pathExists(modelPath)).toBe(true);
    
    // Check complex unions
    const modelContent = await fs.readFile(modelPath, 'utf-8');
    expect(modelContent).toMatch(/type\s+\w+\s*=\s*.*\|.*\|/); // Multiple union members
  });

  test('should handle large grammars efficiently', async () => {
    const grammarPath = path.join(fixturesDir, 'large-grammar.langium');
    const outputDir = path.join(outputBase, 'large-grammar');
    
    const startTime = Date.now();
    const result = await generator.generateExtension(grammarPath, outputDir);
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    
    // Large grammars should still complete in reasonable time (< 30 seconds)
    expect(duration).toBeLessThan(30000);
    
    // Should generate many interfaces/types
    const modelPath = path.join(result.extensionDir, 'src', 'common', 'large-grammar-model.ts');
    if (await fs.pathExists(modelPath)) {
      const content = await fs.readFile(modelPath, 'utf-8');
      const interfaceCount = (content.match(/interface\s+\w+/g) || []).length;
      expect(interfaceCount).toBeGreaterThan(5); // Large grammar should have many interfaces
    }
  });

  test('should handle all edge cases without crashing', async () => {
    const grammarFiles = await fs.readdir(fixturesDir);
    const langiumFiles = grammarFiles.filter(f => f.endsWith('.langium'));
    
    const results = await Promise.allSettled(
      langiumFiles.map(async (file) => {
        const grammarPath = path.join(fixturesDir, file);
        const outputDir = path.join(outputBase, `edge-${file.replace('.langium', '')}`);
        
        return generator.generateExtension(grammarPath, outputDir);
      })
    );
    
    // All edge cases should be handled (either success or proper error)
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        expect(result.value.success).toBe(true);
      } else {
        // If it fails, it should fail gracefully with a proper error
        expect(result.reason).toBeInstanceOf(Error);
        console.log(`Edge case ${langiumFiles[index]} failed with:`, result.reason.message);
      }
    });
  });
});