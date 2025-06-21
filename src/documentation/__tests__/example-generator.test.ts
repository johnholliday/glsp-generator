import { describe, test, expect, beforeEach } from '@jest/globals';
import { ExampleModelGenerator } from '../example-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import fs from 'fs-extra';
import path from 'path';

describe('ExampleModelGenerator', () => {
  let generator: ExampleModelGenerator;
  let testGrammar: ParsedGrammar;
  const outputDir = path.join(process.cwd(), 'test-output-examples');

  beforeEach(async () => {
    generator = new ExampleModelGenerator();
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'position', type: 'Position', optional: false, array: false },
            { name: 'label', type: 'string', optional: true, array: false },
            { name: 'tags', type: 'string', optional: true, array: true }
          ],
          superTypes: []
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'source', type: 'Node', optional: false, array: false },
            { name: 'target', type: 'Node', optional: false, array: false },
            { name: 'type', type: 'EdgeType', optional: false, array: false }
          ],
          superTypes: []
        },
        {
          name: 'Position',
          properties: [
            { name: 'x', type: 'number', optional: false, array: false },
            { name: 'y', type: 'number', optional: false, array: false }
          ],
          superTypes: []
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

  test('should generate basic example', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const basicPath = path.join(outputDir, 'docs', 'examples', 'basic.model');
    expect(await fs.pathExists(basicPath)).toBe(true);
    
    const content = await fs.readFile(basicPath, 'utf-8');
    
    // Check basic structure
    expect(content).toContain('// Basic test-project Model Example');
    expect(content).toContain('Node');
    expect(content).toContain('id:');
    expect(content).toContain('position:');
    expect(content).toContain('{');
    expect(content).toContain('}');
  });

  test('should generate intermediate example with references', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const intermediatePath = path.join(outputDir, 'docs', 'examples', 'intermediate.model');
    const content = await fs.readFile(intermediatePath, 'utf-8');
    
    // Check for multiple nodes
    expect(content).toContain('Node node1');
    expect(content).toContain('Node node2');
    
    // Check for edge with references
    expect(content).toContain('Edge connection1');
    expect(content).toContain('source: @node1');
    expect(content).toContain('target: @node2');
  });

  test('should generate advanced example with all features', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const advancedPath = path.join(outputDir, 'docs', 'examples', 'advanced.model');
    const content = await fs.readFile(advancedPath, 'utf-8');
    
    // Check for comprehensive usage
    expect(content).toContain('// Advanced test-project Model Example');
    expect(content).toContain('* - Multiple interconnected elements');
    expect(content).toContain('* - All property types');
    expect(content).toContain('* - Cross-references between elements');
    
    // Check for arrays
    expect(content).toMatch(/tags:\s*\[/);
    
    // Check for type usage
    expect(content).toContain("'solid'");
  });

  test('should generate real-world example', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const realWorldPath = path.join(outputDir, 'docs', 'examples', 'real-world.model');
    const content = await fs.readFile(realWorldPath, 'utf-8');
    
    // Should have contextual real-world example
    expect(content).toContain('// Real-World Example:');
    expect(content).toMatch(/Node|Edge/);
  });

  test('should generate tutorial', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const tutorialPath = path.join(outputDir, 'docs', 'examples', 'tutorial.md');
    expect(await fs.pathExists(tutorialPath)).toBe(true);
    
    const content = await fs.readFile(tutorialPath, 'utf-8');
    
    // Check tutorial structure
    expect(content).toContain('# test-project Model Tutorial');
    expect(content).toContain('## Lesson 1: Creating Your First Element');
    expect(content).toContain('## Lesson 2: Understanding Properties');
    expect(content).toContain('## Lesson 3: Working with Types');
    expect(content).toContain('## Lesson 4: References and Relationships');
    expect(content).toContain('## Lesson 5: Arrays');
    expect(content).toContain('## Best Practices');
    
    // Check code examples
    expect(content).toMatch(/```[\s\S]*?Node[\s\S]*?{[\s\S]*?}/);
  });

  test('should generate validation examples', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validationPath = path.join(outputDir, 'docs', 'examples', 'validation-examples.model');
    const content = await fs.readFile(validationPath, 'utf-8');
    
    // Check for valid and invalid examples
    expect(content).toContain('// VALID EXAMPLES');
    expect(content).toContain('// INVALID EXAMPLES');
    expect(content).toContain('// Invalid: Missing required property');
    expect(content).toContain('// Invalid: Wrong type');
  });

  test('should handle arrays in examples', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const intermediatePath = path.join(outputDir, 'docs', 'examples', 'intermediate.model');
    const content = await fs.readFile(intermediatePath, 'utf-8');
    
    // Check for array usage
    expect(content).toMatch(/\[.*?,.*?\]/); // Array with multiple elements
  });

  test('should use all custom types in examples', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const advancedPath = path.join(outputDir, 'docs', 'examples', 'advanced.model');
    const content = await fs.readFile(advancedPath, 'utf-8');
    
    // Check that all type values are used
    expect(content).toContain("'solid'");
    expect(content).toContain("'dashed'");
    expect(content).toContain("'dotted'");
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });
});