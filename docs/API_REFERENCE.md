# API Reference: GLSP Generator v2

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Services](#services)
3. [Models](#models)
4. [Configuration](#configuration)
5. [Events](#events)
6. [Plugins](#plugins)
7. [Templates](#templates)
8. [Utilities](#utilities)

## Core Interfaces

### IGenerator

Main interface for GLSP extension generation.

```typescript
interface IGenerator {
  /**
   * Generates a GLSP extension from a grammar file
   * @param config - Generation configuration
   * @returns Promise resolving to generation result
   * @throws {GenerationError} When generation fails
   */
  generate(config: GenerationConfig): Promise<GenerationResult>;
}
```

**Example:**
```typescript
const generator = container.get<IGenerator>(TYPES.IGenerator);
const result = await generator.generate({
  grammarPath: './my-dsl.langium',
  outputDir: './output',
  options: {
    validate: true,
    templates: ['browser', 'server']
  }
});
```

### IParser

Interface for parsing Langium grammar files.

```typescript
interface IParser {
  /**
   * Parses a grammar file into a Langium Grammar AST
   * @param grammarPath - Path to the Langium grammar file
   * @param options - Optional parsing configuration
   * @returns Promise resolving to the parsed Grammar
   */
  parse(grammarPath: string, options?: ParseOptions): Promise<Grammar>;
  
  /**
   * Parses grammar content from a string
   * @param content - Grammar content as string
   * @param uri - Document URI for identification
   * @param options - Optional parsing configuration
   * @returns Promise resolving to the parsed Grammar
   */
  parseContent(content: string, uri: string, options?: ParseOptions): Promise<Grammar>;
  
  /**
   * Gets the Langium document for a parsed grammar
   * @param grammarPath - Path to the grammar file
   * @returns Promise resolving to the Langium document
   */
  getDocument(grammarPath: string): Promise<LangiumDocument>;
  
  /**
   * Gets the Langium services instance
   * @returns The configured Langium services
   */
  getServices(): LangiumServices;
}
```

### IValidator

Interface for grammar validation.

```typescript
interface IValidator {
  /**
   * Validates a Grammar AST
   * @param grammar - Grammar to validate
   * @param options - Validation options
   * @returns Promise resolving to validation result
   */
  validate(grammar: Grammar, options?: ValidationOptions): Promise<ValidationResult>;
  
  /**
   * Validates a grammar file without parsing
   * @param grammarPath - Path to grammar file
   * @returns Promise resolving to validation result
   */
  validateFile(grammarPath: string): Promise<ValidationResult>;
  
  /**
   * Adds a custom validation rule
   * @param rule - Validation rule to add
   */
  addRule(rule: IValidationRule): void;
  
  /**
   * Removes a validation rule
   * @param ruleName - Name of rule to remove
   */
  removeRule(ruleName: string): void;
}
```

### ITemplateEngine

Interface for template rendering.

```typescript
interface ITemplateEngine {
  /**
   * Renders templates for a Langium Grammar
   * @param grammar - Grammar AST to render templates for
   * @param context - Template context with configuration
   * @param options - Optional rendering configuration
   * @returns Promise resolving to array of generated files
   */
  render(
    grammar: Grammar,
    context: TemplateContext,
    options?: RenderOptions
  ): Promise<GeneratedFile[]>;
}
```

## Services

### GenerationOrchestrator

Main service coordinating the generation process.

```typescript
@injectable()
class GenerationOrchestrator implements IGenerator, IEventDrivenGenerator, IPluginEnabledGenerator {
  // IGenerator implementation
  async generate(config: GenerationConfig): Promise<GenerationResult>;
  
  // IEventDrivenGenerator implementation
  on(event: string, handler: (...args: any[]) => void): () => void;
  emit(event: string, ...args: any[]): Promise<void>;
  
  // IPluginEnabledGenerator implementation
  registerPlugin(plugin: IGeneratorPlugin): void;
  getPlugins(): IGeneratorPlugin[];
}
```

### LangiumGrammarParser

Parser service using Langium's native API.

```typescript
@injectable()
class LangiumGrammarParser implements IParser, IContentParser {
  async parse(grammarPath: string, options?: ParseOptions): Promise<Grammar>;
  async parseContent(content: string, uri: string, options?: ParseOptions): Promise<Grammar>;
  async getDocument(grammarPath: string): Promise<LangiumDocument>;
  getServices(): LangiumServices;
}
```

### ConfigurationManager

Manages application configuration.

```typescript
@injectable()
class ConfigurationManager implements IConfigurationManager {
  /**
   * Loads configuration from various sources
   * @param configPath - Optional specific config file path
   * @returns Promise resolving to merged configuration
   */
  async loadConfig(configPath?: string): Promise<GeneratorConfig>;
  
  /**
   * Validates configuration object
   * @param config - Configuration to validate
   * @returns Validation result
   */
  async validateConfig(config: any): Promise<ValidationResult>;
  
  /**
   * Gets current configuration
   * @returns Current configuration or throws if not loaded
   */
  getConfig(): GeneratorConfig;
}
```

## Models

### GenerationConfig

Configuration for generation process.

```typescript
interface GenerationConfig {
  /** Path to the Langium grammar file */
  grammarPath: string;
  
  /** Output directory for generated files */
  outputDir: string;
  
  /** Optional generation options */
  options?: GenerationOptions;
}

interface GenerationOptions {
  /** Package name for generated extension */
  packageName?: string;
  
  /** Package version */
  version?: string;
  
  /** Whether to validate grammar before generation */
  validate?: boolean;
  
  /** Templates to generate */
  templates?: string[];
  
  /** Whether to skip file writing (preview mode) */
  dryRun?: boolean;
  
  /** Custom namespace for generated code */
  namespace?: string;
  
  /** Server port for GLSP server */
  serverPort?: number;
  
  /** Continue on non-fatal errors */
  continueOnError?: boolean;
  
  /** Custom template variables */
  templateVariables?: Record<string, any>;
}
```

### GenerationResult

Result of generation process.

```typescript
interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  
  /** Generated files (empty if dry-run) */
  files: GeneratedFile[];
  
  /** Errors that occurred */
  errors: GenerationError[];
  
  /** Warnings that occurred */
  warnings: GenerationWarning[];
  
  /** Generation metadata */
  metadata?: GenerationMetadata;
}

interface GeneratedFile {
  /** File path relative to output directory */
  path: string;
  
  /** File content */
  content: string;
  
  /** File encoding (default: utf-8) */
  encoding?: string;
  
  /** Whether to overwrite if exists */
  overwrite?: boolean;
}

interface GenerationMetadata {
  /** Generation timestamp */
  timestamp: Date;
  
  /** Generator version */
  generatorVersion: string;
  
  /** Grammar file hash */
  grammarHash: string;
  
  /** Generation duration in ms */
  duration: number;
  
  /** Number of files generated */
  filesGenerated: number;
}
```

### ValidationResult

Result of grammar validation.

```typescript
interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation errors */
  errors: ValidationIssue[];
  
  /** Validation warnings */
  warnings: ValidationIssue[];
  
  /** Validation info messages */
  infos?: ValidationIssue[];
}

interface ValidationIssue {
  /** Issue severity */
  severity: 'error' | 'warning' | 'info';
  
  /** Issue message */
  message: string;
  
  /** Validation rule that triggered issue */
  rule: string;
  
  /** Location in grammar file */
  location?: Location;
  
  /** Additional context */
  context?: any;
}

interface Location {
  /** Start position */
  start: Position;
  
  /** End position */
  end: Position;
  
  /** File path */
  file?: string;
}

interface Position {
  /** Line number (0-based) */
  line: number;
  
  /** Column number (0-based) */
  column: number;
}
```

## Configuration

### Configuration Sources

Configuration is loaded from multiple sources in order:

1. Default configuration
2. Global config (`~/.glsprc`)
3. Project config (`.glsprc.json`, `glsp.config.js`, etc.)
4. Environment variables
5. Command-line arguments

### Configuration Schema

```typescript
interface GeneratorConfig {
  /** Extension configuration */
  extension: {
    /** Extension name */
    name: string;
    
    /** Extension version */
    version: string;
    
    /** Publisher name */
    publisher?: string;
    
    /** Extension description */
    description?: string;
  };
  
  /** Templates to generate */
  templates: string[];
  
  /** Validation configuration */
  validation?: {
    /** Enable strict validation */
    strict?: boolean;
    
    /** Custom validation rules */
    rules?: string[];
    
    /** Ignored rules */
    ignore?: string[];
  };
  
  /** Plugin configuration */
  plugins?: Array<string | PluginConfig>;
  
  /** Output configuration */
  output?: {
    /** Output directory structure */
    structure?: 'flat' | 'nested';
    
    /** File naming convention */
    naming?: 'kebab-case' | 'camelCase' | 'PascalCase';
    
    /** Whether to prettify output */
    prettify?: boolean;
  };
  
  /** Advanced options */
  advanced?: {
    /** Enable caching */
    cache?: boolean;
    
    /** Debug mode */
    debug?: boolean;
    
    /** Performance tracking */
    telemetry?: boolean;
  };
}
```

### Environment Variables

```bash
# Debug logging
GLSP_DEBUG=true

# Disable caching
GLSP_CACHE=false

# Custom plugins directory
GLSP_PLUGINS_DIR=./my-plugins

# Override output directory
GLSP_OUTPUT_DIR=./generated

# Set log level
GLSP_LOG_LEVEL=debug|info|warn|error
```

## Events

### Event Types

```typescript
// Generation lifecycle events
'generation.started': [config: GenerationConfig]
'generation.completed': [result: GenerationResult]
'generation.failed': [error: Error]

// Parser events
'parser.started': [path: string]
'parser.completed': [grammar: Grammar]
'parser.failed': [error: ParseError]

// Validation events
'validation.started': [grammar: Grammar]
'validation.completed': [result: ValidationResult]
'validation.rule.executed': [rule: string, result: RuleResult]

// Template events
'template.rendering': [strategy: string, context: TemplateContext]
'template.rendered': [file: GeneratedFile]
'template.failed': [error: TemplateError]

// File events
'file.writing': [path: string]
'file.written': [path: string]
'file.skipped': [path: string, reason: string]

// Plugin events
'plugin.registered': [plugin: IGeneratorPlugin]
'plugin.initialized': [plugin: IGeneratorPlugin]
'plugin.executed': [plugin: IGeneratorPlugin, result: any]
'plugin.error': [plugin: IGeneratorPlugin, error: Error]
```

### Event Subscription

```typescript
// Subscribe to events
const unsubscribe = generator.on('generation.completed', (result) => {
  console.log(`Generated ${result.files.length} files`);
});

// Multiple subscriptions
generator.on('file.written', (path) => {
  console.log(`Wrote: ${path}`);
});

generator.on('validation.completed', (result) => {
  if (!result.isValid) {
    console.error('Validation failed');
  }
});

// Unsubscribe
unsubscribe();
```

## Plugins

### Plugin Interface

```typescript
interface IGeneratorPlugin {
  /** Plugin name (must be unique) */
  readonly name: string;
  
  /** Plugin version (semver) */
  readonly version: string;
  
  /** Plugin description */
  readonly description?: string;
  
  /** Plugin dependencies */
  readonly dependencies?: string[];
  
  /** Plugin configuration schema */
  readonly configSchema?: z.ZodSchema;
  
  /**
   * Initialize plugin
   * @param generator - Generator instance for event subscription
   */
  initialize(generator: IEventDrivenGenerator): Promise<void>;
  
  /**
   * Execute plugin logic (optional)
   * @param context - Plugin execution context
   */
  execute?(context: PluginContext): Promise<void>;
  
  /**
   * Clean up plugin resources
   */
  dispose(): Promise<void>;
}

interface PluginContext {
  /** Current generation configuration */
  config: GenerationConfig;
  
  /** Parsed grammar */
  grammar: Grammar;
  
  /** Plugin configuration */
  pluginConfig?: any;
  
  /** Logger instance */
  logger: ILogger;
  
  /** File system access */
  fs: IFileSystem;
}
```

### Creating a Plugin

```typescript
export class MyCustomPlugin implements IGeneratorPlugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  description = 'Adds custom functionality';
  
  async initialize(generator: IEventDrivenGenerator): Promise<void> {
    // Subscribe to events
    generator.on('templates.rendered', async (files) => {
      // Modify generated files
      const readme = this.generateReadme(files);
      files.push(readme);
    });
    
    generator.on('validation.completed', (result) => {
      // Add custom validation
      if (this.hasCustomIssues(result)) {
        result.warnings.push({
          severity: 'warning',
          message: 'Custom warning',
          rule: 'custom-rule'
        });
      }
    });
  }
  
  async execute(context: PluginContext): Promise<void> {
    // Optional execution logic
    context.logger.info('Executing custom plugin');
  }
  
  async dispose(): Promise<void> {
    // Cleanup
  }
}
```

## Templates

### Template Context

Data available in all templates:

```typescript
interface TemplateContext {
  // Grammar data
  grammar: Grammar;
  interfaces: Interface[];
  rules: Rule[];
  types: Type[];
  
  // Project metadata
  projectName: string;
  namespace: string;
  version: string;
  author?: string;
  license?: string;
  
  // Computed flags
  hasInterfaces: boolean;
  hasTypes: boolean;
  hasImports: boolean;
  entryRule?: Rule;
  
  // Configuration
  serverPort: number;
  websocketPath: string;
  
  // Custom data
  [key: string]: any;
}
```

### Template Helpers

Available Handlebars helpers:

```typescript
// String manipulation
{{toLowerCase str}}
{{toUpperCase str}}
{{toPascalCase str}}      // kebab-case → PascalCase
{{toCamelCase str}}       // kebab-case → camelCase
{{toKebabCase str}}       // PascalCase → kebab-case
{{toSnakeCase str}}       // PascalCase → snake_case
{{capitalize str}}        // hello → Hello
{{pluralize str}}         // entity → entities
{{singularize str}}       // entities → entity

// Comparison
{{#if (eq a b)}}...{{/if}}
{{#if (neq a b)}}...{{/if}}
{{#if (lt a b)}}...{{/if}}
{{#if (gt a b)}}...{{/if}}
{{#if (and a b)}}...{{/if}}
{{#if (or a b)}}...{{/if}}
{{#if (not a)}}...{{/if}}

// Arrays
{{#if (hasElements arr)}}...{{/if}}
{{#if (isEmpty arr)}}...{{/if}}
{{length arr}}
{{first arr}}
{{last arr}}
{{join arr ', '}}

// Object helpers
{{json obj}}              // Stringify object
{{keys obj}}              // Get object keys
{{values obj}}            // Get object values

// Grammar helpers
{{#each interfaces}}
  {{name}}                // Interface name
  {{#each attributes}}
    {{name}}: {{type}}
  {{/each}}
{{/each}}
```

### Custom Template Strategy

```typescript
export class CustomStrategy implements ITemplateStrategy {
  name = 'custom';
  
  canHandle(templateName: string): boolean {
    return templateName.startsWith('custom/');
  }
  
  async render(
    grammar: Grammar,
    templateName: string,
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    const template = await this.loadTemplate(templateName);
    const data = this.prepareData(grammar, context);
    
    return [{
      path: 'custom/output.ts',
      content: this.handlebars.render(template, data)
    }];
  }
}

// Register strategy
container.bind<ITemplateStrategy>(TYPES.ITemplateStrategy)
  .to(CustomStrategy)
  .inSingletonScope();
```

## Utilities

### File System

```typescript
interface IFileSystem {
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, content: string, encoding?: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<Stats>;
  rm(path: string, options?: RmOptions): Promise<void>;
  copyFile(src: string, dest: string): Promise<void>;
}
```

### Logger

```typescript
interface IStructuredLogger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  
  setCorrelationId(id: string): void;
  child(context: any): IStructuredLogger;
}
```

### Cache

```typescript
interface ICache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
}
```

### Path Utilities

```typescript
// Cross-platform path handling
import { pathUtils } from '@glsp/generator/utils';

// Join paths safely
const outputPath = pathUtils.join(baseDir, 'src', 'generated');

// Get relative path
const relative = pathUtils.relative(from, to);

// Normalize separators
const normalized = pathUtils.normalize(path);

// Ensure directory exists
await pathUtils.ensureDir(dirPath);
```

## Type Definitions

Complete TypeScript definitions are available:

```typescript
import {
  // Interfaces
  IGenerator,
  IParser,
  IValidator,
  ITemplateEngine,
  IPlugin,
  
  // Models
  GenerationConfig,
  GenerationResult,
  ValidationResult,
  GeneratedFile,
  
  // Errors
  GenerationError,
  ParseError,
  ValidationError,
  TemplateError,
  
  // Events
  GeneratorEvents,
  EventHandler,
  
  // DI
  TYPES,
  createContainer
} from '@glsp/generator';
```