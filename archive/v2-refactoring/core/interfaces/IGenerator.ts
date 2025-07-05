/**
 * Core generator interfaces following Interface Segregation Principle
 * @module core/interfaces
 * @remarks
 * This module defines the core interfaces for the GLSP Generator system.
 * All interfaces follow SOLID principles to ensure extensibility and maintainability.
 */

import { GenerationConfig, GenerationResult, ValidationResult } from '../models';

// Re-export commonly used types from models for convenience
export { GenerationConfig, GenerationOptions, GenerationResult, ValidationResult } from '../models';

/**
 * Plugin hook phases
 */
export enum GenerationPhase {
  BeforeValidation = 'before-validation',
  AfterValidation = 'after-validation',
  BeforeParsing = 'before-parsing',
  AfterParsing = 'after-parsing',
  BeforeGeneration = 'before-generation',
  AfterGeneration = 'after-generation',
  BeforeWrite = 'before-write',
  AfterWrite = 'after-write'
}

/**
 * Plugin hook definition
 */
export interface PluginHook {
  phase: GenerationPhase;
  handler: (context: any) => void | Promise<void>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
}

/**
 * Main generator interface for orchestrating the generation process
 * @interface IGenerator
 * @public
 * @remarks
 * This is the primary interface for GLSP extension generation.
 * Implementations should follow the Single Responsibility Principle
 * and focus solely on orchestrating the generation process.
 * 
 * @see {@link GenerationConfig} for configuration options
 * @see {@link GenerationResult} for result structure
 */
export interface IGenerator {
  /**
   * Generates a GLSP extension from a grammar file
   * @param config - Generation configuration including grammar path and output directory
   * @returns Promise resolving to generation result with status and generated artifacts
   * @throws {@link GenerationError} When generation fails due to invalid grammar or I/O errors
   * 
   * @example
   * Basic usage:
   * ```typescript
   * const result = await generator.generate({
   *   grammarPath: './grammar.langium',
   *   outputDir: './output',
   *   options: { validate: true }
   * });
   * ```
   * 
   * @example
   * Advanced usage with options:
   * ```typescript
   * const result = await generator.generate({
   *   grammarPath: './my-dsl.langium',
   *   outputDir: './generated-extension',
   *   options: {
   *     packageName: '@company/my-dsl-glsp',
   *     version: '1.0.0',
   *     validate: true,
   *     generateValidation: true,
   *     serverPort: 5008
   *   }
   * });
   * 
   * if (result.success) {
   *   console.log(`Generated ${result.generatedFiles.length} files`);
   * }
   * ```
   */
  generate(config: GenerationConfig): Promise<GenerationResult>;
}

/**
 * Validation-specific interface following Single Responsibility Principle
 * @interface IValidationGenerator
 * @public
 * @remarks
 * This interface is dedicated to grammar validation operations.
 * It separates validation concerns from generation, allowing for
 * validation-only workflows and better testability.
 */
export interface IValidationGenerator {
  /**
   * Validates a grammar file without performing generation
   * @param grammarPath - Path to the Langium grammar file to validate
   * @returns Promise resolving to validation result containing errors and warnings
   * 
   * @remarks
   * This method performs comprehensive validation including:
   * - Syntax validation
   * - Semantic validation
   * - Reference resolution
   * - Type checking
   * 
   * @example
   * Simple validation:
   * ```typescript
   * const validation = await validator.validateGrammar('./grammar.langium');
   * if (validation.isValid) {
   *   console.log('Grammar is valid');
   * }
   * ```
   * 
   * @example
   * Detailed error handling:
   * ```typescript
   * const validation = await validator.validateGrammar('./my-dsl.langium');
   * if (!validation.isValid) {
   *   validation.errors.forEach(error => {
   *     console.error(`Error at line ${error.line}: ${error.message}`);
   *   });
   *   validation.warnings.forEach(warning => {
   *     console.warn(`Warning: ${warning.message}`);
   *   });
   * }
   * ```
   */
  validateGrammar(grammarPath: string): Promise<ValidationResult>;
}

/**
 * Configuration management interface
 * @interface IConfigurableGenerator
 * @public
 * @remarks
 * Provides configuration management capabilities for generators.
 * Allows runtime configuration changes without recreating instances.
 */
export interface IConfigurableGenerator {
  /**
   * Sets or updates generator configuration
   * @param config - Partial configuration to merge with existing configuration
   * 
   * @remarks
   * This method performs a deep merge with the existing configuration.
   * Only provided properties will be updated.
   * 
   * @example
   * ```typescript
   * generator.configure({
   *   options: {
   *     validate: false,
   *     serverPort: 5009
   *   }
   * });
   * ```
   */
  configure(config: Partial<GenerationConfig>): void;

  /**
   * Gets the current configuration
   * @returns Current generator configuration
   * 
   * @remarks
   * Returns a copy of the configuration to prevent external modifications.
   * 
   * @example
   * ```typescript
   * const config = generator.getConfiguration();
   * console.log(`Output directory: ${config.outputDir}`);
   * ```
   */
  getConfiguration(): GenerationConfig;
}

/**
 * Event-driven generator interface for extensibility
 * @interface IEventDrivenGenerator
 * @public
 * @remarks
 * Enables event-based extensibility following the Observer pattern.
 * Allows plugins and external code to react to generation lifecycle events.
 * 
 * @eventProperty
 * Common events include:
 * - `generation:start` - Fired when generation begins
 * - `generation:complete` - Fired when generation completes successfully
 * - `generation:error` - Fired when generation fails
 * - `validation:start` - Fired when validation begins
 * - `validation:complete` - Fired when validation completes
 * - `template:process` - Fired when processing a template
 * - `file:write` - Fired when writing a generated file
 */
export interface IEventDrivenGenerator {
  /**
   * Subscribes to generation events
   * @param event - Event name to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function to remove the handler
   * 
   * @example
   * ```typescript
   * const unsubscribe = generator.on('generation:complete', (result) => {
   *   console.log(`Generated ${result.generatedFiles.length} files`);
   * });
   * 
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   * 
   * @example
   * Multiple event subscriptions:
   * ```typescript
   * generator.on('file:write', (filePath) => {
   *   console.log(`Writing: ${filePath}`);
   * });
   * 
   * generator.on('generation:error', (error) => {
   *   console.error(`Generation failed: ${error.message}`);
   * });
   * ```
   */
  on(event: string, handler: (...args: any[]) => void): () => void;

  /**
   * Emits a generation event
   * @param event - Event name to emit
   * @param args - Event arguments
   * 
   * @remarks
   * This method is typically used internally by the generator
   * and by plugins to emit custom events.
   * 
   * @example
   * ```typescript
   * generator.emit('custom:event', { data: 'value' });
   * ```
   */
  emit(event: string, ...args: any[]): void;
}

/**
 * Plugin-enabled generator interface for Open/Closed Principle
 * @interface IPluginEnabledGenerator
 * @public
 * @remarks
 * Enables plugin-based extensibility without modifying core generator code.
 * Follows the Open/Closed Principle by allowing extension through plugins.
 */
export interface IPluginEnabledGenerator {
  /**
   * Registers a plugin with the generator
   * @param plugin - Plugin instance to register
   * @throws {@link Error} If plugin is already registered or has invalid metadata
   * 
   * @example
   * ```typescript
   * const myPlugin = new CustomPlugin();
   * generator.registerPlugin(myPlugin);
   * ```
   */
  registerPlugin(plugin: IGeneratorPlugin): void;

  /**
   * Gets all registered plugins
   * @returns Array of registered plugins
   * 
   * @example
   * ```typescript
   * const plugins = generator.getPlugins();
   * plugins.forEach(plugin => {
   *   console.log(`${plugin.name} v${plugin.version}`);
   * });
   * ```
   */
  getPlugins(): IGeneratorPlugin[];
}

/**
 * Generator plugin interface
 * @interface IGeneratorPlugin
 * @public
 * @remarks
 * Defines the contract for generator plugins.
 * Plugins can extend generator functionality without modifying core code.
 * 
 * @example
 * ```typescript
 * class MyPlugin implements IGeneratorPlugin {
 *   readonly name = 'my-plugin';
 *   readonly version = '1.0.0';
 * 
 *   async initialize(generator: IEventDrivenGenerator): Promise<void> {
 *     generator.on('generation:complete', (result) => {
 *       console.log('MyPlugin: Generation completed');
 *     });
 *   }
 * 
 *   async dispose(): Promise<void> {
 *     // Cleanup resources
 *   }
 * }
 * ```
 */
export interface IGeneratorPlugin {
  /**
   * Plugin name
   * @remarks Should be unique among all plugins
   */
  readonly name: string;

  /**
   * Plugin version
   * @remarks Should follow semantic versioning (e.g., '1.0.0')
   */
  readonly version: string;

  /**
   * Plugin description
   * @remarks Optional description of what the plugin does
   */
  readonly description?: string;

  /**
   * Plugin hooks
   * @remarks Optional array of hooks the plugin registers
   */
  readonly hooks?: PluginHook[];

  /**
   * Initializes the plugin
   * @param generator - Generator instance for event subscription
   * @returns Promise that resolves when initialization is complete
   * 
   * @remarks
   * This method is called when the plugin is registered.
   * Use it to set up event handlers and initialize resources.
   */
  initialize(generator: IEventDrivenGenerator): Promise<void>;

  /**
   * Cleans up plugin resources
   * @returns Promise that resolves when cleanup is complete
   * 
   * @remarks
   * This method is called when the generator is disposed
   * or when the plugin is unregistered. Use it to clean up
   * resources, close connections, and remove event handlers.
   */
  dispose(): Promise<void>;
}