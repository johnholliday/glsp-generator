/**
 * Configuration management service
 * @module core/services
 */

import { injectable, inject } from 'inversify';
import { cosmiconfigSync, CosmiconfigResult } from 'cosmiconfig';
import { z } from 'zod';
import { TYPES, CONFIG_TOKEN } from '../../infrastructure/di/symbols';
import { IConfigurableGenerator } from '../interfaces';
import { GenerationConfig, GenerationOptions } from '../models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';
import { ConfigurationError } from '../../infrastructure/errors/ErrorHierarchy';

/**
 * Configuration schema using Zod
 */
const GenerationOptionsSchema = z.object({
  validate: z.boolean().optional(),
  validateOnly: z.boolean().optional(),
  verbose: z.boolean().optional(),
  target: z.enum(['theia', 'vscode', 'both']).optional(),
  templates: z.array(z.string()).optional(),
  templateDir: z.string().optional(),
  dryRun: z.boolean().optional(),
  strict: z.boolean().optional()
});

const GenerationConfigSchema = z.object({
  grammarPath: z.string(),
  outputDir: z.string(),
  options: GenerationOptionsSchema.optional(),
  plugins: z.array(z.string()).optional()
});

/**
 * Configuration file schema
 */
const ConfigFileSchema = z.object({
  extends: z.string().optional(),
  generator: z.object({
    defaultOutput: z.string().optional(),
    defaultTemplates: z.array(z.string()).optional(),
    templateDir: z.string().optional(),
    plugins: z.array(z.string()).optional()
  }).optional(),
  validation: z.object({
    strict: z.boolean().optional(),
    rules: z.record(z.any()).optional()
  }).optional(),
  templates: z.object({
    helpers: z.record(z.string()).optional(),
    partials: z.record(z.string()).optional()
  }).optional()
});

type ConfigFile = z.infer<typeof ConfigFileSchema>;

/**
 * Configuration manager service
 * Implements Single Responsibility: Manages all configuration concerns
 */
@injectable()
export class ConfigurationManager implements IConfigurableGenerator {
  private static readonly MODULE_NAME = 'glspgen';
  private static readonly SEARCH_PLACES = [
    'package.json',
    `.${ConfigurationManager.MODULE_NAME}rc`,
    `.${ConfigurationManager.MODULE_NAME}rc.json`,
    `.${ConfigurationManager.MODULE_NAME}rc.yaml`,
    `.${ConfigurationManager.MODULE_NAME}rc.yml`,
    `.${ConfigurationManager.MODULE_NAME}rc.js`,
    `.${ConfigurationManager.MODULE_NAME}rc.cjs`,
    `${ConfigurationManager.MODULE_NAME}.config.js`,
    `${ConfigurationManager.MODULE_NAME}.config.cjs`
  ];

  private config: GenerationConfig;
  private configFile?: ConfigFile;
  private readonly explorer;

  constructor(
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(CONFIG_TOKEN.TEMPLATE_DIR) private readonly defaultTemplateDir: string,
    @inject(CONFIG_TOKEN.OUTPUT_DIR) private readonly defaultOutputDir: string
  ) {
    this.explorer = cosmiconfigSync(ConfigurationManager.MODULE_NAME, {
      searchPlaces: ConfigurationManager.SEARCH_PLACES,
      packageProp: ConfigurationManager.MODULE_NAME
    });

    this.config = this.createDefaultConfig();
    this.loadConfigFile();
  }

  /**
   * Sets generator configuration
   */
  configure(config: Partial<GenerationConfig>): void {
    try {
      // Validate partial config
      const validated = GenerationConfigSchema.partial().parse(config);
      
      // Merge with existing config
      this.config = {
        ...this.config,
        ...validated,
        options: {
          ...this.config.options,
          ...validated.options
        }
      };

      this.logger.info('Configuration updated', { config: this.config });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          `Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`,
          { errors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): GenerationConfig {
    return { ...this.config };
  }

  /**
   * Loads configuration from a specific file
   */
  loadFromFile(filepath: string): void {
    try {
      const result = this.explorer.load(filepath);
      if (result && !result.isEmpty) {
        this.processConfigResult(result);
      }
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load configuration from ${filepath}: ${(error as Error).message}`,
        { filepath }
      );
    }
  }

  /**
   * Gets configuration value by path
   */
  get<T>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.configFile || this.config;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * Validates a configuration object
   */
  validate(config: unknown): GenerationConfig {
    try {
      return GenerationConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          `Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`,
          { errors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private createDefaultConfig(): GenerationConfig {
    return {
      grammarPath: '',
      outputDir: this.defaultOutputDir || './output',
      options: {
        validate: true,
        validateOnly: false,
        verbose: false,
        target: 'theia',
        templates: ['browser', 'server', 'common'],
        templateDir: this.defaultTemplateDir,
        dryRun: false,
        strict: false
      },
      plugins: []
    };
  }

  private loadConfigFile(): void {
    try {
      const result = this.explorer.search();
      if (result && !result.isEmpty) {
        this.processConfigResult(result);
      }
    } catch (error) {
      this.logger.warn('Failed to load configuration file', { error });
    }
  }

  private processConfigResult(result: CosmiconfigResult): void {
    if (!result || result.isEmpty) return;

    try {
      // Validate config file
      this.configFile = ConfigFileSchema.parse(result.config);
      
      // Handle extends
      if (this.configFile.extends) {
        this.loadExtends(this.configFile.extends);
      }

      // Apply file config to generation config
      this.applyFileConfig();

      this.logger.info('Configuration loaded from file', {
        filepath: result.filepath,
        config: this.configFile
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Invalid configuration file', error, {
          filepath: result.filepath,
          errors: error.errors
        });
      }
    }
  }

  private loadExtends(extendsPath: string): void {
    try {
      const result = this.explorer.load(extendsPath);
      if (result && !result.isEmpty) {
        const parentConfig = ConfigFileSchema.parse(result.config);
        // Merge parent config with current (current takes precedence)
        this.configFile = this.mergeConfigs(parentConfig, this.configFile!);
      }
    } catch (error) {
      this.logger.warn(`Failed to load extended configuration: ${extendsPath}`, { error });
    }
  }

  private mergeConfigs(parent: ConfigFile, child: ConfigFile): ConfigFile {
    return {
      ...parent,
      ...child,
      generator: {
        ...parent.generator,
        ...child.generator
      },
      validation: {
        ...parent.validation,
        ...child.validation,
        rules: {
          ...parent.validation?.rules,
          ...child.validation?.rules
        }
      },
      templates: {
        ...parent.templates,
        ...child.templates,
        helpers: {
          ...parent.templates?.helpers,
          ...child.templates?.helpers
        },
        partials: {
          ...parent.templates?.partials,
          ...child.templates?.partials
        }
      }
    };
  }

  private applyFileConfig(): void {
    if (!this.configFile) return;

    const { generator, validation } = this.configFile;

    if (generator) {
      if (generator.defaultOutput) {
        this.config.outputDir = generator.defaultOutput;
      }
      if (generator.defaultTemplates) {
        this.config.options!.templates = generator.defaultTemplates;
      }
      if (generator.templateDir) {
        this.config.options!.templateDir = generator.templateDir;
      }
      if (generator.plugins) {
        this.config.plugins = generator.plugins;
      }
    }

    if (validation?.strict !== undefined) {
      this.config.options!.strict = validation.strict;
    }
  }
}