import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { GLSPGenerator } from '../../generator.js';
import path from 'path';
import fs from 'fs-extra';

describe('Simple Grammar Integration Tests', () => {
  let generator: GLSPGenerator;
  const fixturesDir = path.join(process.cwd(), 'src', '__tests__', 'fixtures', 'grammars', 'simple');
  const outputBase = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'simple-grammars');

  beforeAll(async () => {
    generator = new GLSPGenerator();
    await fs.ensureDir(outputBase);
    await fs.ensureDir(fixturesDir);
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

  test('should generate basic extension with interfaces and types', async () => {
    const grammarPath = path.join(fixturesDir, 'basic.langium');
    const outputDir = path.join(outputBase, 'basic');
    
    const result = await generator.generateExtension(grammarPath, outputDir);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(result.extensionDir, 'src', 'common', 'basic-model.ts'))).toBe(true);
    
    // Check generated model content
    const modelContent = await fs.readFile(
      path.join(result.extensionDir, 'src', 'common', 'basic-model.ts'),
      'utf-8'
    );
    
    // Should have the interfaces we defined
    expect(modelContent).toContain('interface Node');
    expect(modelContent).toContain('interface Edge');
    expect(modelContent).toContain('interface Container');
    
    // Properties should be correctly typed
    expect(modelContent).toContain('name: string');
    expect(modelContent).toContain('label?: string');
    expect(modelContent).toContain('source: Node');
    expect(modelContent).toContain('target: Node');
    expect(modelContent).toContain('children: Node[]');
    
    // Should have proper exports
    expect(modelContent).toContain('export');
    expect(modelContent).toContain('namespace');
  });
});