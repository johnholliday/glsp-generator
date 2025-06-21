import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import path from 'path';
import fs from 'fs-extra';
import { GLSPGenerator } from '../generator.js';
import { IGrammarParser } from '../types/parser-interface.js';
import { ParsedGrammar } from '../types/grammar.js';

// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => {
  const mockChalk = {
    blue: jest.fn((str: string) => str),
    green: jest.fn((str: string) => str),
    yellow: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    cyan: jest.fn((str: string) => str)
  };
  return {
    __esModule: true,
    default: mockChalk
  };
});

describe('GLSPGenerator with Dependency Injection', () => {
  let mockParser: jest.Mocked<IGrammarParser>;
  let generator: GLSPGenerator;
  let tempDir: string;

  beforeEach(async () => {
    // Mock console.error to suppress test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a mock parser
    mockParser = {
      parseGrammarFile: jest.fn(),
      parseGrammar: jest.fn(),
      validateGrammarFile: jest.fn()
    };

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

    mockParser.parseGrammarFile.mockResolvedValue(mockParsedGrammar);
    mockParser.validateGrammarFile.mockResolvedValue(true);
    mockParser.parseGrammar.mockResolvedValue({
      $type: 'Grammar',
      rules: []
    });

    // Create generator with mock parser
    generator = new GLSPGenerator(undefined, mockParser);

    tempDir = path.join(process.cwd(), 'src', '__tests__', 'temp-output-di');
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('should use injected parser for grammar parsing', async () => {
    const grammarPath = 'test-grammar.langium';
    
    await generator.generateExtension(grammarPath, tempDir);
    
    // Verify the mock parser was called
    expect(mockParser.parseGrammarFile).toHaveBeenCalledWith(grammarPath);
    expect(mockParser.parseGrammarFile).toHaveBeenCalledTimes(1);
  });

  test('should generate files based on mock parser output', async () => {
    const grammarPath = 'test-grammar.langium';
    
    await generator.generateExtension(grammarPath, tempDir);
    
    const extensionDir = path.join(tempDir, 'test-project-glsp-extension');
    
    // Check that files were generated based on mock data
    expect(await fs.pathExists(extensionDir)).toBe(true);
    expect(await fs.pathExists(path.join(extensionDir, 'src/common/test-project-model.ts'))).toBe(true);
  });

  test('should use injected parser for validation', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium');
    
    // Create a dummy grammar file
    await fs.writeFile(grammarPath, 'grammar TestGrammar');
    
    const isValid = await generator.validateGrammar(grammarPath);
    
    // Verify the mock parser was called for validation
    expect(mockParser.parseGrammar).toHaveBeenCalled();
    expect(isValid).toBe(true);
  });

  test('should handle parser errors gracefully', async () => {
    const grammarPath = 'test-grammar.langium';
    const errorMessage = 'Failed to parse grammar';
    
    // Make the parser throw an error
    mockParser.parseGrammarFile.mockRejectedValue(new Error(errorMessage));
    
    // Expect the generator to propagate the error
    await expect(generator.generateExtension(grammarPath, tempDir))
      .rejects.toThrow(errorMessage);
  });

  test('should handle validation failures from parser', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium');
    
    // Create a dummy grammar file
    await fs.writeFile(grammarPath, 'grammar TestGrammar');
    
    // Make the parser return invalid AST that causes validation to fail
    mockParser.parseGrammar.mockRejectedValue(new Error('Invalid grammar'));
    
    const isValid = await generator.validateGrammar(grammarPath);
    
    expect(isValid).toBe(false);
  });

  test('should allow custom parser implementations', async () => {
    // Create a custom parser implementation
    const customParser: IGrammarParser = {
      parseGrammarFile: async (grammarPath: string) => ({
        interfaces: [{
          name: 'CustomInterface',
          properties: [
            { name: 'customProp', type: 'string', optional: true, array: false }
          ],
          superTypes: []
        }],
        types: [],
        projectName: 'custom-project'
      }),
      parseGrammar: async () => ({ $type: 'Grammar', rules: [] }),
      validateGrammarFile: async () => true
    };

    // Create generator with custom parser
    const customGenerator = new GLSPGenerator(undefined, customParser);
    
    await customGenerator.generateExtension('custom.langium', tempDir);
    
    const extensionDir = path.join(tempDir, 'custom-project-glsp-extension');
    expect(await fs.pathExists(extensionDir)).toBe(true);
  });
});