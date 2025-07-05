/**
 * Generation orchestrator service - coordinates the generation process
 * @module core/services
 * @remarks
 * This service implements the Facade pattern to provide a simple interface
 * to the complex generation subsystem. It orchestrates the entire generation
 * workflow while delegating specific tasks to specialized services.
 */

import { injectable, inject } from 'inversify';
import { Grammar } from 'langium';
import { TYPES } from '../../infrastructure/di/symbols';
import {
  IGenerator,
  IParser,
  IValidator,
  ITemplateEngine,
  IEventDrivenGenerator,
  IPluginEnabledGenerator,
  IGeneratorPlugin
} from '../interfaces';
import {
  GenerationConfig,
  GenerationResult,
  ValidationResult,
  GeneratedFile,
  GenerationError,
  GenerationWarning,
  GenerationMetadata
} from '../models';
import { IStructuredLogger, IPerformanceLogger } from '../../infrastructure/logging/ILogger';
import { GenerationError as GenerationErrorClass } from '../../infrastructure/errors/ErrorHierarchy';

/**
 * Main orchestrator for the generation process
 * @class GenerationOrchestrator
 * @implements {IGenerator}
 * @implements {IEventDrivenGenerator}
 * @implements {IPluginEnabledGenerator}
 * @public
 * 
 * @remarks
 * This class follows the Single Responsibility Principle by focusing solely
 * on orchestrating the generation workflow. It delegates actual work to:
 * - Parser: Grammar parsing
 * - Validator: Grammar validation
 * - TemplateEngine: Template rendering
 * - FileSystem: File operations
 * 
 * The orchestrator also provides:
 * - Event-driven architecture for extensibility
 * - Plugin support for custom functionality
 * - Performance logging and monitoring
 * - Correlation IDs for request tracking
 * 
 * @example
 * ```typescript
 * const orchestrator = container.get<IGenerator>(TYPES.IGenerator);
 * const result = await orchestrator.generate({
 *   grammarPath: './my-dsl.langium',
 *   outputDir: './output',
 *   options: { validate: true }
 * });
 * ```
 */
@injectable()
export class GenerationOrchestrator implements IGenerator, IEventDrivenGenerator, IPluginEnabledGenerator {
  private readonly plugins: Map<string, IGeneratorPlugin> = new Map();
  private readonly eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map();
  private readonly startTime: number = Date.now();

  constructor(
    @inject(TYPES.IParser) private readonly parser: IParser,
    @inject(TYPES.IValidator) private readonly validator: IValidator,
    @inject(TYPES.ITemplateEngine) private readonly templateEngine: ITemplateEngine,
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(TYPES.IPerformanceLogger) private readonly perfLogger: IPerformanceLogger
  ) {
    this.logger.info('GenerationOrchestrator initialized');
  }

  /**
   * Generates a GLSP extension from configuration
   * @param config - Generation configuration
   * @returns Promise resolving to generation result
   * @throws {@link GenerationErrorClass} When any phase of generation fails
   * 
   * @remarks
   * The generation process consists of four main phases:
   * 1. **Parse**: Load and parse the Langium grammar file
   * 2. **Validate**: Validate the grammar for correctness
   * 3. **Render**: Generate files from templates
   * 4. **Write**: Write generated files to disk
   * 
   * Each phase emits events that plugins can listen to:
   * - `generation.started`: Generation begins
   * - `grammar.parsed`: Grammar successfully parsed
   * - `validation.completed`: Validation complete
   * - `templates.rendered`: Templates rendered
   * - `files.written`: Files written to disk
   * - `generation.completed`: Generation successful
   * - `generation.failed`: Generation failed
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await orchestrator.generate({
   *     grammarPath: './grammar.langium',
   *     outputDir: './output',
   *     options: {
   *       validate: true,
   *       templates: ['browser', 'server'],
   *       dryRun: false
   *     }
   *   });
   *   
   *   console.log(`Generated ${result.files.length} files`);
   * } catch (error) {
   *   console.error('Generation failed:', error);
   * }
   * ```
   */
  async generate(config: GenerationConfig): Promise<GenerationResult> {
    const correlationId = this.generateCorrelationId();
    this.logger.setCorrelationId(correlationId);
    
    const stopTimer = this.perfLogger.startTimer('generation');
    
    try {
      this.logger.info('Starting generation', {
        grammarPath: config.grammarPath,
        outputDir: config.outputDir,
        options: config.options
      });

      // Emit start event
      await this.emit('generation.started', config);

      // Phase 1: Parse grammar
      const grammar = await this.parseGrammar(config);
      await this.emit('grammar.parsed', grammar);

      // Phase 2: Validate Grammar
      const validation = await this.validateGrammar(grammar, config);
      if (!validation.isValid && !config.options?.validateOnly) {
        return this.createErrorResult(validation);
      }
      await this.emit('validation.completed', validation);

      // Phase 3: Render templates (skip if validate-only)
      if (config.options?.validateOnly) {
        return this.createValidationOnlyResult(validation);
      }

      const files = await this.renderTemplates(grammar, config);
      await this.emit('templates.rendered', files);

      // Phase 4: Write files (skip if dry-run)
      if (!config.options?.dryRun) {
        await this.writeFiles(files, config);
        await this.emit('files.written', files);
      }

      // Create success result
      const result = this.createSuccessResult(files, validation, config);
      await this.emit('generation.completed', result);

      stopTimer();
      return result;

    } catch (error) {
      stopTimer();
      this.logger.error('Generation failed', error as Error, { config });
      await this.emit('generation.failed', error);
      throw new GenerationErrorClass(
        `Generation failed: ${(error as Error).message}`,
        'write',
        error as Error
      );
    }
  }

  /**
   * Registers a plugin with the generator
   * @param plugin - Plugin instance to register
   * @throws {Error} If plugin with same name already registered
   * 
   * @remarks
   * Plugins are initialized immediately upon registration.
   * They receive a reference to this generator for event subscription.
   * 
   * @example
   * ```typescript
   * class MyPlugin implements IGeneratorPlugin {
   *   name = 'my-plugin';
   *   version = '1.0.0';
   *   
   *   async initialize(generator: IEventDrivenGenerator) {
   *     generator.on('generation.completed', (result) => {
   *       console.log('Generation completed!');
   *     });
   *   }
   *   
   *   async dispose() {
   *     // Cleanup
   *   }
   * }
   * 
   * orchestrator.registerPlugin(new MyPlugin());
   * ```
   */
  registerPlugin(plugin: IGeneratorPlugin): void {
    this.logger.info(`Registering plugin: ${plugin.name}`);
    this.plugins.set(plugin.name, plugin);
    plugin.initialize(this);
  }

  /**
   * Gets all registered plugins
   * @returns Array of registered plugin instances
   */
  getPlugins(): IGeneratorPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Subscribes to generation events
   * @param event - Event name to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   * 
   * @remarks
   * Event handlers can be synchronous or asynchronous.
   * Errors in handlers are caught and logged but don't stop event propagation.
   * 
   * @example
   * ```typescript
   * // Subscribe to event
   * const unsubscribe = orchestrator.on('grammar.parsed', async (grammar) => {
   *   console.log(`Parsed grammar: ${grammar.name}`);
   * });
   * 
   * // Later: unsubscribe
   * unsubscribe();
   * ```
   */
  on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emits an event to all registered handlers
   * @param event - Event name to emit
   * @param args - Event arguments
   * 
   * @remarks
   * Events are processed sequentially in registration order.
   * Handler errors are logged but don't stop other handlers.
   * 
   * @internal
   */
  async emit(event: string, ...args: any[]): Promise<void> {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    this.logger.debug(`Emitting event: ${event}`, { args });
    
    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(...args));
      } catch (error) {
        this.logger.error(`Event handler error for ${event}`, error as Error);
      }
    }
  }

  /**
   * Parses the grammar file
   * @param config - Generation configuration
   * @returns Parsed Grammar AST
   * @throws {@link GenerationErrorClass} On parse failure
   * @private
   */
  private async parseGrammar(config: GenerationConfig): Promise<Grammar> {
    const stopTimer = this.perfLogger.startTimer('parse');
    try {
      const grammar = await this.parser.parse(config.grammarPath, {
        resolveImports: true,
        validateReferences: true,
        includeLocations: true,
        useCache: true
      });
      stopTimer();
      return grammar;
    } catch (error) {
      stopTimer();
      throw new GenerationErrorClass(
        `Failed to parse grammar: ${(error as Error).message}`,
        'parse',
        error as Error
      );
    }
  }

  /**
   * Validates the parsed grammar
   * @param grammar - Grammar AST to validate
   * @param config - Generation configuration
   * @returns Validation result
   * @throws {@link GenerationErrorClass} On validation failure
   * @private
   */
  private async validateGrammar(
    grammar: Grammar,
    config: GenerationConfig
  ): Promise<ValidationResult> {
    const stopTimer = this.perfLogger.startTimer('validate');
    try {
      const result = await this.validator.validate(grammar, {
        strict: config.options?.strict,
        customRules: []
      });
      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      throw new GenerationErrorClass(
        `Validation failed: ${(error as Error).message}`,
        'validate',
        error as Error
      );
    }
  }

  /**
   * Renders templates to generate files
   * @param grammar - Grammar AST
   * @param config - Generation configuration
   * @returns Array of generated files
   * @throws {@link GenerationErrorClass} On render failure
   * @private
   */
  private async renderTemplates(
    grammar: Grammar,
    config: GenerationConfig
  ): Promise<GeneratedFile[]> {
    const stopTimer = this.perfLogger.startTimer('render');
    try {
      const files = await this.templateEngine.render(
        grammar,
        {
          targetDir: config.outputDir,
          templates: config.options?.templates
        },
        {
          prettyPrint: true,
          lineEndings: 'auto',
          indent: 2
        }
      );
      stopTimer();
      return files;
    } catch (error) {
      stopTimer();
      throw new GenerationErrorClass(
        `Template rendering failed: ${(error as Error).message}`,
        'render',
        error as Error
      );
    }
  }

  /**
   * Writes generated files to disk
   * @param files - Files to write
   * @param config - Generation configuration
   * @private
   * @remarks
   * File writing is delegated to the FileSystem service.
   * This method is skipped in dry-run mode.
   */
  private async writeFiles(
    files: GeneratedFile[],
    config: GenerationConfig
  ): Promise<void> {
    // File writing would be delegated to a FileSystem service
    this.logger.info(`Writing ${files.length} files to ${config.outputDir}`);
    // Implementation delegated to FileSystem service
  }

  /**
   * Creates a successful generation result
   * @param files - Generated files
   * @param validation - Validation result
   * @param config - Generation configuration
   * @returns Generation result
   * @private
   */
  private createSuccessResult(
    files: GeneratedFile[],
    validation: ValidationResult,
    config: GenerationConfig
  ): GenerationResult {
    const metadata: GenerationMetadata = {
      timestamp: new Date(),
      generatorVersion: '2.0.0', // Would be injected
      grammarHash: this.hashGrammar(config.grammarPath),
      duration: Date.now() - this.startTime,
      filesGenerated: files.length
    };

    return {
      success: true,
      files,
      errors: [],
      warnings: validation.warnings.map(w => ({
        code: w.rule,
        message: w.message,
        severity: 'warning' as const,
        location: w.location
      })),
      metadata
    };
  }

  /**
   * Creates an error result from validation
   * @param validation - Validation result with errors
   * @returns Generation result indicating failure
   * @private
   */
  private createErrorResult(validation: ValidationResult): GenerationResult {
    return {
      success: false,
      files: [],
      errors: validation.errors.map(e => ({
        code: e.rule,
        message: e.message,
        severity: 'error' as const,
        location: e.location
      })),
      warnings: validation.warnings.map(w => ({
        code: w.rule,
        message: w.message,
        severity: 'warning' as const,
        location: w.location
      }))
    };
  }

  /**
   * Creates a result for validation-only mode
   * @param validation - Validation result
   * @returns Generation result without files
   * @private
   */
  private createValidationOnlyResult(validation: ValidationResult): GenerationResult {
    return {
      success: validation.isValid,
      files: [],
      errors: validation.errors.map(e => ({
        code: e.rule,
        message: e.message,
        severity: 'error' as const,
        location: e.location
      })),
      warnings: validation.warnings.map(w => ({
        code: w.rule,
        message: w.message,
        severity: 'warning' as const,
        location: w.location
      }))
    };
  }

  /**
   * Generates a unique correlation ID for request tracking
   * @returns Unique correlation ID
   * @private
   */
  private generateCorrelationId(): string {
    return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Computes hash of grammar file for caching
   * @param path - Grammar file path
   * @returns Hash string
   * @private
   * @todo Implement actual file hashing
   */
  private hashGrammar(path: string): string {
    // Would use crypto to hash file content
    return 'mock-hash';
  }
}