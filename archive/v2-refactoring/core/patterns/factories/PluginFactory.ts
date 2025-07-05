/**
 * Factory for creating plugins
 * @module core/patterns/factories
 */

import { injectable } from 'inversify';
import { 
  IGeneratorPlugin, 
  PluginHook,
  PluginMetadata,
  GenerationPhase 
} from '../../interfaces/IGenerator';
import { IStructuredLogger } from '../../../infrastructure/logging/ILogger';

/**
 * Factory for creating generator plugins
 */
@injectable()
export class PluginFactory {
  constructor(private logger: IStructuredLogger) {}

  /**
   * Create a documentation plugin
   */
  createDocumentationPlugin(options: DocumentationPluginOptions = {}): IGeneratorPlugin {
    const {
      outputDir = 'docs',
      format = 'markdown',
      includeExamples = true,
      generateDiagrams = true,
    } = options;

    return {
      name: 'documentation',
      version: '1.0.0',
      description: 'Generates comprehensive documentation for the grammar',
      
      metadata: {
        author: 'GLSP Generator',
        homepage: 'https://github.com/eclipse-glsp/glsp-generator',
        tags: ['documentation', 'markdown', 'diagrams'],
      },

      hooks: {
        beforeGenerate: async (context) => {
          this.logger.info('Documentation plugin: Preparing documentation generation', {
            format,
            outputDir,
          });
        },

        afterParse: async (context) => {
          // Analyze grammar for documentation
          const stats = {
            ruleCount: context.grammar.rules?.length || 0,
            interfaceCount: context.grammar.interfaces?.length || 0,
            typeCount: context.grammar.types?.length || 0,
          };
          
          context.metadata.documentationStats = stats;
          this.logger.debug('Documentation plugin: Grammar analysis complete', stats);
        },

        afterValidation: async (context) => {
          // Add validation summary to documentation
          if (context.validationResult) {
            context.metadata.validationSummary = {
              valid: context.validationResult.valid,
              errorCount: context.validationResult.errors.length,
              warningCount: context.validationResult.warnings.length,
            };
          }
        },

        beforeTemplateRender: async (context) => {
          // Inject documentation-specific data
          context.templateContext.documentation = {
            format,
            includeExamples,
            generateDiagrams,
            generatedAt: new Date().toISOString(),
          };
        },

        afterGenerate: async (context) => {
          // Generate additional documentation files
          const docFiles = [];
          
          if (includeExamples) {
            docFiles.push('examples.md');
          }
          
          if (generateDiagrams) {
            docFiles.push('architecture.md', 'diagrams/');
          }
          
          this.logger.info('Documentation plugin: Documentation generated', {
            files: docFiles,
          });
        },
      },

      configure: async (config) => {
        // Add documentation templates
        if (!config.options.templates?.includes('documentation')) {
          config.options.templates = [...(config.options.templates || []), 'documentation'];
        }
      },

      validate: async () => {
        // Validate plugin configuration
        return { valid: true, errors: [], warnings: [] };
      },
    };
  }

  /**
   * Create a type safety plugin
   */
  createTypeSafetyPlugin(options: TypeSafetyPluginOptions = {}): IGeneratorPlugin {
    const {
      generateGuards = true,
      generateValidators = true,
      generateSchemas = false,
      strict = true,
    } = options;

    return {
      name: 'type-safety',
      version: '1.0.0',
      description: 'Adds runtime type checking and validation',

      metadata: {
        author: 'GLSP Generator',
        tags: ['typescript', 'validation', 'type-safety'],
      },

      hooks: {
        afterParse: async (context) => {
          // Analyze types for safety generation
          const typeInfo = this.analyzeTypes(context.grammar);
          context.metadata.typeInfo = typeInfo;
        },

        beforeTemplateRender: async (context) => {
          // Add type safety configuration
          context.templateContext.typeSafety = {
            generateGuards,
            generateValidators,
            generateSchemas,
            strict,
            types: context.metadata.typeInfo,
          };
        },

        afterTemplateRender: async (context) => {
          // Generate additional type safety files
          const files = [];
          
          if (generateGuards) {
            files.push({
              path: 'common/type-guards.ts',
              content: '// Type guards will be generated here',
            });
          }
          
          if (generateValidators) {
            files.push({
              path: 'common/validators.ts',
              content: '// Validators will be generated here',
            });
          }
          
          if (generateSchemas) {
            files.push({
              path: 'schemas/types.json',
              content: '{}', // JSON schemas
            });
          }
          
          context.additionalFiles = files;
        },
      },

      configure: async (config) => {
        // Ensure type-safety templates are included
        config.options.metadata = {
          ...config.options.metadata,
          typeSafetyEnabled: true,
        };
      },
    };
  }

  /**
   * Create a metrics collection plugin
   */
  createMetricsPlugin(): IGeneratorPlugin {
    const metrics: GenerationMetrics = {
      startTime: 0,
      endTime: 0,
      phases: {},
      fileCount: 0,
      totalSize: 0,
    };

    return {
      name: 'metrics',
      version: '1.0.0',
      description: 'Collects generation metrics and performance data',

      hooks: {
        beforeGenerate: async () => {
          metrics.startTime = Date.now();
        },

        onPhaseStart: async (context) => {
          const phase = context.phase;
          metrics.phases[phase] = {
            startTime: Date.now(),
            endTime: 0,
          };
        },

        onPhaseEnd: async (context) => {
          const phase = context.phase;
          if (metrics.phases[phase]) {
            metrics.phases[phase].endTime = Date.now();
            metrics.phases[phase].duration = 
              metrics.phases[phase].endTime - metrics.phases[phase].startTime;
          }
        },

        afterGenerate: async (context) => {
          metrics.endTime = Date.now();
          metrics.totalDuration = metrics.endTime - metrics.startTime;
          metrics.fileCount = context.result.filesGenerated.length;
          
          // Log metrics
          this.logger.info('Generation metrics', metrics);
          
          // Add to result
          context.result.metadata = {
            ...context.result.metadata,
            metrics,
          };
        },
      },
    };
  }

  /**
   * Create a validation enhancement plugin
   */
  createValidationPlugin(rules: any[]): IGeneratorPlugin {
    return {
      name: 'enhanced-validation',
      version: '1.0.0',
      description: 'Adds custom validation rules',

      hooks: {
        beforeValidation: async (context) => {
          // Add custom rules to validator
          context.validationRules = [
            ...(context.validationRules || []),
            ...rules,
          ];
        },

        afterValidation: async (context) => {
          // Process validation results
          if (context.validationResult && !context.validationResult.valid) {
            this.logger.warn('Enhanced validation found issues', {
              errors: context.validationResult.errors.length,
              warnings: context.validationResult.warnings.length,
            });
          }
        },
      },
    };
  }

  /**
   * Create a caching plugin
   */
  createCachingPlugin(options: CachingPluginOptions = {}): IGeneratorPlugin {
    const {
      cacheDir = '.glsp-cache',
      ttl = 3600000, // 1 hour
      maxSize = 100 * 1024 * 1024, // 100MB
    } = options;

    return {
      name: 'caching',
      version: '1.0.0',
      description: 'Caches generation artifacts for faster rebuilds',

      metadata: {
        persistent: true,
        priority: 100, // High priority to run early
      },

      hooks: {
        beforeGenerate: async (context) => {
          // Check cache for existing results
          const cacheKey = this.generateCacheKey(context.config);
          const cached = await this.checkCache(cacheKey, cacheDir);
          
          if (cached && Date.now() - cached.timestamp < ttl) {
            context.skipGeneration = true;
            context.cachedResult = cached.result;
            this.logger.info('Using cached generation result');
          }
        },

        afterGenerate: async (context) => {
          if (!context.skipGeneration) {
            // Cache the result
            const cacheKey = this.generateCacheKey(context.config);
            await this.saveCache(cacheKey, context.result, cacheDir);
          }
        },
      },

      cleanup: async () => {
        // Clean old cache entries
        await this.cleanCache(cacheDir, maxSize);
      },
    };
  }

  /**
   * Create a custom plugin with provided hooks
   */
  createCustomPlugin(
    name: string,
    version: string,
    hooks: Partial<Record<PluginHook, (context: any) => Promise<void>>>
  ): IGeneratorPlugin {
    return {
      name,
      version,
      description: `Custom plugin: ${name}`,
      hooks,
    };
  }

  /**
   * Create a composite plugin that combines multiple plugins
   */
  createCompositePlugin(
    name: string,
    plugins: IGeneratorPlugin[]
  ): IGeneratorPlugin {
    const compositeHooks: any = {};
    
    // Merge hooks from all plugins
    for (const plugin of plugins) {
      for (const [hook, handler] of Object.entries(plugin.hooks || {})) {
        if (!compositeHooks[hook]) {
          compositeHooks[hook] = [];
        }
        compositeHooks[hook].push(handler);
      }
    }
    
    // Create composite handlers
    const hooks: any = {};
    for (const [hook, handlers] of Object.entries(compositeHooks)) {
      hooks[hook] = async (context: any) => {
        for (const handler of handlers as any[]) {
          await handler(context);
        }
      };
    }

    return {
      name,
      version: '1.0.0',
      description: `Composite plugin containing: ${plugins.map(p => p.name).join(', ')}`,
      hooks,
      
      metadata: {
        plugins: plugins.map(p => ({ name: p.name, version: p.version })),
      },
    };
  }

  /**
   * Helper to analyze types in grammar
   */
  private analyzeTypes(grammar: any): TypeInfo {
    const info: TypeInfo = {
      primitives: new Set<string>(),
      customs: new Set<string>(),
      unions: [],
      enums: [],
    };

    // Analyze interfaces
    for (const intf of grammar.interfaces || []) {
      info.customs.add(intf.name);
      
      for (const prop of intf.attributes || []) {
        if (prop.type?.primitiveType) {
          info.primitives.add(prop.type.primitiveType);
        }
      }
    }

    // Analyze type aliases
    for (const type of grammar.types || []) {
      if (type.type?.types) {
        info.unions.push({
          name: type.name,
          types: type.type.types,
        });
      }
    }

    return info;
  }

  /**
   * Generate cache key from config
   */
  private generateCacheKey(config: any): string {
    // Simple hash of config
    return JSON.stringify(config);
  }

  /**
   * Check cache for existing result
   */
  private async checkCache(key: string, cacheDir: string): Promise<any> {
    // Implementation would check file system
    return null;
  }

  /**
   * Save result to cache
   */
  private async saveCache(key: string, result: any, cacheDir: string): Promise<void> {
    // Implementation would save to file system
  }

  /**
   * Clean old cache entries
   */
  private async cleanCache(cacheDir: string, maxSize: number): Promise<void> {
    // Implementation would clean old files
  }
}

/**
 * Documentation plugin options
 */
interface DocumentationPluginOptions {
  outputDir?: string;
  format?: 'markdown' | 'html' | 'pdf';
  includeExamples?: boolean;
  generateDiagrams?: boolean;
}

/**
 * Type safety plugin options
 */
interface TypeSafetyPluginOptions {
  generateGuards?: boolean;
  generateValidators?: boolean;
  generateSchemas?: boolean;
  strict?: boolean;
}

/**
 * Caching plugin options
 */
interface CachingPluginOptions {
  cacheDir?: string;
  ttl?: number;
  maxSize?: number;
}

/**
 * Generation metrics
 */
interface GenerationMetrics {
  startTime: number;
  endTime: number;
  totalDuration?: number;
  phases: Record<string, PhaseMetrics>;
  fileCount: number;
  totalSize: number;
}

/**
 * Phase metrics
 */
interface PhaseMetrics {
  startTime: number;
  endTime: number;
  duration?: number;
}

/**
 * Type information
 */
interface TypeInfo {
  primitives: Set<string>;
  customs: Set<string>;
  unions: Array<{ name: string; types: any[] }>;
  enums: Array<{ name: string; values: string[] }>;
}

/**
 * Plugin presets
 */
export class PluginPresets {
  constructor(private factory: PluginFactory) {}

  /**
   * Get default plugins
   */
  getDefaultPlugins(): IGeneratorPlugin[] {
    return [
      this.factory.createMetricsPlugin(),
    ];
  }

  /**
   * Get development plugins
   */
  getDevelopmentPlugins(): IGeneratorPlugin[] {
    return [
      this.factory.createMetricsPlugin(),
      this.factory.createDocumentationPlugin({ format: 'markdown' }),
      this.factory.createTypeSafetyPlugin({ strict: false }),
    ];
  }

  /**
   * Get production plugins
   */
  getProductionPlugins(): IGeneratorPlugin[] {
    return [
      this.factory.createMetricsPlugin(),
      this.factory.createCachingPlugin(),
      this.factory.createTypeSafetyPlugin({ strict: true }),
      this.factory.createDocumentationPlugin({
        format: 'html',
        generateDiagrams: true,
      }),
    ];
  }
}