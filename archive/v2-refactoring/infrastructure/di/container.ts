/**
 * InversifyJS container configuration
 * @module infrastructure/di
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import type { interfaces } from 'inversify';
import { TYPES, SERVICE_IDENTIFIER, CONFIG_TOKEN } from './symbols';

/**
 * Creates and configures the DI container
 */
export function createContainer(config?: ContainerConfig): Container {
  const container = new Container({
    defaultScope: 'Singleton',
  });

  // Apply configuration
  if (config) {
    configureContainer(container, config);
  }

  // Load bindings
  loadCoreBindings(container);
  loadParserBindings(container);
  loadTemplateBindings(container);
  loadValidationBindings(container);
  loadInfrastructureBindings(container);

  return container;
}

/**
 * Container configuration options
 */
export interface ContainerConfig {
  /** Template directory path */
  templateDir?: string;
  /** Output directory path */
  outputDir?: string;
  /** Plugin directory path */
  pluginDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Enable dry run mode */
  dryRun?: boolean;
  /** Enable strict validation */
  strictMode?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Operation timeout in ms */
  timeout?: number;
  /** Enable caching */
  enableCache?: boolean;
  /** Enable plugins */
  enablePlugins?: boolean;
  /** Enable metrics collection */
  enableMetrics?: boolean;
}

/**
 * Configures the container with provided options
 */
function configureContainer(container: Container, config: ContainerConfig): void {
  // Bind configuration values
  if (config.templateDir) {
    container.bind<string>(CONFIG_TOKEN.TEMPLATE_DIR).toConstantValue(config.templateDir);
  }
  if (config.outputDir) {
    container.bind<string>(CONFIG_TOKEN.OUTPUT_DIR).toConstantValue(config.outputDir);
  }
  if (config.pluginDir) {
    container.bind<string>(CONFIG_TOKEN.PLUGIN_DIR).toConstantValue(config.pluginDir);
  }
  
  // Bind boolean flags
  container.bind<boolean>(CONFIG_TOKEN.VERBOSE).toConstantValue(config.verbose ?? false);
  container.bind<boolean>(CONFIG_TOKEN.DRY_RUN).toConstantValue(config.dryRun ?? false);
  container.bind<boolean>(CONFIG_TOKEN.STRICT_MODE).toConstantValue(config.strictMode ?? false);
  container.bind<boolean>(CONFIG_TOKEN.ENABLE_CACHE).toConstantValue(config.enableCache ?? true);
  container.bind<boolean>(CONFIG_TOKEN.ENABLE_PLUGINS).toConstantValue(config.enablePlugins ?? true);
  container.bind<boolean>(CONFIG_TOKEN.ENABLE_METRICS).toConstantValue(config.enableMetrics ?? false);
  
  // Bind numeric values
  container.bind<number>(CONFIG_TOKEN.MAX_FILE_SIZE).toConstantValue(config.maxFileSize ?? 10 * 1024 * 1024); // 10MB
  container.bind<number>(CONFIG_TOKEN.TIMEOUT).toConstantValue(config.timeout ?? 60000); // 60s
}

/**
 * Loads core service bindings
 */
function loadCoreBindings(container: Container): void {
  const { GenerationOrchestrator } = require('../../core/services/GenerationOrchestrator');
  const { ConfigurationManager } = require('../../core/services/ConfigurationManager');
  const { PluginManager } = require('../../core/services/PluginManager');
  
  // Bind orchestrator as both IGenerator and specific interfaces
  container.bind(GenerationOrchestrator).toSelf().inSingletonScope();
  container.bind(TYPES.IGenerator).toService(GenerationOrchestrator);
  container.bind(TYPES.IEventDrivenGenerator).toService(GenerationOrchestrator);
  container.bind(TYPES.IPluginEnabledGenerator).toService(GenerationOrchestrator);
  container.bind(TYPES.GenerationOrchestrator).toService(GenerationOrchestrator);
  
  // Configuration manager
  container.bind(ConfigurationManager).toSelf().inSingletonScope();
  container.bind(TYPES.IConfigurableGenerator).toService(ConfigurationManager);
  container.bind(TYPES.ConfigurationManager).toService(ConfigurationManager);
  
  // Plugin manager
  container.bind(PluginManager).toSelf().inSingletonScope();
  container.bind(TYPES.PluginManager).toService(PluginManager);
}

/**
 * Loads parser service bindings
 */
function loadParserBindings(container: Container): void {
  const { LangiumGrammarParser } = require('../../parser/services/LangiumGrammarParser');
  const { GrammarCache } = require('../../parser/services/GrammarCache');
  
  // Parser implementation
  container.bind(LangiumGrammarParser).toSelf().inSingletonScope();
  container.bind(TYPES.IParser).toService(LangiumGrammarParser);
  container.bind(TYPES.IContentParser).toService(LangiumGrammarParser);
  
  // Parser cache
  container.bind(GrammarCache).toSelf().inSingletonScope();
  container.bind(TYPES.IParserCache).toService(GrammarCache);
}

/**
 * Loads template service bindings
 */
function loadTemplateBindings(container: Container): void {
  const { HandlebarsEngine } = require('../../templates/services/HandlebarsEngine');
  const { FileTemplateLoader } = require('../../templates/services/FileTemplateLoader');
  const { SimpleTemplateRenderer } = require('../../templates/services/SimpleTemplateRenderer');
  const { HelperRegistry } = require('../../templates/services/HelperRegistry');
  const { MemoryTemplateCache } = require('../../templates/services/MemoryTemplateCache');
  const { BrowserStrategy } = require('../../templates/strategies/BrowserStrategy');
  const { ServerStrategy } = require('../../templates/strategies/ServerStrategy');
  const { CommonStrategy } = require('../../templates/strategies/CommonStrategy');
  
  // Template engine
  container.bind(HandlebarsEngine).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateEngine).toService(HandlebarsEngine);
  
  // Template services
  container.bind(FileTemplateLoader).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateLoader).toService(FileTemplateLoader);
  
  container.bind(SimpleTemplateRenderer).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateRenderer).toService(SimpleTemplateRenderer);
  
  container.bind(HelperRegistry).toSelf().inSingletonScope();
  container.bind(TYPES.IHelperRegistry).toService(HelperRegistry);
  
  container.bind(MemoryTemplateCache).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateCache).toService(MemoryTemplateCache);
  
  // Strategy bindings
  container.bind(BrowserStrategy).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateStrategy).toService(BrowserStrategy);
  
  container.bind(ServerStrategy).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateStrategy).toService(ServerStrategy);
  
  container.bind(CommonStrategy).toSelf().inSingletonScope();
  container.bind(TYPES.ITemplateStrategy).toService(CommonStrategy);
}

/**
 * Loads validation service bindings
 */
function loadValidationBindings(container: Container): void {
  const { LangiumValidator } = require('../../validation/services/LangiumValidator');
  const { SchemaValidator } = require('../../validation/services/SchemaValidator');
  const { ErrorCollector } = require('../../validation/services/ErrorCollector');
  
  // Main validator
  container.bind(LangiumValidator).toSelf().inSingletonScope();
  container.bind(TYPES.IValidator).toService(LangiumValidator);
  
  // Schema validator
  container.bind(SchemaValidator).toSelf().inSingletonScope();
  container.bind(TYPES.ISchemaValidator).toService(SchemaValidator);
  
  // Error collector - transient scope for per-validation instance
  container.bind(ErrorCollector).toSelf().inTransientScope();
  container.bind(TYPES.IErrorCollector).toService(ErrorCollector);
}

/**
 * Loads infrastructure service bindings
 */
function loadInfrastructureBindings(container: Container): void {
  const { ConsoleLogger } = require('../logging/ConsoleLogger');
  const { SimpleEventBus } = require('../events/SimpleEventBus');
  const { FileSystemService } = require('../filesystem/FileSystemService');
  const { ErrorHandler } = require('../errors/ErrorHandler');
  
  // Logger - for now using a simple console logger
  container.bind(ConsoleLogger).toSelf().inSingletonScope();
  container.bind(TYPES.IStructuredLogger).toService(ConsoleLogger);
  container.bind(TYPES.IPerformanceLogger).toService(ConsoleLogger);
  
  // Logger factory
  container.bind(TYPES.ILoggerFactory).toFactory((context: interfaces.Context) => {
    return (name: string) => {
      const logger = container.get(TYPES.IStructuredLogger);
      return logger.child({ component: name });
    };
  });
  
  // Event bus
  container.bind(SimpleEventBus).toSelf().inSingletonScope();
  container.bind(TYPES.IEventBus).toService(SimpleEventBus);
  
  // File system
  container.bind(FileSystemService).toSelf().inSingletonScope();
  container.bind(TYPES.IFileSystem).toService(FileSystemService);
  
  // Error handler
  container.bind(ErrorHandler).toSelf().inSingletonScope();
  container.bind(TYPES.IErrorHandler).toService(ErrorHandler);
}

/**
 * Default container instance
 */
let defaultContainer: Container | null = null;

/**
 * Gets the default container instance
 */
export function getDefaultContainer(): Container {
  if (!defaultContainer) {
    defaultContainer = createContainer();
  }
  return defaultContainer;
}

/**
 * Resets the default container
 */
export function resetDefaultContainer(): void {
  defaultContainer = null;
}

/**
 * Container module interface for modular binding loading
 */
export interface IContainerModule {
  /**
   * Loads bindings into the container
   */
  load(container: Container): void;
}

/**
 * Loads a container module
 */
export function loadModule(container: Container, module: IContainerModule): void {
  module.load(container);
}