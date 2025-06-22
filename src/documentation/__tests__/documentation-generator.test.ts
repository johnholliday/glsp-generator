import { describe, test, expect, beforeEach } from 'vitest';
import { DocumentationGenerator } from '../documentation-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../../config/types.js';
import { DEFAULT_CONFIG } from '../../config/default-config.js';
import fs from 'fs-extra';
import path from 'path';

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;
  let testGrammar: ParsedGrammar;
  let config: GLSPConfig;
  const outputDir = path.join(process.cwd(), 'test-output-docs');

  beforeEach(async () => {
    generator = new DocumentationGenerator();
    config = DEFAULT_CONFIG;
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'TestInterface',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false }
          ],
          superTypes: []
        }
      ],
      types: [
        {
          name: 'TestType',
          definition: "'value1' | 'value2'",
          unionTypes: ['value1', 'value2']
        }
      ]
    };

    await fs.ensureDir(outputDir);
  });

  test('should generate all documentation types', async () => {
    const result = await generator.generate(testGrammar, config, outputDir, {
      readme: true,
      api: true,
      diagrams: true,
      examples: true,
      screenshots: true
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBeGreaterThan(0);
    
    // Check key files exist
    expect(await fs.pathExists(path.join(outputDir, 'README.md'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'index.md'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'api', 'index.md'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'grammar', 'railroad.html'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'examples', 'basic.model'))).toBe(true);
  });

  test('should generate only requested documentation', async () => {
    const result = await generator.generate(testGrammar, config, outputDir, {
      readme: true,
      api: false,
      diagrams: false,
      examples: false,
      screenshots: false
    });

    expect(result.success).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'README.md'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'api'))).toBe(false);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'grammar'))).toBe(false);
    expect(await fs.pathExists(path.join(outputDir, 'docs', 'examples'))).toBe(false);
  });

  test('should generate CONTRIBUTING.md', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const contributingPath = path.join(outputDir, 'CONTRIBUTING.md');
    expect(await fs.pathExists(contributingPath)).toBe(true);
    
    const content = await fs.readFile(contributingPath, 'utf-8');
    expect(content).toContain('# Contributing to test-project');
    expect(content).toContain('## How to Contribute');
    expect(content).toContain('## Development Setup');
  });

  test('should generate LICENSE if not exists', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const licensePath = path.join(outputDir, 'LICENSE');
    expect(await fs.pathExists(licensePath)).toBe(true);
    
    const content = await fs.readFile(licensePath, 'utf-8');
    expect(content).toContain('MIT License');
  });

  test('should not overwrite existing LICENSE', async () => {
    const licensePath = path.join(outputDir, 'LICENSE');
    await fs.writeFile(licensePath, 'CUSTOM LICENSE');
    
    await generator.generate(testGrammar, config, outputDir);
    
    const content = await fs.readFile(licensePath, 'utf-8');
    expect(content).toBe('CUSTOM LICENSE');
  });

  test('should handle errors gracefully', async () => {
    // Create a read-only directory to cause an error
    const readOnlyDir = path.join(outputDir, 'readonly');
    await fs.ensureDir(readOnlyDir);
    
    // Use a path that will cause an error
    const invalidGrammar = {
      ...testGrammar,
      interfaces: [{
        ...testGrammar.interfaces[0],
        properties: null as any // This will cause an error
      }]
    };

    const result = await generator.generate(invalidGrammar, config, outputDir);
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });
});