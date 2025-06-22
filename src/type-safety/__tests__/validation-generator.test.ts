import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ValidationGenerator } from '../validation-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import fs from 'fs-extra';
import path from 'path';

describe('ValidationGenerator', () => {
  let generator: ValidationGenerator;
  let testGrammar: ParsedGrammar;
  const outputDir = path.join(process.cwd(), 'test-output-validation');

  beforeEach(async () => {
    generator = new ValidationGenerator();
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'x', type: 'number', optional: false, array: false },
            { name: 'y', type: 'number', optional: false, array: false },
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
            { name: 'target', type: 'Node', optional: false, array: false }
          ],
          superTypes: []
        }
      ],
      types: []
    };

    await fs.ensureDir(outputDir);
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });

  test('should generate validation functions', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    expect(await fs.pathExists(validatorPath)).toBe(true);
    
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check validator exports
    expect(content).toContain('export const validators = {');
    expect(content).toContain('isNode(obj: unknown): ValidationResult<Node>');
    expect(content).toContain('isEdge(obj: unknown): ValidationResult<Edge>');
  });

  test('should generate helper functions when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateHelpers: true
    });
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check helper functions
    expect(content).toContain('function isObject(obj: unknown)');
    expect(content).toContain('function isString(value: unknown)');
    expect(content).toContain('function isNumber(value: unknown)');
    expect(content).toContain('function isBoolean(value: unknown)');
    expect(content).toContain('function isArray(value: unknown)');
  });

  test('should validate required properties', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check required property validation
    expect(content).toContain("if (!('id' in obj))");
    expect(content).toContain("if (!('x' in obj))");
    expect(content).toContain("if (!('y' in obj))");
    expect(content).toContain("errors.push({ \n                path: 'id', \n                message: 'Required property missing'");
  });

  test('should validate optional properties correctly', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check optional property validation
    expect(content).toContain("if ('label' in obj)");
    expect(content).toContain("if ('tags' in obj)");
  });

  test('should validate array properties', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check array validation
    expect(content).toContain('if (!isArray(tagsValue))');
    expect(content).toContain('tagsValue.forEach((item, index) => {');
    expect(content).toContain("path: 'tags', \n                    message: 'Expected array, got '");
  });

  test('should generate detailed errors when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateDetailedErrors: true
    });
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check detailed error generation  
    expect(content).toContain('value: obj');
    expect(content).toContain('value: undefined');
    // When detailed errors are enabled, array errors should include value
    expect(content).toContain('value: tagsValue');
  });

  test('should generate batch validation functions', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check batch validation
    expect(content).toContain('export function validateMany<T>');
    expect(content).toContain('items: unknown[]');
    expect(content).toContain('validator: (item: unknown) => ValidationResult<T>');
    expect(content).toContain('ValidationResult<T[]>');
  });

  test('should generate deep validation functions', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check deep validation
    expect(content).toContain('export function validateDeep<T>');
    expect(content).toContain('// Additional deep validation logic here');
  });

  test('should handle custom type validation', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check custom type validation for Edge.source and Edge.target
    expect(content).toContain('// Custom type validation for Node');
    expect(content).toContain('const NodeResult = validators.isNode(sourceValue);');
    expect(content).toContain('if (!NodeResult.valid && NodeResult.errors)');
  });

  test('should generate reference validation placeholders when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      validateReferences: true
    });
    
    const validatorPath = path.join(outputDir, 'src', 'types', 'test-project-validators.ts');
    const content = await fs.readFile(validatorPath, 'utf-8');
    
    // Check reference validation
    expect(content).toContain('// Validate references');
    expect(content).toContain('// Reference validation for Node');
    expect(content).toContain('// Reference validation for Edge');
  });
});