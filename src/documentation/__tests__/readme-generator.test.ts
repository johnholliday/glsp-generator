import { describe, test, expect, beforeEach } from '@jest/globals';
import { ReadmeGenerator } from '../readme-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../../config/types.js';
import { DEFAULT_CONFIG } from '../../config/default-config.js';
import fs from 'fs-extra';
import path from 'path';

describe('ReadmeGenerator', () => {
  let generator: ReadmeGenerator;
  let testGrammar: ParsedGrammar;
  let config: GLSPConfig;
  const outputDir = path.join(process.cwd(), 'test-output-readme');

  beforeEach(async () => {
    generator = new ReadmeGenerator();
    config = DEFAULT_CONFIG;
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'label', type: 'string', optional: true, array: false },
            { name: 'children', type: 'Node', optional: true, array: true }
          ],
          superTypes: ['Element']
        },
        {
          name: 'Edge',
          properties: [
            { name: 'source', type: 'Node', optional: false, array: false },
            { name: 'target', type: 'Node', optional: false, array: false },
            { name: 'type', type: 'EdgeType', optional: false, array: false }
          ],
          superTypes: ['Element']
        }
      ],
      types: [
        {
          name: 'EdgeType',
          definition: "'solid' | 'dashed' | 'dotted'",
          unionTypes: ['solid', 'dashed', 'dotted']
        }
      ]
    };

    await fs.ensureDir(outputDir);
  });

  test('should generate README with all sections', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const readmePath = path.join(outputDir, 'README.md');
    expect(await fs.pathExists(readmePath)).toBe(true);
    
    const content = await fs.readFile(readmePath, 'utf-8');
    
    // Check main sections
    expect(content).toContain('# test-project Extension');
    expect(content).toContain('## Table of Contents');
    expect(content).toContain('## Installation');
    expect(content).toContain('## Getting Started');
    expect(content).toContain('## Language Overview');
    expect(content).toContain('## Interfaces');
    expect(content).toContain('## Types');
    expect(content).toContain('## Examples');
    expect(content).toContain('## API Documentation');
    expect(content).toContain('## Contributing');
    expect(content).toContain('## License');
  });

  test('should include interface documentation', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    // Check Node interface
    expect(content).toContain('### Node');
    expect(content).toContain('`id`: string');
    expect(content).toContain('`label`: string (optional)');
    expect(content).toContain('`children`: Node[] (optional)');
    expect(content).toContain('**Extends:** `Element`');
    
    // Check Edge interface
    expect(content).toContain('### Edge');
    expect(content).toContain('`source`: Node');
    expect(content).toContain('`target`: Node');
    expect(content).toContain('`type`: EdgeType');
  });

  test('should include type documentation', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    expect(content).toContain('### EdgeType');
    expect(content).toContain("'solid' | 'dashed' | 'dotted'");
    expect(content).toContain('`solid`');
    expect(content).toContain('`dashed`');
    expect(content).toContain('`dotted`');
  });

  test('should generate examples for interfaces', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    // Should have example code blocks
    expect(content).toMatch(/```test-project[\s\S]*?Node[\s\S]*?{[\s\S]*?}/);
    expect(content).toMatch(/```test-project[\s\S]*?Edge[\s\S]*?{[\s\S]*?}/);
  });

  test('should include installation instructions', async () => {
    await generator.generate(testGrammar, config, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    expect(content).toContain('npm install');
    expect(content).toContain('yarn add');
    expect(content).toContain('yarn build');
    expect(content).toContain('yarn test');
  });

  test('should use custom extension name from config', async () => {
    const customConfig = {
      ...config,
      extension: {
        ...config.extension,
        name: 'custom-extension-name',
        displayName: 'Custom Display Name'
      }
    };

    await generator.generate(testGrammar, customConfig, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    expect(content).toContain('# Custom Display Name');
    expect(content).toContain('npm install custom-extension-name');
    expect(content).toContain('yarn add custom-extension-name');
  });

  test('should handle empty grammar gracefully', async () => {
    const emptyGrammar: ParsedGrammar = {
      projectName: 'empty-project',
      interfaces: [],
      types: []
    };

    await generator.generate(emptyGrammar, config, outputDir);
    
    const content = await fs.readFile(path.join(outputDir, 'README.md'), 'utf-8');
    
    expect(content).toContain('# empty-project Extension');
    expect(content).not.toContain('## Interfaces');
    expect(content).not.toContain('## Types');
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });
});