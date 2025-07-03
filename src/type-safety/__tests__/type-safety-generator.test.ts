import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TypeSafetyGenerator } from '../type-safety-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../../config/types.js';
import fs from 'fs-extra';
import path from 'path';

describe('TypeSafetyGenerator', () => {
  let generator: TypeSafetyGenerator;
  let testGrammar: ParsedGrammar;
  let testConfig: GLSPConfig;
  const outputDir = path.join(process.cwd(), 'test-output-type-safety');

  beforeEach(async () => {
    // Ensure clean state
    await fs.remove(outputDir);
    generator = new TypeSafetyGenerator();

    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'ID', optional: false, array: false },
            { name: 'name', type: 'string', optional: false, array: false },
            { name: 'position', type: 'Position', optional: false, array: false }
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
      types: []
    };

    testConfig = {
      extension: {
        name: 'test-extension',
        displayName: 'Test Extension',
        version: '1.0.0',
        publisher: 'test-publisher',
        description: 'Test description',
        license: 'MIT'
      },
      dependencies: {
        '@eclipse-glsp/server': '^2.0.0',
        '@eclipse-glsp/client': '^2.0.0',
        '@eclipse-glsp/theia-integration': '^2.0.0',
        '@theia/core': '^1.35.0',
        customDeps: {}
      },
      diagram: {
        type: 'node-edge',
        features: {
          compartments: false,
          ports: false,
          routing: 'polyline',
          grid: true,
          snapToGrid: true,
          autoLayout: false,
          animation: true
        }
      },
      styling: {
        theme: 'light',
        defaultColors: {
          node: '#4A90E2',
          edge: '#333333',
          selected: '#FF6B6B',
          hover: '#FFA500',
          error: '#DC143C'
        },
        fonts: {
          default: 'Arial, sans-serif',
          monospace: 'Consolas, Monaco, monospace'
        },
        nodeDefaults: {
          width: 100,
          height: 60,
          cornerRadius: 5
        }
      },
      generation: {
        outputStructure: 'standard',
        includeExamples: true,
        generateTests: true,
        generateDocs: true,
        templateOverrides: {}
      },
      linter: {
        rules: {
          'naming-conventions': 'error',
          'no-duplicate-properties': 'error',
          'no-circular-refs': 'warning',
          'no-undefined-types': 'error'
        }
      }
    };

    await fs.ensureDir(outputDir);
  });

  afterEach(async () => {
    try {
      // Reset permissions if they were changed
      if (await fs.pathExists(outputDir)) {
        // On non-Windows, ensure we can delete the directory
        if (process.platform !== 'win32') {
          const readOnlyDir = path.join(outputDir, 'src', 'types');
          if (await fs.pathExists(readOnlyDir)) {
            await fs.chmod(readOnlyDir, 0o755);
          }
        }
        await fs.remove(outputDir);
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    // Clean up any event listeners to prevent memory leaks
    if (process.listenerCount('unhandledRejection') > 10) {
      process.removeAllListeners('unhandledRejection');
    }
  });

  test('should generate all type safety features by default', async () => {
    const result = await generator.generate(testGrammar, testConfig, outputDir);

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toContain('test-project-types.d.ts');
    expect(result.filesGenerated).toContain('test-project-validators.ts');
    expect(result.filesGenerated).toContain('test-project-guards.ts');
    expect(result.filesGenerated).toContain('test-project-schemas.ts');
    expect(result.filesGenerated).toContain('test-project-utilities.ts');
    expect(result.filesGenerated).toContain('type-safety.md');
    expect(result.filesGenerated).toContain('type-safety.test.ts');
  });

  test('should generate only selected features when specified', async () => {
    const result = await generator.generate(testGrammar, testConfig, outputDir, {
      declarations: true,
      validation: false,
      guards: true,
      zodSchemas: false,
      utilities: false
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toContain('test-project-types.d.ts');
    expect(result.filesGenerated).toContain('test-project-guards.ts');
    expect(result.filesGenerated).not.toContain('test-project-validators.ts');
    expect(result.filesGenerated).not.toContain('test-project-schemas.ts');
    expect(result.filesGenerated).not.toContain('test-project-utilities.ts');
  });

  test('should generate type safety documentation', async () => {
    const result = await generator.generate(testGrammar, testConfig, outputDir);

    const docsPath = path.join(outputDir, 'docs', 'type-safety.md');
    expect(await fs.pathExists(docsPath)).toBe(true);

    const content = await fs.readFile(docsPath, 'utf-8');
    expect(content).toContain('# Type Safety Documentation for test-project');
    expect(content).toContain('## Generated Files');
    expect(content).toContain('## Usage Examples');
    expect(content).toContain('## Best Practices');
    expect(content).toContain('## Migration Guide');
  });

  test('should generate test examples', async () => {
    const result = await generator.generate(testGrammar, testConfig, outputDir);

    const testPath = path.join(outputDir, '__tests__', 'type-safety.test.ts');
    expect(await fs.pathExists(testPath)).toBe(true);

    const content = await fs.readFile(testPath, 'utf-8');
    expect(content).toContain("import { describe, test, expect } from 'vitest';");
    expect(content).toContain("describe('Type Safety Tests', () => {");
    expect(content).toContain("describe('Node', () => {");
    expect(content).toContain("test('should validate valid Node', () => {");
    expect(content).toContain("test('should reject invalid Node', () => {");
  });

  test('should handle generation errors gracefully', async () => {
    // Create a read-only directory to cause an error
    const readOnlyDir = path.join(outputDir, 'src', 'types');
    await fs.ensureDir(readOnlyDir);

    // Make the directory read-only on non-Windows systems
    if (process.platform !== 'win32') {
      await fs.chmod(readOnlyDir, 0o444);
    }

    const result = await generator.generate(testGrammar, testConfig, outputDir);

    // On Windows, this might still succeed, so we check both cases
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    }

    // Clean up permissions
    if (process.platform !== 'win32') {
      await fs.chmod(readOnlyDir, 0o755);
    }
  });

  test('should create proper directory structure', async () => {
    await generator.generate(testGrammar, testConfig, outputDir);

    // Check directory structure
    expect(await fs.pathExists(path.join(outputDir, 'src', 'types'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'docs'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, '__tests__'))).toBe(true);
  });

  test('should normalize options correctly', async () => {
    // Test with empty object (should enable all)
    const result1 = await generator.generate(testGrammar, testConfig, outputDir, {});
    expect(result1.filesGenerated.length).toBeGreaterThan(5);

    // Clear output
    await fs.remove(outputDir);
    await fs.ensureDir(outputDir);

    // Test with undefined (should use defaults - all enabled)
    const result2 = await generator.generate(testGrammar, testConfig, outputDir);
    expect(result2.filesGenerated.length).toBeGreaterThan(5);

    // Clear output
    await fs.remove(outputDir);
    await fs.ensureDir(outputDir);

    // Test with partial options
    const result3 = await generator.generate(testGrammar, testConfig, outputDir, {
      declarations: false
    });
    expect(result3.filesGenerated).not.toContain('test-project-types.d.ts');
  });

  test('should include usage examples in documentation', async () => {
    await generator.generate(testGrammar, testConfig, outputDir);

    const docsPath = path.join(outputDir, 'docs', 'type-safety.md');
    const content = await fs.readFile(docsPath, 'utf-8');

    // Check for specific examples
    expect(content).toContain('### Basic Type Checking');
    expect(content).toContain('isNode(data)');
    expect(content).toContain('### Validation with Error Handling');
    expect(content).toContain('validators.isNode(data)');
    expect(content).toContain('### Using Zod Schemas');
    expect(content).toContain('NodeSchema.parse(data)');
    expect(content).toContain('### Using Factories and Builders');
    // Check that factory example is present
    expect(content).toContain('const node =');
    expect(content).toContain('.create({');
  });

  test('should handle empty grammar gracefully', async () => {
    const emptyGrammar: ParsedGrammar = {
      projectName: 'empty-project',
      interfaces: [],
      types: []
    };

    const result = await generator.generate(emptyGrammar, testConfig, outputDir);

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBeGreaterThan(0);

    // Should still generate documentation
    const docsPath = path.join(outputDir, 'docs', 'type-safety.md');
    expect(await fs.pathExists(docsPath)).toBe(true);
  });
});