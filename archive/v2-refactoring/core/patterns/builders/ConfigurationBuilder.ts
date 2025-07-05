/**
 * Builder pattern for creating configuration objects
 * @module core/patterns/builders
 */

import { GenerationConfig, GenerationOptions } from '../../interfaces/IGenerator';
import { ValidationOptions } from '../../../validation/interfaces/IValidator';

/**
 * Builder for creating GenerationConfig objects with fluent API
 * 
 * @example
 * ```typescript
 * const config = new ConfigurationBuilder()
 *   .withGrammarPath('./grammar.langium')
 *   .withOutputDir('./output')
 *   .enableValidation()
 *   .enablePlugins('typescript', 'documentation')
 *   .withTemplates('browser', 'server')
 *   .build();
 * ```
 */
export class ConfigurationBuilder {
  private config: Partial<GenerationConfig> = {};
  private options: Partial<GenerationOptions> = {};
  private validationOptions: Partial<ValidationOptions> = {};

  /**
   * Set the grammar file path
   */
  withGrammarPath(path: string): this {
    this.config.grammarPath = path;
    return this;
  }

  /**
   * Set the output directory
   */
  withOutputDir(path: string): this {
    this.config.outputDir = path;
    return this;
  }

  /**
   * Enable or disable validation
   */
  withValidation(enabled: boolean = true): this {
    this.options.validate = enabled;
    return this;
  }

  /**
   * Enable validation (shorthand)
   */
  enableValidation(): this {
    return this.withValidation(true);
  }

  /**
   * Disable validation (shorthand)
   */
  disableValidation(): this {
    return this.withValidation(false);
  }

  /**
   * Set validation options
   */
  withValidationOptions(options: Partial<ValidationOptions>): this {
    this.validationOptions = { ...this.validationOptions, ...options };
    return this;
  }

  /**
   * Enable strict validation mode
   */
  withStrictValidation(): this {
    this.validationOptions.strict = true;
    return this;
  }

  /**
   * Set templates to generate
   */
  withTemplates(...templates: string[]): this {
    this.options.templates = templates;
    return this;
  }

  /**
   * Add a single template
   */
  addTemplate(template: string): this {
    if (!this.options.templates) {
      this.options.templates = [];
    }
    this.options.templates.push(template);
    return this;
  }

  /**
   * Enable force mode
   */
  withForce(force: boolean = true): this {
    this.options.force = force;
    return this;
  }

  /**
   * Enable dry run mode
   */
  withDryRun(dryRun: boolean = true): this {
    this.options.dryRun = dryRun;
    return this;
  }

  /**
   * Set plugins
   */
  withPlugins(...plugins: string[]): this {
    this.options.plugins = plugins;
    return this;
  }

  /**
   * Enable specific plugins
   */
  enablePlugins(...plugins: string[]): this {
    return this.withPlugins(...plugins);
  }

  /**
   * Add a single plugin
   */
  addPlugin(plugin: string): this {
    if (!this.options.plugins) {
      this.options.plugins = [];
    }
    this.options.plugins.push(plugin);
    return this;
  }

  /**
   * Set custom template directory
   */
  withTemplateDir(dir: string): this {
    this.options.templateDir = dir;
    return this;
  }

  /**
   * Set custom plugin directory
   */
  withPluginDir(dir: string): this {
    this.options.pluginDir = dir;
    return this;
  }

  /**
   * Enable verbose logging
   */
  withVerbose(verbose: boolean = true): this {
    this.options.verbose = verbose;
    return this;
  }

  /**
   * Enable metrics collection
   */
  withMetrics(enabled: boolean = true): this {
    this.options.enableMetrics = enabled;
    return this;
  }

  /**
   * Set operation timeout
   */
  withTimeout(ms: number): this {
    this.options.timeout = ms;
    return this;
  }

  /**
   * Add custom metadata
   */
  withMetadata(key: string, value: any): this {
    if (!this.options.metadata) {
      this.options.metadata = {};
    }
    this.options.metadata[key] = value;
    return this;
  }

  /**
   * Configure for production use
   */
  forProduction(): this {
    return this
      .withValidation(true)
      .withStrictValidation()
      .withForce(false)
      .withDryRun(false)
      .withVerbose(false)
      .withMetrics(true);
  }

  /**
   * Configure for development use
   */
  forDevelopment(): this {
    return this
      .withValidation(true)
      .withForce(true)
      .withVerbose(true)
      .withMetrics(false);
  }

  /**
   * Configure for testing
   */
  forTesting(): this {
    return this
      .withValidation(false)
      .withDryRun(true)
      .withVerbose(false)
      .withMetrics(false)
      .withTimeout(5000);
  }

  /**
   * Build the final configuration
   */
  build(): GenerationConfig {
    // Validate required fields
    if (!this.config.grammarPath) {
      throw new Error('Grammar path is required');
    }
    if (!this.config.outputDir) {
      throw new Error('Output directory is required');
    }

    // Apply defaults
    const finalOptions: GenerationOptions = {
      validate: true,
      templates: ['browser', 'server', 'common'],
      force: false,
      dryRun: false,
      plugins: [],
      verbose: false,
      enableMetrics: false,
      ...this.options,
    };

    // Apply validation options if validation is enabled
    if (finalOptions.validate && Object.keys(this.validationOptions).length > 0) {
      finalOptions.validationOptions = this.validationOptions;
    }

    return {
      grammarPath: this.config.grammarPath,
      outputDir: this.config.outputDir,
      options: finalOptions,
    };
  }

  /**
   * Create from existing config (for modification)
   */
  static from(config: GenerationConfig): ConfigurationBuilder {
    const builder = new ConfigurationBuilder()
      .withGrammarPath(config.grammarPath)
      .withOutputDir(config.outputDir);

    if (config.options) {
      const opts = config.options;
      
      if (opts.validate !== undefined) builder.withValidation(opts.validate);
      if (opts.templates) builder.withTemplates(...opts.templates);
      if (opts.force !== undefined) builder.withForce(opts.force);
      if (opts.dryRun !== undefined) builder.withDryRun(opts.dryRun);
      if (opts.plugins) builder.withPlugins(...opts.plugins);
      if (opts.templateDir) builder.withTemplateDir(opts.templateDir);
      if (opts.pluginDir) builder.withPluginDir(opts.pluginDir);
      if (opts.verbose !== undefined) builder.withVerbose(opts.verbose);
      if (opts.enableMetrics !== undefined) builder.withMetrics(opts.enableMetrics);
      if (opts.timeout !== undefined) builder.withTimeout(opts.timeout);
      if (opts.validationOptions) builder.withValidationOptions(opts.validationOptions);
      
      if (opts.metadata) {
        Object.entries(opts.metadata).forEach(([key, value]) => {
          builder.withMetadata(key, value);
        });
      }
    }

    return builder;
  }

  /**
   * Create a copy of this builder
   */
  clone(): ConfigurationBuilder {
    const config: GenerationConfig = {
      grammarPath: this.config.grammarPath || '',
      outputDir: this.config.outputDir || '',
      options: { ...this.options },
    };
    return ConfigurationBuilder.from(config);
  }
}

/**
 * Factory function for creating configuration builders
 */
export function configuration(): ConfigurationBuilder {
  return new ConfigurationBuilder();
}

/**
 * Preset configurations
 */
export class ConfigurationPresets {
  /**
   * Minimal configuration for quick generation
   */
  static minimal(grammarPath: string, outputDir: string): GenerationConfig {
    return configuration()
      .withGrammarPath(grammarPath)
      .withOutputDir(outputDir)
      .disableValidation()
      .withTemplates('common')
      .build();
  }

  /**
   * Full configuration with all features
   */
  static full(grammarPath: string, outputDir: string): GenerationConfig {
    return configuration()
      .withGrammarPath(grammarPath)
      .withOutputDir(outputDir)
      .enableValidation()
      .withStrictValidation()
      .withTemplates('browser', 'server', 'common')
      .enablePlugins('documentation', 'type-safety', 'testing')
      .withMetrics(true)
      .build();
  }

  /**
   * Configuration for CI/CD environments
   */
  static ci(grammarPath: string, outputDir: string): GenerationConfig {
    return configuration()
      .withGrammarPath(grammarPath)
      .withOutputDir(outputDir)
      .forProduction()
      .withTimeout(300000) // 5 minutes
      .withMetadata('environment', 'ci')
      .withMetadata('timestamp', new Date().toISOString())
      .build();
  }
}