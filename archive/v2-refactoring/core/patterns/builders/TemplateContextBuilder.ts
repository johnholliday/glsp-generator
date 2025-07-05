/**
 * Builder pattern for creating template contexts
 * @module core/patterns/builders
 */

import { Grammar } from 'langium';

/**
 * Builder for creating template rendering contexts with fluent API
 * 
 * @example
 * ```typescript
 * const context = new TemplateContextBuilder()
 *   .withProjectName('MyProject')
 *   .withGrammar(grammar)
 *   .withPackageInfo('com.example', '1.0.0')
 *   .addHelper('formatDate', (date) => new Date(date).toLocaleDateString())
 *   .addFeature('typescript')
 *   .build();
 * ```
 */
export class TemplateContextBuilder {
  private context: any = {};
  private helpers: Map<string, Function> = new Map();
  private partials: Map<string, string> = new Map();

  /**
   * Set the project name
   */
  withProjectName(name: string): this {
    this.context.projectName = name;
    return this;
  }

  /**
   * Set the grammar
   */
  withGrammar(grammar: Grammar): this {
    this.context.grammar = grammar;
    
    // Extract useful properties for templates
    this.context.grammarName = grammar.name;
    this.context.interfaces = grammar.interfaces || [];
    this.context.types = grammar.types || [];
    this.context.rules = grammar.rules || [];
    
    return this;
  }

  /**
   * Set package information
   */
  withPackageInfo(name: string, version: string, description?: string): this {
    this.context.package = {
      name,
      version,
      description: description || `Generated from ${this.context.grammarName || 'grammar'}`,
    };
    return this;
  }

  /**
   * Set the output directory
   */
  withOutputDir(dir: string): this {
    this.context.outputDir = dir;
    return this;
  }

  /**
   * Add configuration values
   */
  withConfig(config: any): this {
    this.context.config = { ...this.context.config, ...config };
    return this;
  }

  /**
   * Add a specific configuration value
   */
  addConfig(key: string, value: any): this {
    if (!this.context.config) {
      this.context.config = {};
    }
    this.context.config[key] = value;
    return this;
  }

  /**
   * Add extension configuration
   */
  withExtensionConfig(name: string, version: string, options?: ExtensionOptions): this {
    this.context.extension = {
      name,
      version,
      displayName: options?.displayName || name,
      description: options?.description,
      publisher: options?.publisher,
      repository: options?.repository,
      keywords: options?.keywords || [],
      categories: options?.categories || ['Other'],
      activationEvents: options?.activationEvents || ['onLanguage:*'],
      contributes: options?.contributes || {},
    };
    return this;
  }

  /**
   * Add a feature flag
   */
  addFeature(feature: string): this {
    if (!this.context.features) {
      this.context.features = [];
    }
    this.context.features.push(feature);
    return this;
  }

  /**
   * Add multiple features
   */
  withFeatures(...features: string[]): this {
    this.context.features = features;
    return this;
  }

  /**
   * Add generation metadata
   */
  withMetadata(metadata: GenerationMetadata): this {
    this.context.metadata = {
      ...this.context.metadata,
      ...metadata,
      generatedAt: metadata.generatedAt || new Date().toISOString(),
      generator: metadata.generator || 'glsp-generator',
    };
    return this;
  }

  /**
   * Add a custom property
   */
  addProperty(key: string, value: any): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Add template helper function
   */
  addHelper(name: string, fn: Function): this {
    this.helpers.set(name, fn);
    return this;
  }

  /**
   * Add template partial
   */
  addPartial(name: string, template: string): this {
    this.partials.set(name, template);
    return this;
  }

  /**
   * Configure for browser templates
   */
  forBrowser(): this {
    return this
      .addFeature('browser')
      .addConfig('target', 'browser')
      .addConfig('moduleSystem', 'esm')
      .addProperty('isBrowser', true)
      .addProperty('isServer', false);
  }

  /**
   * Configure for server templates
   */
  forServer(): this {
    return this
      .addFeature('server')
      .addConfig('target', 'node')
      .addConfig('moduleSystem', 'commonjs')
      .addProperty('isBrowser', false)
      .addProperty('isServer', true);
  }

  /**
   * Configure for common templates
   */
  forCommon(): this {
    return this
      .addFeature('common')
      .addConfig('target', 'universal')
      .addProperty('isCommon', true);
  }

  /**
   * Add type safety configuration
   */
  withTypeSafety(options: TypeSafetyOptions = {}): this {
    this.context.typeSafety = {
      enabled: true,
      strict: options.strict ?? true,
      generateGuards: options.generateGuards ?? true,
      generateValidators: options.generateValidators ?? true,
      generateSchemas: options.generateSchemas ?? false,
      schemaFormat: options.schemaFormat ?? 'typescript',
    };
    return this;
  }

  /**
   * Add test configuration
   */
  withTesting(framework: 'jest' | 'vitest' | 'mocha' = 'vitest'): this {
    this.context.testing = {
      enabled: true,
      framework,
      coverage: true,
      e2e: false,
    };
    return this;
  }

  /**
   * Build the final context
   */
  build(): TemplateContext {
    // Ensure required fields
    if (!this.context.projectName) {
      this.context.projectName = this.context.grammarName || 'unknown';
    }

    // Add default helpers
    this.addDefaultHelpers();

    // Add timestamp
    if (!this.context.timestamp) {
      this.context.timestamp = new Date().toISOString();
    }

    return {
      ...this.context,
      helpers: Object.fromEntries(this.helpers),
      partials: Object.fromEntries(this.partials),
    };
  }

  /**
   * Add default template helpers
   */
  private addDefaultHelpers(): void {
    // String helpers
    if (!this.helpers.has('toLowerCase')) {
      this.helpers.set('toLowerCase', (str: string) => str?.toLowerCase() || '');
    }
    
    if (!this.helpers.has('toUpperCase')) {
      this.helpers.set('toUpperCase', (str: string) => str?.toUpperCase() || '');
    }
    
    if (!this.helpers.has('toPascalCase')) {
      this.helpers.set('toPascalCase', (str: string) => {
        if (!str) return '';
        return str
          .split(/[-_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
      });
    }
    
    if (!this.helpers.has('toCamelCase')) {
      this.helpers.set('toCamelCase', (str: string) => {
        if (!str) return '';
        const pascal = this.helpers.get('toPascalCase')!(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
      });
    }

    // Array helpers
    if (!this.helpers.has('join')) {
      this.helpers.set('join', (arr: any[], sep: string = ', ') => arr?.join(sep) || '');
    }
    
    if (!this.helpers.has('hasElements')) {
      this.helpers.set('hasElements', (arr: any[]) => arr && arr.length > 0);
    }

    // Type helpers
    if (!this.helpers.has('defaultValue')) {
      this.helpers.set('defaultValue', (type: string) => {
        switch (type) {
          case 'string': return "''";
          case 'number': return '0';
          case 'boolean': return 'false';
          case 'array': return '[]';
          default: return 'undefined';
        }
      });
    }
  }

  /**
   * Create from existing context
   */
  static from(context: any): TemplateContextBuilder {
    const builder = new TemplateContextBuilder();
    
    // Copy all properties
    Object.entries(context).forEach(([key, value]) => {
      if (key !== 'helpers' && key !== 'partials') {
        builder.context[key] = value;
      }
    });

    // Copy helpers
    if (context.helpers) {
      Object.entries(context.helpers).forEach(([name, fn]) => {
        builder.helpers.set(name, fn as Function);
      });
    }

    // Copy partials
    if (context.partials) {
      Object.entries(context.partials).forEach(([name, template]) => {
        builder.partials.set(name, template as string);
      });
    }

    return builder;
  }
}

/**
 * Template context interface
 */
export interface TemplateContext {
  projectName: string;
  grammar?: Grammar;
  grammarName?: string;
  interfaces?: any[];
  types?: any[];
  rules?: any[];
  package?: PackageInfo;
  extension?: ExtensionConfig;
  config?: any;
  features?: string[];
  metadata?: GenerationMetadata;
  outputDir?: string;
  timestamp: string;
  helpers: Record<string, Function>;
  partials: Record<string, string>;
  [key: string]: any;
}

/**
 * Package information
 */
interface PackageInfo {
  name: string;
  version: string;
  description?: string;
}

/**
 * Extension configuration options
 */
interface ExtensionOptions {
  displayName?: string;
  description?: string;
  publisher?: string;
  repository?: string;
  keywords?: string[];
  categories?: string[];
  activationEvents?: string[];
  contributes?: any;
}

/**
 * Extension configuration
 */
interface ExtensionConfig extends ExtensionOptions {
  name: string;
  version: string;
}

/**
 * Generation metadata
 */
interface GenerationMetadata {
  generatedAt?: string;
  generator?: string;
  version?: string;
  checksum?: string;
  [key: string]: any;
}

/**
 * Type safety options
 */
interface TypeSafetyOptions {
  strict?: boolean;
  generateGuards?: boolean;
  generateValidators?: boolean;
  generateSchemas?: boolean;
  schemaFormat?: 'typescript' | 'json-schema' | 'zod';
}

/**
 * Factory function for creating template context builders
 */
export function templateContext(): TemplateContextBuilder {
  return new TemplateContextBuilder();
}