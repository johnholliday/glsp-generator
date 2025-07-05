/**
 * Plugin management service
 * @module core/services
 */

import { injectable, inject } from 'inversify';
import { TYPES, CONFIG_TOKEN } from '../../infrastructure/di/symbols';
import { IGeneratorPlugin, IEventDrivenGenerator } from '../interfaces';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';
import { PluginError } from '../../infrastructure/errors/ErrorHierarchy';
import * as path from 'path';
import { pathToFileURL } from 'url';

/**
 * Plugin metadata interface
 */
interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  hooks?: string[];
}

/**
 * Plugin instance wrapper
 */
interface PluginInstance {
  plugin: IGeneratorPlugin;
  metadata: PluginMetadata;
  loadTime: Date;
  status: 'loaded' | 'initialized' | 'error';
  error?: Error;
}

/**
 * Plugin manager service
 * Implements Single Responsibility: Manages plugin lifecycle
 */
@injectable()
export class PluginManager {
  private readonly plugins: Map<string, PluginInstance> = new Map();
  private readonly pluginPaths: Set<string> = new Set();
  private generator?: IEventDrivenGenerator;

  constructor(
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(CONFIG_TOKEN.PLUGIN_DIR) private readonly pluginDir: string,
    @inject(CONFIG_TOKEN.ENABLE_PLUGINS) private readonly enablePlugins: boolean
  ) {
    this.logger.info('PluginManager initialized', {
      pluginDir: this.pluginDir,
      enablePlugins: this.enablePlugins
    });
  }

  /**
   * Sets the generator instance for plugin initialization
   */
  setGenerator(generator: IEventDrivenGenerator): void {
    this.generator = generator;
  }

  /**
   * Loads a plugin by name or path
   */
  async loadPlugin(nameOrPath: string): Promise<void> {
    if (!this.enablePlugins) {
      this.logger.warn('Plugins are disabled');
      return;
    }

    try {
      this.logger.info(`Loading plugin: ${nameOrPath}`);
      
      const pluginPath = this.resolvePluginPath(nameOrPath);
      
      // Check if already loaded
      if (this.pluginPaths.has(pluginPath)) {
        this.logger.debug(`Plugin already loaded: ${nameOrPath}`);
        return;
      }

      // Load plugin module
      const module = await this.loadPluginModule(pluginPath);
      
      // Validate plugin
      const plugin = this.validatePlugin(module, nameOrPath);
      
      // Extract metadata
      const metadata = this.extractMetadata(module, plugin);
      
      // Check dependencies
      await this.checkDependencies(metadata);
      
      // Register plugin
      this.registerPlugin(plugin, metadata, pluginPath);
      
      // Initialize if generator is available
      if (this.generator) {
        await this.initializePlugin(plugin.name);
      }

    } catch (error) {
      throw new PluginError(
        `Failed to load plugin ${nameOrPath}`,
        nameOrPath,
        error as Error
      );
    }
  }

  /**
   * Loads multiple plugins
   */
  async loadPlugins(plugins: string[]): Promise<void> {
    const results = await Promise.allSettled(
      plugins.map(plugin => this.loadPlugin(plugin))
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.error(`Failed to load ${failures.length} plugins`, undefined, {
        failures: failures.map((f: any) => f.reason?.message)
      });
    }
  }

  /**
   * Initializes a loaded plugin
   */
  async initializePlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new PluginError(`Plugin not found: ${name}`, name);
    }

    if (instance.status === 'initialized') {
      return;
    }

    if (!this.generator) {
      throw new PluginError(
        'Cannot initialize plugin without generator',
        name
      );
    }

    try {
      this.logger.debug(`Initializing plugin: ${name}`);
      await instance.plugin.initialize(this.generator);
      instance.status = 'initialized';
      this.logger.info(`Plugin initialized: ${name}`);
    } catch (error) {
      instance.status = 'error';
      instance.error = error as Error;
      throw new PluginError(
        `Failed to initialize plugin ${name}`,
        name,
        error as Error
      );
    }
  }

  /**
   * Initializes all loaded plugins
   */
  async initializeAllPlugins(): Promise<void> {
    if (!this.generator) {
      throw new Error('Generator not set');
    }

    const plugins = Array.from(this.plugins.keys());
    await Promise.all(
      plugins.map(name => this.initializePlugin(name))
    );
  }

  /**
   * Disposes a plugin
   */
  async disposePlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      return;
    }

    try {
      if (instance.status === 'initialized') {
        await instance.plugin.dispose();
      }
      this.plugins.delete(name);
      this.logger.info(`Plugin disposed: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to dispose plugin ${name}`, error as Error);
    }
  }

  /**
   * Disposes all plugins
   */
  async disposeAllPlugins(): Promise<void> {
    const plugins = Array.from(this.plugins.keys());
    await Promise.all(
      plugins.map(name => this.disposePlugin(name))
    );
  }

  /**
   * Gets a loaded plugin
   */
  getPlugin(name: string): IGeneratorPlugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  /**
   * Gets all loaded plugins
   */
  getPlugins(): IGeneratorPlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.status !== 'error')
      .map(p => p.plugin);
  }

  /**
   * Gets plugin metadata
   */
  getPluginMetadata(name: string): PluginMetadata | undefined {
    return this.plugins.get(name)?.metadata;
  }

  /**
   * Lists all loaded plugins with their status
   */
  listPlugins(): Array<{ name: string; status: string; metadata: PluginMetadata }> {
    return Array.from(this.plugins.entries()).map(([name, instance]) => ({
      name,
      status: instance.status,
      metadata: instance.metadata
    }));
  }

  /**
   * Private helper methods
   */
  private resolvePluginPath(nameOrPath: string): string {
    // Check if it's a path
    if (nameOrPath.includes('/') || nameOrPath.includes('\\')) {
      return path.resolve(nameOrPath);
    }

    // Check built-in plugins
    const builtInPath = path.join(__dirname, '../../plugins/builtin', nameOrPath);
    if (this.pluginExists(builtInPath)) {
      return builtInPath;
    }

    // Check plugin directory
    if (this.pluginDir) {
      const pluginDirPath = path.join(this.pluginDir, nameOrPath);
      if (this.pluginExists(pluginDirPath)) {
        return pluginDirPath;
      }
    }

    // Assume it's an npm package
    return nameOrPath;
  }

  private pluginExists(pluginPath: string): boolean {
    try {
      require.resolve(pluginPath);
      return true;
    } catch {
      return false;
    }
  }

  private async loadPluginModule(pluginPath: string): Promise<any> {
    try {
      // Use dynamic import for ES modules
      const url = pathToFileURL(pluginPath).href;
      const module = await import(url);
      return module.default || module;
    } catch (error) {
      // Fallback to require for CommonJS
      try {
        return require(pluginPath);
      } catch {
        throw error;
      }
    }
  }

  private validatePlugin(module: any, name: string): IGeneratorPlugin {
    // Check if module exports a plugin class
    if (typeof module === 'function') {
      const instance = new module();
      if (this.isValidPlugin(instance)) {
        return instance;
      }
    }

    // Check if module directly exports a plugin
    if (this.isValidPlugin(module)) {
      return module;
    }

    // Check for named export
    if (module.Plugin && typeof module.Plugin === 'function') {
      const instance = new module.Plugin();
      if (this.isValidPlugin(instance)) {
        return instance;
      }
    }

    throw new Error(`Invalid plugin format: ${name}`);
  }

  private isValidPlugin(obj: any): obj is IGeneratorPlugin {
    return (
      obj &&
      typeof obj.name === 'string' &&
      typeof obj.version === 'string' &&
      typeof obj.initialize === 'function' &&
      typeof obj.dispose === 'function'
    );
  }

  private extractMetadata(module: any, plugin: IGeneratorPlugin): PluginMetadata {
    // Try to get metadata from module exports
    const metadata = module.metadata || module.METADATA || {};
    
    return {
      name: plugin.name,
      version: plugin.version,
      description: metadata.description || module.description,
      author: metadata.author || module.author,
      dependencies: metadata.dependencies || [],
      hooks: metadata.hooks || []
    };
  }

  private async checkDependencies(metadata: PluginMetadata): Promise<void> {
    if (!metadata.dependencies || metadata.dependencies.length === 0) {
      return;
    }

    for (const dep of metadata.dependencies) {
      if (!this.plugins.has(dep)) {
        this.logger.warn(`Plugin ${metadata.name} depends on ${dep}, which is not loaded`);
      }
    }
  }

  private registerPlugin(
    plugin: IGeneratorPlugin,
    metadata: PluginMetadata,
    pluginPath: string
  ): void {
    this.plugins.set(plugin.name, {
      plugin,
      metadata,
      loadTime: new Date(),
      status: 'loaded'
    });
    
    this.pluginPaths.add(pluginPath);
    
    this.logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`, {
      metadata
    });
  }
}