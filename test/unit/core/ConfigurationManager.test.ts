/**
 * Unit tests for ConfigurationManager
 * @module test/unit/core
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigurationManager } from '../../../src/core/services/ConfigurationManager';
import { IFileSystem } from '../../../src/infrastructure/filesystem/IFileSystem';
import { ISchemaValidator } from '../../../src/validation/interfaces/ISchemaValidator';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { MockFileSystem, MockLogger } from '../../mocks/mock-services';

// Mock cosmiconfig
vi.mock('cosmiconfig', () => ({
  cosmiconfig: vi.fn(() => ({
    search: vi.fn(),
    load: vi.fn(),
  })),
  cosmiconfigSync: vi.fn(() => ({
    search: vi.fn(),
    load: vi.fn(),
  })),
}));

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let mockFileSystem: IFileSystem;
  let mockSchemaValidator: ISchemaValidator;
  let mockLogger: IStructuredLogger;
  let mockExplorer: any;

  beforeEach(() => {
    // Reset module mocks
    vi.clearAllMocks();

    // Create mocks
    mockFileSystem = new MockFileSystem(new Map([
      ['/project/.glsprc.json', JSON.stringify({
        extension: {
          name: 'my-extension',
          version: '1.0.0',
        },
        templates: ['browser', 'server'],
        validation: {
          strict: true,
        },
      })],
      ['/project/package.json', JSON.stringify({
        name: 'test-project',
        glsp: {
          templates: ['common'],
          plugins: ['documentation'],
        },
      })],
      ['/home/.glsprc.yaml', `
extension:
  publisher: user
templates:
  - browser
`],
    ]));

    mockSchemaValidator = {
      validateSchema: vi.fn().mockResolvedValue({ 
        valid: true, 
        errors: [],
        data: {} 
      }),
    };

    mockLogger = new MockLogger();

    // Mock cosmiconfig explorer
    mockExplorer = {
      search: vi.fn(),
      load: vi.fn(),
    };

    const { cosmiconfig } = require('cosmiconfig');
    cosmiconfig.mockReturnValue(mockExplorer);

    // Create config manager
    configManager = new ConfigurationManager(
      mockFileSystem,
      mockSchemaValidator,
      mockLogger
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load configuration from default search', async () => {
      // Arrange
      const config = {
        extension: { name: 'found-extension' },
        templates: ['browser'],
      };

      mockExplorer.search.mockResolvedValue({
        config,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: config,
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toEqual(config);
      expect(mockExplorer.search).toHaveBeenCalledWith();
      expect(mockSchemaValidator.validateSchema).toHaveBeenCalledWith(
        config,
        expect.any(Object)
      );
    });

    it('should load configuration from specific path', async () => {
      // Arrange
      const configPath = '/custom/config.json';
      const config = {
        extension: { name: 'custom-extension' },
      };

      mockExplorer.load.mockResolvedValue({
        config,
        filepath: configPath,
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: config,
      });

      // Act
      const result = await configManager.loadConfig(configPath);

      // Assert
      expect(result).toEqual(config);
      expect(mockExplorer.load).toHaveBeenCalledWith(configPath);
      expect(mockExplorer.search).not.toHaveBeenCalled();
    });

    it('should merge configurations from multiple sources', async () => {
      // Arrange
      const homeConfig = {
        extension: { publisher: 'user' },
        templates: ['browser'],
      };

      const projectConfig = {
        extension: { name: 'project-extension' },
        templates: ['server'],
        plugins: ['test'],
      };

      // First search returns home config
      mockExplorer.search.mockResolvedValueOnce({
        config: homeConfig,
        filepath: '/home/.glsprc.json',
      });

      // Second search returns project config
      mockExplorer.search.mockResolvedValueOnce({
        config: projectConfig,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: expect.any(Object),
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toMatchObject({
        extension: {
          publisher: 'user',
          name: 'project-extension',
        },
        templates: ['server'], // Project overrides home
        plugins: ['test'],
      });
    });

    it('should return default config when no config found', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue(null);

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toMatchObject({
        extension: {
          name: expect.any(String),
          version: '0.1.0',
        },
        templates: expect.arrayContaining(['browser', 'server', 'common']),
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidConfig = {
        extension: { name: 123 }, // Should be string
      };

      mockExplorer.search.mockResolvedValue({
        config: invalidConfig,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: false,
        errors: [
          { path: ['extension', 'name'], message: 'Expected string' },
        ],
        data: invalidConfig,
      });

      // Act & Assert
      await expect(configManager.loadConfig()).rejects.toThrow('Invalid configuration');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Configuration validation failed',
        expect.objectContaining({
          errors: expect.any(Array),
        })
      );
    });

    it('should support environment variable interpolation', async () => {
      // Arrange
      process.env.GLSP_VERSION = '2.0.0';
      process.env.GLSP_NAME = 'env-extension';

      const configWithEnv = {
        extension: {
          name: '${GLSP_NAME}',
          version: '${GLSP_VERSION}',
        },
      };

      mockExplorer.search.mockResolvedValue({
        config: configWithEnv,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockImplementation(async (data) => ({
        valid: true,
        errors: [],
        data: {
          extension: {
            name: 'env-extension',
            version: '2.0.0',
          },
        },
      }));

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result.extension.name).toBe('env-extension');
      expect(result.extension.version).toBe('2.0.0');

      // Cleanup
      delete process.env.GLSP_VERSION;
      delete process.env.GLSP_NAME;
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration object', async () => {
      // Arrange
      const config = {
        extension: { name: 'test' },
        templates: ['browser'],
      };

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: config,
      });

      // Act
      const result = await configManager.validateConfig(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return validation errors', async () => {
      // Arrange
      const config = {
        extension: {},
        templates: 'not-an-array',
      };

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: false,
        errors: [
          { path: ['extension', 'name'], message: 'Required' },
          { path: ['templates'], message: 'Expected array' },
        ],
        data: config,
      });

      // Act
      const result = await configManager.validateConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', async () => {
      // Arrange
      const config = {
        extension: { name: 'current' },
      };

      mockExplorer.search.mockResolvedValue({
        config,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: config,
      });

      await configManager.loadConfig();

      // Act
      const result = configManager.getConfig();

      // Assert
      expect(result).toEqual(config);
    });

    it('should throw if config not loaded', () => {
      // Act & Assert
      expect(() => configManager.getConfig()).toThrow('Configuration not loaded');
    });
  });

  describe('config file formats', () => {
    it('should load JSON config', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue({
        config: { extension: { name: 'json-config' } },
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: { extension: { name: 'json-config' } },
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result.extension.name).toBe('json-config');
    });

    it('should load YAML config', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue({
        config: { extension: { name: 'yaml-config' } },
        filepath: '/project/.glsprc.yaml',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: { extension: { name: 'yaml-config' } },
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result.extension.name).toBe('yaml-config');
    });

    it('should load JS config', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue({
        config: { extension: { name: 'js-config' } },
        filepath: '/project/glsp.config.js',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: { extension: { name: 'js-config' } },
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result.extension.name).toBe('js-config');
    });

    it('should load config from package.json', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue({
        config: { extension: { name: 'package-config' } },
        filepath: '/project/package.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: { extension: { name: 'package-config' } },
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result.extension.name).toBe('package-config');
    });
  });

  describe('caching', () => {
    it('should cache loaded configuration', async () => {
      // Arrange
      const config = { extension: { name: 'cached' } };

      mockExplorer.search.mockResolvedValue({
        config,
        filepath: '/project/.glsprc.json',
      });

      mockSchemaValidator.validateSchema.mockResolvedValue({
        valid: true,
        errors: [],
        data: config,
      });

      // Act
      const result1 = await configManager.loadConfig();
      const result2 = await configManager.loadConfig();

      // Assert
      expect(result1).toBe(result2); // Same object reference
      expect(mockExplorer.search).toHaveBeenCalledTimes(1); // Only loaded once
    });

    it('should reload config when forced', async () => {
      // Arrange
      const config1 = { extension: { name: 'first' } };
      const config2 = { extension: { name: 'second' } };

      mockExplorer.search
        .mockResolvedValueOnce({ config: config1, filepath: '/project/.glsprc.json' })
        .mockResolvedValueOnce({ config: config2, filepath: '/project/.glsprc.json' });

      mockSchemaValidator.validateSchema
        .mockResolvedValueOnce({ valid: true, errors: [], data: config1 })
        .mockResolvedValueOnce({ valid: true, errors: [], data: config2 });

      // Act
      const result1 = await configManager.loadConfig();
      const result2 = await configManager.loadConfig(undefined, { reload: true });

      // Assert
      expect(result1.extension.name).toBe('first');
      expect(result2.extension.name).toBe('second');
      expect(mockExplorer.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      // Arrange
      mockExplorer.search.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toMatchObject({
        extension: { name: expect.any(String) }, // Default config
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to load configuration, using defaults',
        expect.any(Object)
      );
    });

    it('should handle malformed config files', async () => {
      // Arrange
      mockExplorer.search.mockResolvedValue({
        config: null,
        filepath: '/project/.glsprc.json',
        isEmpty: true,
      });

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});