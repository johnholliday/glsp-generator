import { createMockGLSPGenerator } from '../../test/helpers/glsp-generator-helper';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { GLSPGenerator } from '../generator.js';
import { ParsedGrammar } from '../types/grammar.js';

// Note: chalk and performance modules are mocked globally in jest.config.mjs

describe('GLSPGenerator with Dependency Injection', () => {
  let generator: GLSPGenerator;
  let tempDir: string;
  let mockLogger: any;
  let mockServices: any;

  beforeEach(async () => {
    // Mock console.error to suppress test output
    vi.spyOn(console, 'error').mockImplementation(() => { });

    // Set up default mock implementations
    const mockParsedGrammar: ParsedGrammar = {
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'x', type: 'number', optional: false, array: false },
            { name: 'y', type: 'number', optional: false, array: false }
          ],
          superTypes: ['Element']
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'source', type: 'Node', optional: false, array: false },
            { name: 'target', type: 'Node', optional: false, array: false }
          ],
          superTypes: ['Element']
        }
      ],
      types: [
        {
          name: 'EdgeType',
          definition: 'association | dependency | inheritance',
          unionTypes: ['association', 'dependency', 'inheritance']
        }
      ],
      projectName: 'test-project'
    };

    // Create generator with mock parser - properly destructure and assign
    const result = createMockGLSPGenerator();
    generator = result.generator;
    mockLogger = result.mockLogger;
    mockServices = result.mockServices;
    
    // Configure the existing parser mock with our test data
    mockServices.parser.parseGrammarFile.mockResolvedValue(mockParsedGrammar);
    mockServices.parser.validateGrammarFile.mockResolvedValue(true);
    mockServices.parser.parseGrammar.mockResolvedValue({
      $type: 'Grammar',
      rules: []
    });

    tempDir = path.join(process.cwd(), 'src', '__tests__', 'temp-output-di');
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  test('should use injected parser for grammar parsing', async () => {
    const grammarPath = 'test-grammar.langium';

    await generator.generateExtension(grammarPath, tempDir);

    // Verify the mock parser was called
    expect(mockServices.parser.parseGrammarFile).toHaveBeenCalledWith(grammarPath);
    expect(mockServices.parser.parseGrammarFile).toHaveBeenCalledTimes(1);
  });

  test('should generate files based on mock parser output', async () => {
    const grammarPath = 'test-grammar.langium';

    const result = await generator.generateExtension(grammarPath, tempDir);

    // Check that the generator was successful
    expect(result).toHaveProperty('extensionDir');
    expect(result.extensionDir).toContain('test-project-glsp-extension');
    
    // Verify the parser was called with correct grammar
    expect(mockServices.parser.parseGrammarFile).toHaveBeenCalledWith(grammarPath);
  });

  test('should use injected parser for validation', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium');

    // Create a dummy grammar file
    await fs.writeFile(grammarPath, 'grammar TestGrammar');

    const isValid = await generator.validateGrammar(grammarPath);

    // Verify the mock parser was called for validation
    expect(mockServices.parser.parseGrammar).toHaveBeenCalled();
    expect(isValid).toBe(true);
  });

  test('should handle parser errors gracefully', async () => {
    const grammarPath = 'test-grammar.langium';
    const errorMessage = 'Failed to parse grammar';

    // Make the parser throw an error
    mockServices.parser.parseGrammarFile.mockRejectedValue(new Error(errorMessage));

    // Expect the generator to propagate the error
    await expect(generator.generateExtension(grammarPath, tempDir))
      .rejects.toThrow(errorMessage);
  });

  test('should handle validation failures from parser', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium');

    // Create a dummy grammar file
    await fs.writeFile(grammarPath, 'grammar TestGrammar');

    // Make the parser return invalid AST that causes validation to fail
    mockServices.parser.parseGrammar.mockRejectedValue(new Error('Invalid grammar'));

    const isValid = await generator.validateGrammar(grammarPath);

    expect(isValid).toBe(false);
  });

});