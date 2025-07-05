/**
 * Unit tests for PluginManager
 * @module test/unit/core
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'inversify';
import { PluginManager } from '../../../src/core/services/PluginManager';
import { IPlugin, PluginMetadata } from '../../../src/core/interfaces/IPlugin';
import { IEventBus } from '../../../src/infrastructure/events/IEventBus';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { TYPES } from '../../../src/infrastructure/di/symbols';
import { MockEventBus, MockLogger } from '../../mocks/mock-services';
import { TestFramework } from '../../utils/test-framework';

// Mock plugin implementations
class MockPlugin implements IPlugin {
  constructor(
    public metadata: PluginMetadata,
    public initFn?: () => Promise<void>,
    public executeFn?: (context: any) => Promise<void>,
    public cleanupFn?: () => Promise<void>
  ) {}

  async initialize(): Promise<void> {
    if (this.initFn) await this.initFn();
  }

  async execute(context: any): Promise<void> {
    if (this.executeFn) await this.executeFn(context);
  }

  async cleanup(): Promise<void> {
    if (this.cleanupFn) await this.cleanupFn();
  }
}

describe('PluginManager', () => {
  let container: Container;
  let pluginManager: PluginManager;
  let mockEventBus: IEventBus;
  let mockLogger: IStructuredLogger;

  beforeEach(() => {
    // Create test container
    container = new TestFramework.TestBuilder()
      .withMockEventBus()
      .withMockLogger()
      .build();

    mockEventBus = container.get<IEventBus>(TYPES.IEventBus);
    mockLogger = container.get<IStructuredLogger>(TYPES.IStructuredLogger);

    // Create plugin manager
    pluginManager = new PluginManager(container, mockEventBus, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerPlugin', () => {
    it('should register a plugin successfully', async () => {
      // Arrange
      const metadata: PluginMetadata = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
      };
      const plugin = new MockPlugin(metadata);

      // Act
      await pluginManager.registerPlugin(plugin);

      // Assert
      const plugins = pluginManager.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].metadata.name).toBe('test-plugin');
      
      // Verify event
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:registered', {
        name: 'test-plugin',
        version: '1.0.0',
      });
    });

    it('should prevent duplicate plugin registration', async () => {
      // Arrange
      const metadata: PluginMetadata = {
        name: 'duplicate-plugin',
        version: '1.0.0',
      };
      const plugin1 = new MockPlugin(metadata);
      const plugin2 = new MockPlugin(metadata);

      // Act
      await pluginManager.registerPlugin(plugin1);

      // Assert
      await expect(pluginManager.registerPlugin(plugin2)).rejects.toThrow(
        'Plugin duplicate-plugin is already registered'
      );
    });

    it('should validate plugin dependencies', async () => {
      // Arrange
      const dependentPlugin = new MockPlugin({
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['required-plugin@^1.0.0'],
      });

      // Act & Assert
      await expect(pluginManager.registerPlugin(dependentPlugin)).rejects.toThrow(
        'Missing required dependency: required-plugin@^1.0.0'
      );
    });

    it('should register plugins with satisfied dependencies', async () => {
      // Arrange
      const basePlugin = new MockPlugin({
        name: 'base-plugin',
        version: '1.0.0',
      });

      const dependentPlugin = new MockPlugin({
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin@^1.0.0'],
      });

      // Act
      await pluginManager.registerPlugin(basePlugin);
      await pluginManager.registerPlugin(dependentPlugin);

      // Assert
      expect(pluginManager.getPlugins()).toHaveLength(2);
    });

    it('should validate version compatibility', async () => {
      // Arrange
      const basePlugin = new MockPlugin({
        name: 'base-plugin',
        version: '1.0.0',
      });

      const incompatiblePlugin = new MockPlugin({
        name: 'incompatible-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin@^2.0.0'], // Requires v2
      });

      // Act
      await pluginManager.registerPlugin(basePlugin);

      // Assert
      await expect(pluginManager.registerPlugin(incompatiblePlugin)).rejects.toThrow(
        'Incompatible version for dependency base-plugin'
      );
    });

    it('should handle plugin with configuration', async () => {
      // Arrange
      const metadata: PluginMetadata = {
        name: 'configurable-plugin',
        version: '1.0.0',
        config: {
          apiKey: 'test-key',
          endpoint: 'https://api.example.com',
        },
      };
      const plugin = new MockPlugin(metadata);

      // Act
      await pluginManager.registerPlugin(plugin);

      // Assert
      const registered = pluginManager.getPlugin('configurable-plugin');
      expect(registered?.metadata.config).toEqual({
        apiKey: 'test-key',
        endpoint: 'https://api.example.com',
      });
    });
  });

  describe('initializePlugins', () => {
    it('should initialize all plugins in order', async () => {
      // Arrange
      const initOrder: string[] = [];
      
      const plugin1 = new MockPlugin(
        { name: 'plugin1', version: '1.0.0' },
        async () => { initOrder.push('plugin1'); }
      );

      const plugin2 = new MockPlugin(
        { name: 'plugin2', version: '1.0.0' },
        async () => { initOrder.push('plugin2'); }
      );

      const plugin3 = new MockPlugin(
        { name: 'plugin3', version: '1.0.0' },
        async () => { initOrder.push('plugin3'); }
      );

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.registerPlugin(plugin3);

      // Act
      await pluginManager.initializePlugins();

      // Assert
      expect(initOrder).toEqual(['plugin1', 'plugin2', 'plugin3']);
      
      // Verify events
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:initialized', {
        name: 'plugin1',
      });
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:initialized', {
        name: 'plugin2',
      });
    });

    it('should handle plugin initialization failure', async () => {
      // Arrange
      const failingPlugin = new MockPlugin(
        { name: 'failing-plugin', version: '1.0.0' },
        async () => { throw new Error('Init failed'); }
      );

      const normalPlugin = new MockPlugin(
        { name: 'normal-plugin', version: '1.0.0' },
        async () => { /* success */ }
      );

      await pluginManager.registerPlugin(failingPlugin);
      await pluginManager.registerPlugin(normalPlugin);

      // Act & Assert
      await expect(pluginManager.initializePlugins()).rejects.toThrow('Init failed');
      
      // Verify error event
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:error', {
        name: 'failing-plugin',
        error: expect.any(Error),
      });
    });

    it('should respect plugin priority during initialization', async () => {
      // Arrange
      const initOrder: string[] = [];
      
      const lowPriority = new MockPlugin(
        { name: 'low', version: '1.0.0', priority: 10 },
        async () => { initOrder.push('low'); }
      );

      const highPriority = new MockPlugin(
        { name: 'high', version: '1.0.0', priority: 1 },
        async () => { initOrder.push('high'); }
      );

      const mediumPriority = new MockPlugin(
        { name: 'medium', version: '1.0.0', priority: 5 },
        async () => { initOrder.push('medium'); }
      );

      // Register in random order
      await pluginManager.registerPlugin(lowPriority);
      await pluginManager.registerPlugin(highPriority);
      await pluginManager.registerPlugin(mediumPriority);

      // Act
      await pluginManager.initializePlugins();

      // Assert - should initialize in priority order
      expect(initOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should skip already initialized plugins', async () => {
      // Arrange
      let initCount = 0;
      const plugin = new MockPlugin(
        { name: 'test-plugin', version: '1.0.0' },
        async () => { initCount++; }
      );

      await pluginManager.registerPlugin(plugin);

      // Act
      await pluginManager.initializePlugins();
      await pluginManager.initializePlugins(); // Second call

      // Assert
      expect(initCount).toBe(1); // Only initialized once
    });
  });

  describe('executePlugins', () => {
    it('should execute all plugins with context', async () => {
      // Arrange
      const executionLog: Array<{ plugin: string; context: any }> = [];
      
      const plugin1 = new MockPlugin(
        { name: 'plugin1', version: '1.0.0' },
        undefined,
        async (ctx) => { executionLog.push({ plugin: 'plugin1', context: ctx }); }
      );

      const plugin2 = new MockPlugin(
        { name: 'plugin2', version: '1.0.0' },
        undefined,
        async (ctx) => { executionLog.push({ plugin: 'plugin2', context: ctx }); }
      );

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.initializePlugins();

      const context = { data: 'test-data' };

      // Act
      await pluginManager.executePlugins(context);

      // Assert
      expect(executionLog).toHaveLength(2);
      expect(executionLog[0]).toEqual({ plugin: 'plugin1', context });
      expect(executionLog[1]).toEqual({ plugin: 'plugin2', context });
      
      // Verify event
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:executed', {
        name: 'plugin1',
      });
    });

    it('should filter plugins by phase', async () => {
      // Arrange
      const executionLog: string[] = [];
      
      const prePlugin = new MockPlugin(
        { name: 'pre-plugin', version: '1.0.0', phase: 'pre-generation' },
        undefined,
        async () => { executionLog.push('pre'); }
      );

      const postPlugin = new MockPlugin(
        { name: 'post-plugin', version: '1.0.0', phase: 'post-generation' },
        undefined,
        async () => { executionLog.push('post'); }
      );

      await pluginManager.registerPlugin(prePlugin);
      await pluginManager.registerPlugin(postPlugin);
      await pluginManager.initializePlugins();

      // Act
      await pluginManager.executePlugins({}, 'pre-generation');

      // Assert
      expect(executionLog).toEqual(['pre']); // Only pre-generation plugin executed
    });

    it('should handle plugin execution errors', async () => {
      // Arrange
      const errorPlugin = new MockPlugin(
        { name: 'error-plugin', version: '1.0.0' },
        undefined,
        async () => { throw new Error('Execution failed'); }
      );

      await pluginManager.registerPlugin(errorPlugin);
      await pluginManager.initializePlugins();

      // Act & Assert
      await expect(pluginManager.executePlugins({})).rejects.toThrow('Execution failed');
      
      // Verify error logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Plugin execution failed',
        expect.objectContaining({
          plugin: 'error-plugin',
          error: expect.any(Error),
        })
      );
    });

    it('should pass modified context between plugins', async () => {
      // Arrange
      const plugin1 = new MockPlugin(
        { name: 'plugin1', version: '1.0.0' },
        undefined,
        async (ctx) => { ctx.modified = true; ctx.value = 1; }
      );

      const plugin2 = new MockPlugin(
        { name: 'plugin2', version: '1.0.0' },
        undefined,
        async (ctx) => { 
          expect(ctx.modified).toBe(true);
          ctx.value = ctx.value * 2;
        }
      );

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.initializePlugins();

      const context: any = {};

      // Act
      await pluginManager.executePlugins(context);

      // Assert
      expect(context.modified).toBe(true);
      expect(context.value).toBe(2);
    });
  });

  describe('cleanupPlugins', () => {
    it('should cleanup all plugins in reverse order', async () => {
      // Arrange
      const cleanupOrder: string[] = [];
      
      const plugin1 = new MockPlugin(
        { name: 'plugin1', version: '1.0.0' },
        undefined,
        undefined,
        async () => { cleanupOrder.push('plugin1'); }
      );

      const plugin2 = new MockPlugin(
        { name: 'plugin2', version: '1.0.0' },
        undefined,
        undefined,
        async () => { cleanupOrder.push('plugin2'); }
      );

      const plugin3 = new MockPlugin(
        { name: 'plugin3', version: '1.0.0' },
        undefined,
        undefined,
        async () => { cleanupOrder.push('plugin3'); }
      );

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.registerPlugin(plugin3);
      await pluginManager.initializePlugins();

      // Act
      await pluginManager.cleanupPlugins();

      // Assert - cleanup in reverse order
      expect(cleanupOrder).toEqual(['plugin3', 'plugin2', 'plugin1']);
    });

    it('should continue cleanup even if plugin fails', async () => {
      // Arrange
      const cleanupLog: string[] = [];
      
      const plugin1 = new MockPlugin(
        { name: 'plugin1', version: '1.0.0' },
        undefined,
        undefined,
        async () => { cleanupLog.push('plugin1'); }
      );

      const failingPlugin = new MockPlugin(
        { name: 'failing-plugin', version: '1.0.0' },
        undefined,
        undefined,
        async () => { throw new Error('Cleanup failed'); }
      );

      const plugin3 = new MockPlugin(
        { name: 'plugin3', version: '1.0.0' },
        undefined,
        undefined,
        async () => { cleanupLog.push('plugin3'); }
      );

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(failingPlugin);
      await pluginManager.registerPlugin(plugin3);
      await pluginManager.initializePlugins();

      // Act
      await pluginManager.cleanupPlugins();

      // Assert - all non-failing plugins cleaned up
      expect(cleanupLog).toEqual(['plugin3', 'plugin1']);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Plugin cleanup failed',
        expect.objectContaining({
          plugin: 'failing-plugin',
        })
      );
    });
  });

  describe('getPlugin', () => {
    it('should retrieve plugin by name', async () => {
      // Arrange
      const plugin = new MockPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test description',
      });

      await pluginManager.registerPlugin(plugin);

      // Act
      const retrieved = pluginManager.getPlugin('test-plugin');

      // Assert
      expect(retrieved).toBe(plugin);
      expect(retrieved?.metadata.description).toBe('Test description');
    });

    it('should return undefined for non-existent plugin', () => {
      // Act
      const result = pluginManager.getPlugin('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getPlugins', () => {
    it('should return all registered plugins', async () => {
      // Arrange
      const plugin1 = new MockPlugin({ name: 'plugin1', version: '1.0.0' });
      const plugin2 = new MockPlugin({ name: 'plugin2', version: '2.0.0' });
      const plugin3 = new MockPlugin({ name: 'plugin3', version: '3.0.0' });

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.registerPlugin(plugin3);

      // Act
      const plugins = pluginManager.getPlugins();

      // Assert
      expect(plugins).toHaveLength(3);
      expect(plugins.map(p => p.metadata.name)).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });

    it('should filter plugins by phase', async () => {
      // Arrange
      const prePlugin = new MockPlugin({ 
        name: 'pre', 
        version: '1.0.0',
        phase: 'pre-generation',
      });
      
      const postPlugin = new MockPlugin({ 
        name: 'post', 
        version: '1.0.0',
        phase: 'post-generation',
      });
      
      const validationPlugin = new MockPlugin({ 
        name: 'validation', 
        version: '1.0.0',
        phase: 'validation',
      });

      await pluginManager.registerPlugin(prePlugin);
      await pluginManager.registerPlugin(postPlugin);
      await pluginManager.registerPlugin(validationPlugin);

      // Act
      const prePlugins = pluginManager.getPlugins('pre-generation');
      const postPlugins = pluginManager.getPlugins('post-generation');

      // Assert
      expect(prePlugins).toHaveLength(1);
      expect(prePlugins[0].metadata.name).toBe('pre');
      expect(postPlugins).toHaveLength(1);
      expect(postPlugins[0].metadata.name).toBe('post');
    });
  });

  describe('hasPlugin', () => {
    it('should return true for registered plugin', async () => {
      // Arrange
      const plugin = new MockPlugin({ name: 'test-plugin', version: '1.0.0' });
      await pluginManager.registerPlugin(plugin);

      // Act & Assert
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
    });

    it('should return false for non-registered plugin', () => {
      // Act & Assert
      expect(pluginManager.hasPlugin('non-existent')).toBe(false);
    });
  });

  describe('disablePlugin', () => {
    it('should disable a plugin', async () => {
      // Arrange
      const plugin = new MockPlugin({ name: 'test-plugin', version: '1.0.0' });
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins();

      // Act
      pluginManager.disablePlugin('test-plugin');

      // Assert
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(false);
      
      // Verify event
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:disabled', {
        name: 'test-plugin',
      });
    });

    it('should not execute disabled plugins', async () => {
      // Arrange
      let executed = false;
      const plugin = new MockPlugin(
        { name: 'test-plugin', version: '1.0.0' },
        undefined,
        async () => { executed = true; }
      );

      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins();
      pluginManager.disablePlugin('test-plugin');

      // Act
      await pluginManager.executePlugins({});

      // Assert
      expect(executed).toBe(false);
    });
  });

  describe('enablePlugin', () => {
    it('should re-enable a disabled plugin', async () => {
      // Arrange
      const plugin = new MockPlugin({ name: 'test-plugin', version: '1.0.0' });
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins();
      pluginManager.disablePlugin('test-plugin');

      // Act
      pluginManager.enablePlugin('test-plugin');

      // Assert
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(true);
      
      // Verify event
      TestFramework.assert.assertEventEmitted(mockEventBus, 'plugin:enabled', {
        name: 'test-plugin',
      });
    });
  });

  describe('plugin lifecycle', () => {
    it('should handle complete plugin lifecycle', async () => {
      // Arrange
      const lifecycleLog: string[] = [];
      const plugin = new MockPlugin(
        { name: 'lifecycle-test', version: '1.0.0' },
        async () => { lifecycleLog.push('initialized'); },
        async () => { lifecycleLog.push('executed'); },
        async () => { lifecycleLog.push('cleaned up'); }
      );

      // Act
      await pluginManager.registerPlugin(plugin);
      lifecycleLog.push('registered');
      
      await pluginManager.initializePlugins();
      await pluginManager.executePlugins({});
      await pluginManager.cleanupPlugins();

      // Assert
      expect(lifecycleLog).toEqual([
        'registered',
        'initialized',
        'executed',
        'cleaned up',
      ]);
    });
  });
});