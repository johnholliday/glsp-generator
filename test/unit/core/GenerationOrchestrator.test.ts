/**
 * Unit tests for GenerationOrchestrator
 * @module test/unit/core
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'inversify';
import { GenerationOrchestrator } from '../../../src/core/services/GenerationOrchestrator';
import { TYPES } from '../../../src/infrastructure/di/symbols';
import { TestFramework } from '../../utils/test-framework';
import { MockFactory } from '../../mocks/mock-services';
import { createGrammarContent } from '../../fixtures/grammar-fixtures';
import { GenerationConfig, GenerationPhase } from '../../../src/core/interfaces/IGenerator';

describe('GenerationOrchestrator', () => {
  let container: Container;
  let orchestrator: GenerationOrchestrator;
  let mockParser: any;
  let mockValidator: any;
  let mockTemplateEngine: any;
  let mockEventBus: any;
  let mockLogger: any;
  let mockFileSystem: any;
  let mockPluginManager: any;
  let mockConfigManager: any;

  // Helper to create mock Grammar objects
  const createMockGrammar = (overrides?: any) => ({
    $type: 'Grammar',
    name: 'TestGrammar',
    rules: [],
    interfaces: [],
    types: [],
    imports: [],
    isDeclared: true,
    ...overrides,
  });

  beforeEach(() => {
    // Create test container with mocks
    container = new TestFramework.TestBuilder()
      .withMockParser()
      .withMockValidator()
      .withMockEventBus()
      .withMockLogger()
      .withMockFileSystem()
      .build();

    // Get mocks
    mockParser = TestFramework.getMock(container, TYPES.IParser);
    mockValidator = TestFramework.getMock(container, TYPES.IValidator);
    mockTemplateEngine = TestFramework.getMock(container, TYPES.ITemplateEngine);
    mockEventBus = TestFramework.getMock(container, TYPES.IEventBus);
    mockLogger = TestFramework.getMock(container, TYPES.IStructuredLogger);
    mockFileSystem = TestFramework.getMock(container, TYPES.IFileSystem);

    // Create mock plugin manager
    mockPluginManager = {
      loadPlugins: vi.fn().mockResolvedValue([]),
      executeHook: vi.fn().mockResolvedValue(undefined),
      getPlugins: vi.fn().mockReturnValue([]),
    };

    // Create mock config manager
    mockConfigManager = {
      loadConfig: vi.fn().mockResolvedValue({}),
      validateConfig: vi.fn().mockResolvedValue({ valid: true }),
      getConfig: vi.fn().mockReturnValue({}),
    };

    // Bind additional mocks
    container.bind(TYPES.PluginManager).toConstantValue(mockPluginManager);
    container.bind(TYPES.ConfigurationManager).toConstantValue(mockConfigManager);
    container.bind(TYPES.ITemplateEngine).toConstantValue(mockTemplateEngine);

    // Create orchestrator
    orchestrator = new GenerationOrchestrator(
      mockParser,
      mockValidator,
      mockTemplateEngine,
      mockEventBus,
      mockLogger,
      mockFileSystem,
      mockPluginManager,
      mockConfigManager
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should successfully generate files for valid grammar', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(false);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.outputDir).toBe(config.outputDir);
      expect(result.errors).toEqual([]);

      // Verify event flow
      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:start', {
        grammarPath: config.grammarPath,
        outputDir: config.outputDir,
      });

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:phase:start', {
        phase: GenerationPhase.PARSING,
      });

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:phase:complete', {
        phase: GenerationPhase.PARSING,
      });

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:complete');
    });

    it('should fail when grammar validation fails', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const mockGrammar = createMockGrammar();
      const validationErrors = [
        { severity: 'error', message: 'Invalid rule', code: 'INVALID_RULE' },
      ];

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: validationErrors,
        warnings: [],
      });

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Grammar validation failed');

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:error', {
        phase: GenerationPhase.VALIDATION,
      });
    });

    it('should skip validation when validate option is false', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { validate: false },
      });
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(false);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(mockValidator.validate).not.toHaveBeenCalled();
    });

    it('should execute plugin hooks in correct order', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { plugins: ['test-plugin'] },
      });
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(false);

      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };
      mockPluginManager.loadPlugins.mockResolvedValue([mockPlugin]);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);

      // Verify plugin hooks were called
      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'beforeGenerate',
        expect.objectContaining({ config, grammar: mockGrammar })
      );

      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'afterGenerate',
        expect.objectContaining({ config, result: expect.any(Object) })
      );

      // Verify hook order
      const hookCalls = mockPluginManager.executeHook.mock.calls;
      const beforeIndex = hookCalls.findIndex(call => call[0] === 'beforeGenerate');
      const afterIndex = hookCalls.findIndex(call => call[0] === 'afterGenerate');
      expect(beforeIndex).toBeLessThan(afterIndex);
    });

    it('should handle parser errors gracefully', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const parseError = new Error('Failed to parse grammar');

      mockParser.parse.mockRejectedValue(parseError);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to parse grammar');

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:error', {
        phase: GenerationPhase.PARSING,
        error: expect.objectContaining({ message: 'Failed to parse grammar' }),
      });
    });

    it('should generate files in dry-run mode without writing', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { dryRun: true },
      });
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
      expect(mockFileSystem.ensureDir).not.toHaveBeenCalled();
    });

    it('should force overwrite when force option is true', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { force: true },
      });
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(true); // Directory exists

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFileSystem.emptyDir).toHaveBeenCalledWith(config.outputDir);
    });

    it('should collect generation metadata', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const mockGrammar = createMockGrammar({
        rules: [
          { name: 'Rule1' },
          { name: 'Rule2' },
          { name: 'Rule3' },
        ],
        interfaces: [
          { name: 'Interface1' },
          { name: 'Interface2' },
        ],
        types: [
          { name: 'Type1' },
        ],
      });

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(false);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.grammarInfo).toEqual({
        rules: 3,
        interfaces: 2,
        types: 1,
      });
      expect(result.metadata?.duration).toBeGreaterThan(0);
    });

    it('should handle template rendering errors', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const mockGrammar = createMockGrammar();
      const renderError = new Error('Template rendering failed');

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockRejectedValue(renderError);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Template rendering failed');

      TestFramework.assert.assertEventEmitted(mockEventBus, 'generation:error', {
        phase: GenerationPhase.GENERATION,
      });
    });

    it('should respect template selection options', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { templates: ['browser', 'common'] }, // No 'server'
      });
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockTemplateEngine.listTemplates.mockResolvedValue([
        { name: 'browser-template', strategy: 'browser' },
        { name: 'server-template', strategy: 'server' },
        { name: 'common-template', strategy: 'common' },
      ]);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);

      // Verify only selected templates were rendered
      const renderCalls = mockTemplateEngine.render.mock.calls;
      const renderedTemplates = renderCalls.map(call => call[0]);

      expect(renderedTemplates).toContain('browser-template');
      expect(renderedTemplates).toContain('common-template');
      expect(renderedTemplates).not.toContain('server-template');
    });
  });

  describe('error handling', () => {
    it('should handle plugin loading errors', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig({
        options: { plugins: ['failing-plugin'] },
      });
      const pluginError = new Error('Plugin not found');

      mockPluginManager.loadPlugins.mockRejectedValue(pluginError);

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Plugin not found');
    });

    it('should continue generation if non-critical plugin hook fails', async () => {
      // Arrange
      const config = TestFramework.createTestGenerationConfig();
      const mockGrammar = createMockGrammar();

      mockParser.parse.mockResolvedValue(mockGrammar);
      mockValidator.validate.mockResolvedValue({ valid: true, errors: [], warnings: [] });
      mockTemplateEngine.render.mockResolvedValue('<rendered content>');
      mockFileSystem.exists.mockResolvedValue(false);

      // Make afterGenerate hook fail (non-critical)
      mockPluginManager.executeHook.mockImplementation(async (hook) => {
        if (hook === 'afterGenerate') {
          throw new Error('Hook failed');
        }
      });

      // Act
      const result = await orchestrator.generate(config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Plugin hook afterGenerate failed: Hook failed');
    });
  });
});