/**
 * Unit tests for LangiumGrammarParser
 * @module test/unit/parser
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LangiumGrammarParser } from '../../../src/parser/services/LangiumGrammarParser';
import { IParserCache } from '../../../src/parser/interfaces/IParserCache';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { IFileSystem } from '../../../src/infrastructure/filesystem/IFileSystem';
import { 
  SIMPLE_GRAMMAR, 
  COMPLEX_GRAMMAR, 
  INVALID_GRAMMAR,
  MINIMAL_GRAMMAR 
} from '../../fixtures/grammar-fixtures';
import { MockLogger, MockFileSystem } from '../../mocks/mock-services';

describe('LangiumGrammarParser', () => {
  let parser: LangiumGrammarParser;
  let mockCache: IParserCache;
  let mockLogger: IStructuredLogger;
  let mockFileSystem: IFileSystem;

  beforeEach(() => {
    // Create mocks
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
      invalidate: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, size: 0 }),
    };

    mockLogger = new MockLogger();
    mockFileSystem = new MockFileSystem(new Map([
      ['/test/simple.langium', SIMPLE_GRAMMAR],
      ['/test/complex.langium', COMPLEX_GRAMMAR],
      ['/test/invalid.langium', INVALID_GRAMMAR],
      ['/test/minimal.langium', MINIMAL_GRAMMAR],
    ]));

    // Create parser
    parser = new LangiumGrammarParser(mockCache, mockLogger, mockFileSystem);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('parse', () => {
    it('should parse a simple grammar file', async () => {
      // Act
      const result = await parser.parse('/test/simple.langium');

      // Assert
      expect(result).toBeDefined();
      expect(result.$type).toBe('Grammar');
      expect(result.name).toBe('SimpleGrammar');
      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBeGreaterThan(0);

      // Verify cache was checked and set
      expect(mockCache.get).toHaveBeenCalledWith('/test/simple.langium');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached result if available', async () => {
      // Arrange
      const cachedGrammar = {
        $type: 'Grammar',
        name: 'CachedGrammar',
        rules: [],
        interfaces: [],
        types: [],
      };
      mockCache.get.mockResolvedValue(cachedGrammar);

      // Act
      const result = await parser.parse('/test/simple.langium');

      // Assert
      expect(result).toBe(cachedGrammar);
      expect(mockFileSystem.readFile).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should parse complex grammar with interfaces and types', async () => {
      // Act
      const result = await parser.parse('/test/complex.langium');

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('ComplexGrammar');
      expect(result.interfaces).toBeDefined();
      expect(result.interfaces.length).toBeGreaterThan(0);
      expect(result.types).toBeDefined();
      
      // Find specific interface
      const declaration = result.interfaces.find((i: any) => i.name === 'Declaration');
      expect(declaration).toBeDefined();
    });

    it('should throw error for non-existent file', async () => {
      // Act & Assert
      await expect(parser.parse('/test/nonexistent.langium')).rejects.toThrow('Grammar file not found');
    });

    it('should handle parser errors gracefully', async () => {
      // Act & Assert
      await expect(parser.parse('/test/invalid.langium')).rejects.toThrow();
      
      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should skip cache when option is set', async () => {
      // Act
      await parser.parse('/test/simple.langium', { useCache: false });

      // Assert
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should validate parsed grammar by default', async () => {
      // Act
      const result = await parser.parse('/test/simple.langium');

      // Assert
      expect(result).toBeDefined();
      // Validation errors would throw, so getting here means validation passed
    });

    it('should skip validation when option is set', async () => {
      // Arrange - Create a grammar with validation errors but no parse errors  
      const grammarWithValidationErrors = `
        grammar TestGrammar
        entry Model: elements+=Element*;
        
        // This will cause validation error (undefined reference)
        Element: name=ID ref=[UndefinedType];
        
        terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
      `;
      mockFileSystem.writeFile('/test/validation-error.langium', grammarWithValidationErrors);
      
      // Act
      const result = await parser.parse('/test/validation-error.langium', { skipValidation: true });

      // Assert
      expect(result).toBeDefined();
      expect(result.$type).toBe('Grammar');
      // Grammar has validation errors but we skipped validation
    });
  });

  describe('parseContent', () => {
    it('should parse grammar content directly', async () => {
      // Act
      const result = await parser.parseContent(MINIMAL_GRAMMAR);

      // Assert
      expect(result).toBeDefined();
      expect(result.$type).toBe('Grammar');
      expect(result.name).toBe('MinimalGrammar');
    });

    it('should not use cache for content parsing', async () => {
      // Act
      await parser.parseContent(SIMPLE_GRAMMAR);

      // Assert
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle empty content', async () => {
      // Act & Assert
      await expect(parser.parseContent('')).rejects.toThrow();
    });

    it('should parse with custom source URI', async () => {
      // Act
      const result = await parser.parseContent(SIMPLE_GRAMMAR, {
        sourceUri: 'memory://test.langium'
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('SimpleGrammar');
    });
  });

  describe('getDocument', () => {
    it('should return Langium document for parsed grammar', async () => {
      // Act
      const document = await parser.getDocument('/test/simple.langium');

      // Assert
      expect(document).toBeDefined();
      expect(document.uri.toString()).toBe('file:///test/simple.langium');
      expect(document.textDocument).toBeDefined();
      expect(document.parseResult).toBeDefined();
      expect(document.parseResult.value).toBeDefined();
      expect(document.parseResult.value.$type).toBe('Grammar');
    });

    it('should cache documents', async () => {
      // Act
      const doc1 = await parser.getDocument('/test/simple.langium');
      const doc2 = await parser.getDocument('/test/simple.langium');

      // Assert
      expect(doc1).toBe(doc2);
      expect(mockFileSystem.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServices', () => {
    it('should return Langium services', () => {
      // Act
      const services = parser.getServices();

      // Assert
      expect(services).toBeDefined();
      expect(services.parser).toBeDefined();
      expect(services.Grammar).toBeDefined();
      expect(services.validation).toBeDefined();
      expect(services.references).toBeDefined();
      expect(services.serializer).toBeDefined();
    });

    it('should return same services instance', () => {
      // Act
      const services1 = parser.getServices();
      const services2 = parser.getServices();

      // Assert
      expect(services1).toBe(services2);
    });
  });

  describe('error handling', () => {
    it('should provide detailed error for syntax errors', async () => {
      // Arrange
      mockFileSystem.writeFile('/test/syntax-error.langium', `
        grammar SyntaxError
        
        entry Model:
            elements+= // Missing element reference
      `);

      // Act & Assert
      await expect(parser.parse('/test/syntax-error.langium')).rejects.toThrow(/syntax|parse/i);
    });

    it('should handle circular imports gracefully', async () => {
      // Arrange
      mockFileSystem.writeFile('/test/circular1.langium', `
        grammar Circular1
        import './circular2'
        
        entry Model: name=ID;
      `);
      
      mockFileSystem.writeFile('/test/circular2.langium', `
        grammar Circular2
        import './circular1'
        
        Rule: value=STRING;
      `);

      // Act & Assert
      // Parser should handle this without infinite loop
      const result = await parser.parse('/test/circular1.langium');
      expect(result).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should parse large grammar efficiently', async () => {
      // Arrange
      const largeGrammar = generateLargeGrammar(100); // 100 rules
      mockFileSystem.writeFile('/test/large.langium', largeGrammar);

      // Act
      const start = Date.now();
      const result = await parser.parse('/test/large.langium');
      const duration = Date.now() - start;

      // Assert
      expect(result).toBeDefined();
      expect(result.rules.length).toBe(103); // 100 Rule[i] + Model + ID terminal + STRING terminal
      expect(duration).toBeLessThan(1000); // Should parse in under 1 second
    });
  });
});

/**
 * Helper to generate large grammar for performance testing
 */
function generateLargeGrammar(ruleCount: number): string {
  let grammar = 'grammar LargeGrammar\n\n';
  grammar += 'entry Model:\n    elements+=Element*;\n\n';
  
  for (let i = 0; i < ruleCount; i++) {
    grammar += `Rule${i}:\n    'rule${i}' name=ID value=STRING;\n\n`;
  }
  
  grammar += 'terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;\n';
  grammar += 'terminal STRING: /"[^"]*"|\'[^\']*\'/;\n';
  
  return grammar;
}