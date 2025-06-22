import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';

// Mock chalk with proper ESM and chaining support
vi.mock('chalk', () => {
  // Create a proxy-based chainable mock that supports infinite chaining
  const createChalkMock = () => {
    const mockFunction = vi.fn((str: string) => String(str || ''));

    // Use Proxy to handle any property access and return chainable mock
    return new Proxy(mockFunction, {
      get(target, prop) {
        // Handle special properties
        if (prop === 'supportsColor') {
          return { stdout: { level: 0 }, stderr: { level: 0 } };
        }
        if (prop === 'level') return 0;
        if (prop === 'stderr' || prop === 'stdout') return target;

        // For any style property, return the same chainable mock
        if (typeof prop === 'string') {
          return createChalkMock();
        }

        return target[prop as keyof typeof target];
      }
    });
  };

  const mockChalk = createChalkMock();

  return {
    __esModule: true,
    default: mockChalk
  };
});

import { GLSPGenerator } from '../generator.js';
import { MockGrammarParser } from './mocks/mock-parser.mock.js';

const testDir = path.join(process.cwd(), 'src', '__tests__');

describe('GLSPGenerator', () => {
  let generator: GLSPGenerator;
  const testGrammarPath = path.join(testDir, 'fixtures', 'test-grammar.langium');
  const tempOutputDir = path.join(testDir, 'temp-output');

  beforeEach(async () => {
    // Use mock parser with dependency injection
    const mockParser = new MockGrammarParser();
    generator = new GLSPGenerator(undefined, mockParser);

    // Ensure clean output directory
    await fs.ensureDir(tempOutputDir);
    await fs.emptyDir(tempOutputDir);
  });

  afterEach(async () => {
    // Clean up test outputs
    await fs.remove(tempOutputDir);
    generator = null as any;
  });

  test('should generate complete extension structure', async () => {
    await generator.generateExtension(testGrammarPath, tempOutputDir);

    // Check directory structure
    const expectedDirs = [
      'src',
      'src/browser',
      'src/browser/diagram',
      'src/common',
      'src/node',
      'src/server',
      'src/server/diagram',
      'src/server/handlers',
      'src/server/model'
    ];

    for (const dir of expectedDirs) {
      expect(await fs.pathExists(path.join(tempOutputDir, 'test-grammar-glsp-extension', dir))).toBe(true);
    }
  });

  test('should generate valid TypeScript model file', async () => {
    await generator.generateExtension(testGrammarPath, tempOutputDir);

    const modelFile = path.join(tempOutputDir, 'test-grammar-glsp-extension', 'src', 'common', 'test-grammar-model.ts');
    expect(await fs.pathExists(modelFile)).toBe(true);

    const modelContent = await fs.readFile(modelFile, 'utf-8');

    // Check interfaces extend the correct base
    expect(modelContent).toContain('export interface Node extends');
    expect(modelContent).toContain('export interface Edge extends');

    // Check type hierarchy is generated
    expect(modelContent).toContain('node: \'node:Node\'');
    expect(modelContent).toContain('edge: \'edge:Edge\'');

    // Check properties are included
    expect(modelContent).toContain('position: Position');
    expect(modelContent).toContain('size?: Size');
  });

  test('should generate valid package.json', async () => {
    await generator.generateExtension(testGrammarPath, tempOutputDir);

    const packageJsonPath = path.join(tempOutputDir, 'test-grammar-glsp-extension', 'package.json');
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    const packageJson = await fs.readJson(packageJsonPath);
    expect(packageJson.name).toBe('test-grammar-glsp-extension');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.dependencies).toBeDefined();
  });

  test('should validate grammar before generation', async () => {
    const isValid = await generator.validateGrammar(testGrammarPath);
    expect(isValid).toBe(true);
  });

  test('should handle non-existent grammar file', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent.langium');

    await expect(generator.generateExtension(nonExistentFile, tempOutputDir))
      .rejects.toThrow();
  });

  test('should handle custom configuration', async () => {
    const customConfig = {
      extension: {
        name: 'custom-extension',
        displayName: 'Custom Extension',
        description: 'Custom description',
        version: '2.0.0',
        publisher: 'custom-publisher'
      },
      linter: {
        enabled: true,
        rules: {}
      }
    };

    const customGenerator = new GLSPGenerator(customConfig, new MockGrammarParser());
    await customGenerator.generateExtension(testGrammarPath, tempOutputDir);

    const packageJsonPath = path.join(tempOutputDir, 'custom-extension', 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    expect(packageJson.name).toBe('custom-extension');
    expect(packageJson.version).toBe('2.0.0');
    expect(packageJson.publisher).toBe('custom-publisher');
  });

  // Test with TODO marker for future implementation
  test.todo('should handle circular references gracefully');
});