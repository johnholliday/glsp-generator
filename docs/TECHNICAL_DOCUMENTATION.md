# Technical Documentation: GLSP Generator v2

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Module Structure](#module-structure)
4. [Service Architecture](#service-architecture)
5. [Dependency Injection](#dependency-injection)
6. [Template System](#template-system)
7. [Plugin Architecture](#plugin-architecture)
8. [Event System](#event-system)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)
11. [Security](#security)
12. [Development Guide](#development-guide)

## Architecture Overview

The GLSP Generator v2 follows a modular, service-oriented architecture based on SOLID principles:

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Generate │  │ Validate │  │ Migrate  │  │ Upgrade  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Services Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Generation  │  │   Parser    │  │     Template        │   │
│  │ Orchestrator│  │   Service   │  │     Engine          │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Validator   │  │   Plugin    │  │   Configuration     │   │
│  │  Service    │  │   Manager   │  │     Manager         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ File System │  │   Logger    │  │   Event Bus         │   │
│  │  Service    │  │   Service   │  │                     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Cache     │  │   Error     │  │   Metrics           │   │
│  │  Service    │  │  Handler    │  │   Collector         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Langium AST First

The generator works exclusively with Langium's native AST structure:

```typescript
import { Grammar, Interface, Rule } from 'langium';

// No custom AST conversion
const grammar: Grammar = await parser.parse(grammarPath);

// Direct access to Langium types
grammar.interfaces.forEach((iface: Interface) => {
  console.log(`Interface: ${iface.name}`);
});
```

### 2. Service-Oriented Architecture

Each service has a single responsibility:

- **Parser Service**: Parses Langium grammar files
- **Validator Service**: Validates grammar correctness
- **Template Engine**: Renders templates to generate code
- **Plugin Manager**: Manages extension plugins
- **Configuration Manager**: Handles configuration loading

### 3. Dependency Injection

All services are wired using InversifyJS:

```typescript
const container = new Container();

// Bind interfaces to implementations
container.bind<IParser>(TYPES.IParser)
  .to(LangiumGrammarParser)
  .inSingletonScope();

container.bind<IValidator>(TYPES.IValidator)
  .to(LangiumValidator)
  .inSingletonScope();
```

## Module Structure

```
src/
├── core/                    # Core business logic
│   ├── interfaces/         # Core interfaces (ISP)
│   ├── services/          # Core service implementations
│   ├── models/            # Domain models
│   └── patterns/          # Design patterns (factories, builders)
├── parser/                 # Grammar parsing
│   ├── services/          # Parser implementations
│   └── cache/             # Parser caching
├── validation/             # Grammar validation
│   ├── services/          # Validator implementations
│   ├── rules/             # Validation rules
│   └── interfaces/        # Validation contracts
├── templates/              # Template rendering
│   ├── strategies/        # Template strategies (browser, server, common)
│   ├── services/          # Template engine
│   └── helpers/           # Handlebars helpers
├── infrastructure/         # Cross-cutting concerns
│   ├── di/               # Dependency injection
│   ├── logging/          # Structured logging
│   ├── errors/           # Error hierarchy
│   ├── events/           # Event bus
│   └── filesystem/       # File operations
└── cli/                    # Command-line interface
    ├── commands/          # CLI commands
    └── utils/             # CLI utilities
```

## Service Architecture

### GenerationOrchestrator

The main coordinator following the Facade pattern:

```typescript
@injectable()
export class GenerationOrchestrator implements IGenerator {
  constructor(
    @inject(TYPES.IParser) private parser: IParser,
    @inject(TYPES.IValidator) private validator: IValidator,
    @inject(TYPES.ITemplateEngine) private templateEngine: ITemplateEngine,
    @inject(TYPES.ILogger) private logger: IStructuredLogger
  ) {}

  async generate(config: GenerationConfig): Promise<GenerationResult> {
    // 1. Parse grammar
    const grammar = await this.parser.parse(config.grammarPath);
    
    // 2. Validate grammar
    const validation = await this.validator.validate(grammar);
    
    // 3. Render templates
    const files = await this.templateEngine.render(grammar, context);
    
    // 4. Return result
    return { success: true, files, errors: [], warnings: [] };
  }
}
```

### Parser Service

Uses Langium's DocumentBuilder directly:

```typescript
@injectable()
export class LangiumGrammarParser implements IParser {
  private services: LangiumServices;
  
  constructor(
    @inject(TYPES.IFileSystem) private fs: IFileSystem,
    @inject(TYPES.IParserCache) private cache: IParserCache
  ) {
    this.services = createLangiumGrammarServices().grammar;
  }

  async parse(grammarPath: string): Promise<Grammar> {
    // Check cache
    const cached = this.cache.get(grammarPath);
    if (cached) return cached;
    
    // Parse with Langium
    const content = await this.fs.readFile(grammarPath);
    const document = await this.parseContent(content);
    
    // Cache result
    this.cache.set(grammarPath, document.parseResult.value);
    
    return document.parseResult.value;
  }
}
```

### Template Engine

Implements Strategy pattern for different template types:

```typescript
@injectable()
export class TemplateEngineOrchestrator implements ITemplateEngine {
  constructor(
    @multiInject(TYPES.ITemplateStrategy) private strategies: ITemplateStrategy[],
    @inject(TYPES.IHandlebarsEngine) private handlebars: IHandlebarsEngine
  ) {}

  async render(
    grammar: Grammar,
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    for (const template of context.templates) {
      const strategy = this.findStrategy(template);
      const strategyFiles = await strategy.render(grammar, template, context);
      files.push(...strategyFiles);
    }
    
    return files;
  }
}
```

## Dependency Injection

### Container Configuration

```typescript
export function createContainer(): Container {
  const container = new Container();
  
  // Core services
  container.bind<IGenerator>(TYPES.IGenerator)
    .to(GenerationOrchestrator)
    .inSingletonScope();
    
  // Parser services
  container.bind<IParser>(TYPES.IParser)
    .to(LangiumGrammarParser)
    .inSingletonScope();
    
  // Template strategies
  container.bind<ITemplateStrategy>(TYPES.ITemplateStrategy)
    .to(BrowserStrategy)
    .inSingletonScope()
    .whenTargetNamed('browser');
    
  container.bind<ITemplateStrategy>(TYPES.ITemplateStrategy)
    .to(ServerStrategy)
    .inSingletonScope()
    .whenTargetNamed('server');
    
  // Infrastructure
  container.bind<IFileSystem>(TYPES.IFileSystem)
    .to(NodeFileSystem)
    .inSingletonScope();
    
  return container;
}
```

### Service Resolution

```typescript
// Get services from container
const generator = container.get<IGenerator>(TYPES.IGenerator);
const parser = container.get<IParser>(TYPES.IParser);

// Get multiple implementations
const strategies = container.getAll<ITemplateStrategy>(TYPES.ITemplateStrategy);
```

## Template System

### Template Strategy Pattern

Each output type has its own strategy:

```typescript
export class BrowserStrategy implements ITemplateStrategy {
  name = 'browser';
  
  async render(
    grammar: Grammar,
    templateName: string,
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    const templates = await this.loadTemplates();
    const data = this.prepareTemplateData(grammar, context);
    
    return templates.map(template => ({
      path: this.getOutputPath(template, context),
      content: this.handlebars.render(template.content, data)
    }));
  }
}
```

### Template Helpers

Custom Handlebars helpers for code generation:

```typescript
export class HelperRegistry {
  registerHelpers(handlebars: IHandlebarsEngine) {
    // String helpers
    handlebars.registerHelper('toPascalCase', toPascalCase);
    handlebars.registerHelper('toCamelCase', toCamelCase);
    handlebars.registerHelper('toKebabCase', toKebabCase);
    
    // Logic helpers
    handlebars.registerHelper('eq', (a, b) => a === b);
    handlebars.registerHelper('includes', (arr, val) => arr?.includes(val));
    
    // Grammar helpers
    handlebars.registerHelper('isInterface', (node) => node.$type === 'Interface');
    handlebars.registerHelper('hasProperties', (iface) => iface.properties?.length > 0);
  }
}
```

### Template Context

Data available in templates:

```typescript
interface TemplateContext {
  grammar: Grammar;              // Full Langium Grammar
  projectName: string;          // Extension name
  namespace: string;            // Code namespace
  version: string;              // Extension version
  
  // Computed properties
  interfaces: Interface[];      // Grammar interfaces
  rules: Rule[];               // Grammar rules
  types: Type[];               // Grammar types
  hasInterfaces: boolean;      // Convenience flags
  hasTypes: boolean;
  entryRule?: Rule;            // Entry point rule
  
  // Custom data
  [key: string]: any;          // User-provided data
}
```

## Plugin Architecture

### Plugin Interface

```typescript
export interface IGeneratorPlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly dependencies?: string[];
  
  initialize(generator: IEventDrivenGenerator): Promise<void>;
  execute?(context: PluginContext): Promise<void>;
  dispose(): Promise<void>;
}
```

### Plugin Lifecycle

1. **Registration**: Plugin is registered with the generator
2. **Initialization**: Plugin sets up event handlers
3. **Execution**: Plugin responds to generation events
4. **Disposal**: Plugin cleans up resources

### Plugin Example

```typescript
export class DocumentationPlugin implements IGeneratorPlugin {
  name = 'documentation';
  version = '1.0.0';
  
  async initialize(generator: IEventDrivenGenerator) {
    // Generate documentation after templates
    generator.on('templates.rendered', async (files) => {
      const docs = await this.generateDocs(files);
      files.push(...docs);
    });
    
    // Add documentation to package.json
    generator.on('package.configured', (pkg) => {
      pkg.scripts.docs = 'typedoc';
    });
  }
  
  private async generateDocs(files: GeneratedFile[]): Promise<GeneratedFile[]> {
    // Generate README, API docs, etc.
  }
  
  async dispose() {
    // Cleanup
  }
}
```

## Event System

### Event Types

```typescript
type GeneratorEvents = {
  'generation.started': [GenerationConfig];
  'generation.completed': [GenerationResult];
  'generation.failed': [Error];
  'grammar.parsed': [Grammar];
  'validation.started': [Grammar];
  'validation.completed': [ValidationResult];
  'templates.rendering': [TemplateContext];
  'templates.rendered': [GeneratedFile[]];
  'file.writing': [GeneratedFile];
  'file.written': [GeneratedFile];
  'plugin.loaded': [IGeneratorPlugin];
  'plugin.error': [Error, IGeneratorPlugin];
};
```

### Event Bus Implementation

```typescript
@injectable()
export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  
  on(event: string, handler: EventHandler): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }
  
  async emit(event: string, ...args: any[]): Promise<void> {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;
    
    const promises = Array.from(eventHandlers).map(handler =>
      Promise.resolve(handler(...args)).catch(error => {
        console.error(`Error in handler for ${event}:`, error);
      })
    );
    
    await Promise.all(promises);
  }
}
```

## Error Handling

### Error Hierarchy

```typescript
export class GenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public phase: GenerationPhase,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class ParseError extends GenerationError {
  constructor(
    message: string,
    public location?: Location,
    cause?: Error
  ) {
    super(message, 'PARSE_ERROR', 'parse', cause);
  }
}

export class ValidationError extends GenerationError {
  constructor(
    message: string,
    public violations: ValidationViolation[],
    cause?: Error
  ) {
    super(message, 'VALIDATION_ERROR', 'validate', cause);
  }
}

export class TemplateError extends GenerationError {
  constructor(
    message: string,
    public template: string,
    cause?: Error
  ) {
    super(message, 'TEMPLATE_ERROR', 'render', cause);
  }
}
```

### Error Recovery

```typescript
class GenerationOrchestrator {
  async generate(config: GenerationConfig): Promise<GenerationResult> {
    try {
      // Normal flow
    } catch (error) {
      if (error instanceof ParseError) {
        return this.handleParseError(error);
      }
      
      if (error instanceof ValidationError && config.continueOnError) {
        return this.handleValidationError(error);
      }
      
      // Log and re-throw unknown errors
      this.logger.error('Unexpected error', error);
      throw error;
    }
  }
}
```

## Performance Considerations

### Caching Strategy

```typescript
@injectable()
export class ParserCache implements IParserCache {
  private grammarCache = new LRUCache<string, Grammar>({
    max: 100,
    ttl: 1000 * 60 * 60, // 1 hour
    updateAgeOnGet: true
  });
  
  private fileStats = new Map<string, FileStats>();
  
  get(key: string): Grammar | null {
    // Check if file has changed
    const stats = this.getFileStats(key);
    const cached = this.fileStats.get(key);
    
    if (cached && stats.mtime > cached.mtime) {
      this.invalidate(key);
      return null;
    }
    
    return this.grammarCache.get(key) || null;
  }
}
```

### Template Compilation Cache

```typescript
class HandlebarsEngine {
  private compiledTemplates = new Map<string, CompiledTemplate>();
  
  compile(template: string): CompiledTemplate {
    const hash = this.hashTemplate(template);
    
    if (!this.compiledTemplates.has(hash)) {
      const compiled = Handlebars.compile(template);
      this.compiledTemplates.set(hash, compiled);
    }
    
    return this.compiledTemplates.get(hash)!;
  }
}
```

### Parallel Processing

```typescript
class TemplateEngine {
  async render(grammar: Grammar, context: TemplateContext): Promise<GeneratedFile[]> {
    // Process template categories in parallel
    const [browserFiles, serverFiles, commonFiles] = await Promise.all([
      this.browserStrategy.render(grammar, context),
      this.serverStrategy.render(grammar, context),
      this.commonStrategy.render(grammar, context)
    ]);
    
    return [...browserFiles, ...serverFiles, ...commonFiles];
  }
}
```

## Security

### Input Validation

```typescript
class SecurityValidator {
  validateGrammarPath(path: string): void {
    // Prevent path traversal
    if (path.includes('..')) {
      throw new SecurityError('Path traversal detected');
    }
    
    // Validate file extension
    if (!path.endsWith('.langium')) {
      throw new SecurityError('Invalid file type');
    }
    
    // Check file exists and is readable
    if (!this.fs.existsSync(path)) {
      throw new SecurityError('File not found');
    }
  }
}
```

### Template Sandboxing

```typescript
class SecureTemplateEngine {
  render(template: string, data: any): string {
    // Sanitize data before rendering
    const sanitized = this.sanitizeData(data);
    
    // Use safe string rendering
    return Handlebars.compile(template, {
      noEscape: false,  // Always escape by default
      strict: true,     // No access to prototype
      preventIndent: true
    })(sanitized);
  }
}
```

## Development Guide

### Setting Up Development Environment

```bash
# Clone repository
git clone https://github.com/eclipse-glsp/glsp-generator.git
cd glsp-generator

# Install dependencies
yarn install

# Build project
yarn build

# Run tests
yarn test

# Watch mode
yarn dev
```

### Project Scripts

```json
{
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf dist coverage",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "dev": "tsc -w",
    "prepublishOnly": "yarn clean && yarn build && yarn test"
  }
}
```

### Testing Guidelines

```typescript
describe('GenerationOrchestrator', () => {
  let container: Container;
  let orchestrator: GenerationOrchestrator;
  
  beforeEach(() => {
    container = createTestContainer();
    orchestrator = container.get<IGenerator>(TYPES.IGenerator);
  });
  
  it('should generate files from grammar', async () => {
    // Arrange
    const config: GenerationConfig = {
      grammarPath: 'test/fixtures/simple.langium',
      outputDir: 'test/output'
    };
    
    // Act
    const result = await orchestrator.generate(config);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(5);
  });
});
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write TSDoc comments for public APIs
- Keep functions small and focused
- Use dependency injection

## Conclusion

The GLSP Generator v2 architecture provides a solid foundation for generating GLSP extensions from Langium grammars. The modular design, dependency injection, and plugin system ensure the codebase remains maintainable and extensible as requirements evolve.