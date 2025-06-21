import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ZodGenerator } from '../zod-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import fs from 'fs-extra';
import path from 'path';

describe('ZodGenerator', () => {
  let generator: ZodGenerator;
  let testGrammar: ParsedGrammar;
  const outputDir = path.join(process.cwd(), 'test-output-zod');

  beforeEach(async () => {
    generator = new ZodGenerator();
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'ID', optional: false, array: false },
            { name: 'name', type: 'string', optional: false, array: false },
            { name: 'x', type: 'number', optional: false, array: false },
            { name: 'active', type: 'boolean', optional: false, array: false },
            { name: 'tags', type: 'string', optional: true, array: true }
          ],
          superTypes: []
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'ID', optional: false, array: false },
            { name: 'source', type: 'Node', optional: false, array: false },
            { name: 'target', type: 'Node', optional: false, array: false },
            { name: 'type', type: 'EdgeType', optional: false, array: false }
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

  afterEach(async () => {
    await fs.remove(outputDir);
  });

  test('should generate Zod schemas', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    expect(await fs.pathExists(schemaPath)).toBe(true);
    
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check imports
    expect(content).toContain("import { z } from 'zod';");
    
    // Check schema exports
    expect(content).toContain('export const NodeSchema = ');
    expect(content).toContain('export const EdgeSchema = ');
    expect(content).toContain('export const EdgeTypeSchema = ');
  });

  test('should generate branded schemas when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateBrandedSchemas: true
    });
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check branded schemas
    expect(content).toContain('export const NodeIdSchema = z.string().min(1).brand(\'NodeId\');');
    expect(content).toContain('id: NodeIdSchema');
  });

  test('should generate union type schemas correctly', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check union type schema
    expect(content).toContain('export const EdgeTypeSchema = z.union([');
    expect(content).toContain("z.literal('solid')");
    expect(content).toContain("z.literal('dashed')");
    expect(content).toContain("z.literal('dotted')");
  });

  test('should generate discriminated union schemas', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check discriminated union
    expect(content).toContain('export const TestProjectNodeSchema = z.discriminatedUnion(\'type\', [');
    expect(content).toContain('NodeSchema');
    expect(content).toContain('EdgeSchema');
  });

  test('should generate parser functions when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateParsers: true
    });
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check parser functions
    expect(content).toContain('export function parseNode(data: unknown): Node');
    expect(content).toContain('return NodeSchema.parse(data);');
    
    expect(content).toContain('export function safeParseNode(data: unknown)');
    expect(content).toContain('return NodeSchema.safeParse(data);');
  });

  test('should generate transform functions when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateTransformers: true
    });
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check transform schemas
    expect(content).toContain('export const NodeTransformSchema = NodeSchema.transform((data) => {');
    expect(content).toContain('_type: \'Node\' as const');
  });

  test('should generate array schemas', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check array schemas
    expect(content).toContain('export const NodeArraySchema = z.array(NodeSchema);');
    expect(content).toContain('export const EdgeArraySchema = z.array(EdgeSchema);');
  });

  test('should generate partial schemas', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check partial schemas
    expect(content).toContain('export const PartialNodeSchema = NodeSchema.partial();');
    expect(content).toContain('export const DeepPartialNodeSchema = NodeSchema.deepPartial();');
    expect(content).toContain('export const StrictNodeSchema = NodeSchema.strict();');
  });

  test('should handle optional and array properties correctly', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check optional array property
    expect(content).toMatch(/tags: z\.array\(z\.string\(\)\)\.optional\(\)/);
    
    // Check required properties
    expect(content).toMatch(/name: z\.string\(\)/);
    expect(content).toMatch(/x: z\.number\(\)/);
    expect(content).toMatch(/active: z\.boolean\(\)/);
  });

  test('should generate validation helpers', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check validation helpers
    expect(content).toContain('export function validateWithSchema<T>');
    expect(content).toContain('export function getValidationErrors');
    expect(content).toContain('schema.safeParse(data)');
    expect(content).toContain('result.error.errors.map');
  });

  test('should update package.json with zod dependency', async () => {
    // Create a package.json first
    const packageJsonPath = path.join(outputDir, 'package.json');
    await fs.writeJson(packageJsonPath, {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {}
    });
    
    await generator.generate(testGrammar, outputDir);
    
    const packageJson = await fs.readJson(packageJsonPath);
    expect(packageJson.dependencies.zod).toBeDefined();
    expect(packageJson.dependencies.zod).toMatch(/^\^3\./);
  });

  test('should generate refinements when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateRefinements: true
    });
    
    const schemaPath = path.join(outputDir, 'src', 'types', 'test-project-schemas.ts');
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Check refinements
    expect(content).toContain('.refine(');
    expect(content).toContain('// Add custom validation logic here');
    expect(content).toContain('message: "Node validation failed"');
  });
});