/**
 * Unit tests for LangiumValidator
 * @module test/unit/validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'inversify';
import { LangiumValidator } from '../../../src/validation/services/LangiumValidator';
import { TYPES } from '../../../src/infrastructure/di/symbols';
import { TestFramework } from '../../utils/test-framework';
import { 
  SIMPLE_GRAMMAR, 
  INVALID_GRAMMAR,
  COMPLEX_GRAMMAR,
  getTestGrammarContent 
} from '../../fixtures/grammar-fixtures';

describe('LangiumValidator', () => {
  let container: Container;
  let validator: LangiumValidator;
  let mockParser: any;
  let mockSchemaValidator: any;
  let mockRuleFactory: any;
  let mockErrorCollector: any;
  let mockEventBus: any;
  let mockLogger: any;

  beforeEach(() => {
    // Create test container
    container = new TestFramework.TestBuilder()
      .withMockParser()
      .withMockEventBus()
      .withMockLogger()
      .build();

    // Get mocks
    mockParser = TestFramework.getMock(container, TYPES.IParser);
    mockEventBus = TestFramework.getMock(container, TYPES.IEventBus);
    mockLogger = TestFramework.getMock(container, TYPES.IStructuredLogger);

    // Create additional mocks
    mockSchemaValidator = {
      validateSchema: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    };

    mockRuleFactory = {
      createRule: vi.fn(),
      getDefaultRules: vi.fn().mockReturnValue([]),
    };

    mockErrorCollector = {
      addError: vi.fn(),
      addWarning: vi.fn(),
      getResult: vi.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
      clear: vi.fn(),
      hasErrors: vi.fn().mockReturnValue(false),
    };

    // Bind mocks
    container.bind(TYPES.ISchemaValidator).toConstantValue(mockSchemaValidator);
    container.bind(TYPES.IValidationRuleFactory).toConstantValue(mockRuleFactory);
    container.bind(TYPES.IErrorCollector).toConstantValue(mockErrorCollector);

    // Create validator
    validator = new LangiumValidator(
      mockParser,
      mockSchemaValidator,
      mockRuleFactory,
      mockErrorCollector,
      mockEventBus,
      mockLogger
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate a simple grammar successfully', async () => {
      // Arrange
      const grammarPath = '/test/simple.langium';
      const mockGrammar = {
        $type: 'Grammar',
        name: 'SimpleGrammar',
        rules: [{ name: 'Model', entry: true }],
        interfaces: [],
        types: [],
      };

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockParser.getDocument.mockResolvedValue({
        parseResult: { 
          value: mockGrammar,
          lexerErrors: [],
          parserErrors: [],
        },
      });

      // Act
      const result = await validator.validate(grammarPath);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);

      // Verify event was emitted
      TestFramework.assert.assertEventEmitted(mockEventBus, 'validation:start', {
        path: grammarPath,
      });
      TestFramework.assert.assertEventEmitted(mockEventBus, 'validation:complete', {
        path: grammarPath,
        valid: true,
      });
    });

    it('should report parser errors', async () => {
      // Arrange
      const grammarPath = '/test/invalid.langium';
      const parserErrors = [
        {
          message: 'Unexpected token',
          range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
        },
      ];

      mockParser.parse.mockResolvedValue({
        $type: 'Grammar',
        name: 'Invalid',
      });
      mockParser.getDocument.mockResolvedValue({
        parseResult: {
          parserErrors,
          lexerErrors: [],
        },
      });

      // Act
      const result = await validator.validate(grammarPath);

      // Assert
      expect(mockErrorCollector.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unexpected token',
          location: expect.any(Object),
        })
      );
    });

    it('should validate with strict mode', async () => {
      // Arrange
      const grammarPath = '/test/grammar.langium';
      const mockGrammar = {
        $type: 'Grammar',
        name: 'TestGrammar',
        rules: [
          { name: 'model', entry: true }, // lowercase - should warn in strict mode
        ],
      };

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockParser.getDocument.mockResolvedValue({
        parseResult: { value: mockGrammar, parserErrors: [], lexerErrors: [] },
      });

      // Create strict naming rule
      const strictNamingRule = {
        name: 'strict-naming',
        validate: vi.fn().mockImplementation(async (context) => {
          if (context.grammar.rules[0].name === 'model') {
            return {
              valid: true,
              errors: [],
              warnings: [{
                severity: 'warning',
                message: 'Rule names should start with uppercase',
                code: 'NAMING_CONVENTION',
              }],
            };
          }
          return { valid: true, errors: [], warnings: [] };
        }),
      };

      mockRuleFactory.getDefaultRules.mockReturnValue([strictNamingRule]);

      // Act
      const result = await validator.validate(grammarPath, { strict: true });

      // Assert
      expect(strictNamingRule.validate).toHaveBeenCalled();
      expect(mockErrorCollector.addWarning).toHaveBeenCalled();
    });

    it('should skip validation when option is set', async () => {
      // Arrange
      const grammarPath = '/test/grammar.langium';

      // Act
      const result = await validator.validate(grammarPath, { skipValidation: true });

      // Assert
      expect(result.valid).toBe(true);
      expect(mockParser.parse).not.toHaveBeenCalled();
      expect(mockRuleFactory.getDefaultRules).not.toHaveBeenCalled();
    });

    it('should handle parser exceptions', async () => {
      // Arrange
      const grammarPath = '/test/error.langium';
      const parseError = new Error('Failed to parse grammar');

      mockParser.parse.mockRejectedValue(parseError);

      // Act
      const result = await validator.validate(grammarPath);

      // Assert
      expect(result.valid).toBe(false);
      expect(mockErrorCollector.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to parse grammar',
          code: 'PARSE_ERROR',
        })
      );
    });
  });

  describe('validateContent', () => {
    it('should validate grammar content directly', async () => {
      // Arrange
      const mockGrammar = {
        $type: 'Grammar',
        name: 'TestGrammar',
        rules: [{ name: 'Model', entry: true }],
      };

      mockParser.parseContent.mockResolvedValue(mockGrammar);

      // Act
      const result = await validator.validateContent(SIMPLE_GRAMMAR);

      // Assert
      expect(result.valid).toBe(true);
      expect(mockParser.parseContent).toHaveBeenCalledWith(SIMPLE_GRAMMAR, undefined);
    });

    it('should validate with custom source URI', async () => {
      // Arrange
      const content = getTestGrammarContent('minimal');
      const sourceUri = 'memory://test.langium';
      const mockGrammar = {
        $type: 'Grammar',
        name: 'MinimalGrammar',
        rules: [{ name: 'Model', entry: true }],
      };

      mockParser.parseContent.mockResolvedValue(mockGrammar);

      // Act
      const result = await validator.validateContent(content, { sourceUri });

      // Assert
      expect(result.valid).toBe(true);
      expect(mockParser.parseContent).toHaveBeenCalledWith(content, { sourceUri });
    });
  });

  describe('validatePartial', () => {
    it('should validate partial grammar AST', async () => {
      // Arrange
      const partialGrammar = {
        $type: 'Grammar',
        name: 'PartialGrammar',
        rules: [],
        interfaces: [
          {
            name: 'Node',
            attributes: [
              { name: 'id', type: { primitiveType: 'string' } },
            ],
          },
        ],
      };

      // Act
      const result = await validator.validatePartial(partialGrammar);

      // Assert
      expect(result.valid).toBe(true);
      expect(mockParser.parse).not.toHaveBeenCalled();
    });

    it('should detect missing entry rule in partial validation', async () => {
      // Arrange
      const partialGrammar = {
        $type: 'Grammar',
        name: 'NoEntryGrammar',
        rules: [
          { name: 'Rule1', entry: false },
          { name: 'Rule2', entry: false },
        ],
      };

      const entryRuleValidator = {
        name: 'entry-rule',
        validate: vi.fn().mockResolvedValue({
          valid: false,
          errors: [{
            severity: 'error',
            message: 'Grammar must have at least one entry rule',
            code: 'NO_ENTRY_RULE',
          }],
          warnings: [],
        }),
      };

      mockRuleFactory.getDefaultRules.mockReturnValue([entryRuleValidator]);

      // Act
      const result = await validator.validatePartial(partialGrammar, { 
        validateEntryRule: true 
      });

      // Assert
      expect(entryRuleValidator.validate).toHaveBeenCalled();
      expect(mockErrorCollector.addError).toHaveBeenCalled();
    });
  });

  describe('rule management', () => {
    it('should add custom validation rule', async () => {
      // Arrange
      const customRule = {
        name: 'custom-rule',
        validate: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      };

      // Act
      validator.addRule(customRule);
      const grammarPath = '/test/grammar.langium';
      
      mockParser.parse.mockResolvedValue({
        $type: 'Grammar',
        name: 'Test',
        rules: [],
      });
      mockParser.getDocument.mockResolvedValue({
        parseResult: { parserErrors: [], lexerErrors: [] },
      });

      await validator.validate(grammarPath);

      // Assert
      expect(customRule.validate).toHaveBeenCalled();
    });

    it('should remove validation rule', async () => {
      // Arrange
      const rule1 = {
        name: 'rule1',
        validate: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      };
      const rule2 = {
        name: 'rule2',
        validate: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      };

      validator.addRule(rule1);
      validator.addRule(rule2);

      // Act
      validator.removeRule('rule1');

      mockParser.parse.mockResolvedValue({
        $type: 'Grammar',
        name: 'Test',
        rules: [],
      });
      mockParser.getDocument.mockResolvedValue({
        parseResult: { parserErrors: [], lexerErrors: [] },
      });

      await validator.validate('/test/grammar.langium');

      // Assert
      expect(rule1.validate).not.toHaveBeenCalled();
      expect(rule2.validate).toHaveBeenCalled();
    });

    it('should get all rules including defaults', () => {
      // Arrange
      const defaultRules = [
        { name: 'default1' },
        { name: 'default2' },
      ];
      const customRule = { name: 'custom' };

      mockRuleFactory.getDefaultRules.mockReturnValue(defaultRules);
      validator.addRule(customRule);

      // Act
      const rules = validator.getRules();

      // Assert
      expect(rules).toHaveLength(3);
      expect(rules.map(r => r.name)).toEqual(['default1', 'default2', 'custom']);
    });
  });

  describe('error handling', () => {
    it('should handle validation rule exceptions', async () => {
      // Arrange
      const failingRule = {
        name: 'failing-rule',
        validate: vi.fn().mockRejectedValue(new Error('Rule execution failed')),
      };

      validator.addRule(failingRule);

      mockParser.parse.mockResolvedValue({
        $type: 'Grammar',
        name: 'Test',
        rules: [],
      });
      mockParser.getDocument.mockResolvedValue({
        parseResult: { parserErrors: [], lexerErrors: [] },
      });

      // Act
      const result = await validator.validate('/test/grammar.langium');

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Validation rule failed',
        expect.objectContaining({
          rule: 'failing-rule',
          error: expect.any(Error),
        })
      );
      expect(mockErrorCollector.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation rule failing-rule failed: Rule execution failed',
        })
      );
    });

    it('should continue validation after rule failure', async () => {
      // Arrange
      const failingRule = {
        name: 'failing',
        validate: vi.fn().mockRejectedValue(new Error('Failed')),
      };
      const successRule = {
        name: 'success',
        validate: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      };

      validator.addRule(failingRule);
      validator.addRule(successRule);

      mockParser.parse.mockResolvedValue({
        $type: 'Grammar',
        name: 'Test',
        rules: [],
      });
      mockParser.getDocument.mockResolvedValue({
        parseResult: { parserErrors: [], lexerErrors: [] },
      });

      // Act
      await validator.validate('/test/grammar.langium');

      // Assert
      expect(failingRule.validate).toHaveBeenCalled();
      expect(successRule.validate).toHaveBeenCalled();
    });
  });
});