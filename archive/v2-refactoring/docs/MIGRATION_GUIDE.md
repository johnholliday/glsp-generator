# Migration Guide: GLSP Generator v1 to v2

## Overview

This guide helps you migrate from GLSP Generator v1 to the new modular architecture in v2. The new version provides better maintainability, extensibility, and follows SOLID principles throughout.

## Key Changes

### 1. Architecture Changes

#### Old Architecture (v1)
- Monolithic `GLSPGenerator` class handling all operations
- Direct file manipulation
- Hardcoded template processing
- Limited extensibility

#### New Architecture (v2)
- Modular services following Single Responsibility Principle
- Dependency Injection with InversifyJS
- Plugin system for extensibility
- Event-driven architecture
- Native Langium AST usage (no custom conversions)

### 2. API Changes

#### Command Line Interface

The CLI remains backward compatible, but with new options:

```bash
# Old (still works)
glsp-generator generate grammar.langium output/

# New options available
glsp-generator generate grammar.langium output/ \
  --validate \
  --templates browser,server,common \
  --plugin my-custom-plugin \
  --dry-run
```

#### Programmatic API

**Old API (v1):**
```typescript
import { GLSPGenerator } from 'glsp-generator';

const generator = new GLSPGenerator();
await generator.generate('grammar.langium', 'output/', {
  validate: true
});
```

**New API (v2):**
```typescript
import { createContainer, TYPES } from '@glsp/generator';
import { IGenerator } from '@glsp/generator/interfaces';

// Create DI container
const container = createContainer();

// Get generator service
const generator = container.get<IGenerator>(TYPES.IGenerator);

// Generate with configuration
const result = await generator.generate({
  grammarPath: 'grammar.langium',
  outputDir: 'output/',
  options: {
    validate: true,
    templates: ['browser', 'server', 'common']
  }
});

// Check result
if (result.success) {
  console.log(`Generated ${result.files.length} files`);
} else {
  console.error('Generation failed:', result.errors);
}
```

### 3. Configuration Changes

#### Configuration Files

The new version supports multiple configuration formats via cosmiconfig:

**`.glsprc.json`:**
```json
{
  "extension": {
    "name": "my-extension",
    "version": "1.0.0",
    "publisher": "my-company"
  },
  "templates": ["browser", "server", "common"],
  "validation": {
    "strict": true
  },
  "plugins": ["@glsp/plugin-documentation"]
}
```

**`glsp.config.js`:**
```javascript
module.exports = {
  extension: {
    name: 'my-extension',
    version: '1.0.0'
  },
  templates: ['browser', 'server'],
  plugins: [
    {
      name: 'custom-plugin',
      options: { /* ... */ }
    }
  ]
};
```

#### Environment Variables

New environment variable support:

```bash
GLSP_DEBUG=true          # Enable debug logging
GLSP_CACHE=false         # Disable caching
GLSP_PLUGINS_DIR=./plugins  # Custom plugins directory
```

### 4. Template System Changes

#### Custom Templates

**Old approach:**
```typescript
// Limited to modifying existing templates
```

**New approach:**
```typescript
// Create custom template strategy
import { ITemplateStrategy } from '@glsp/generator/interfaces';

class CustomTemplateStrategy implements ITemplateStrategy {
  name = 'custom';
  
  canHandle(templateName: string): boolean {
    return templateName.startsWith('custom/');
  }
  
  async render(grammar, templateName, context) {
    // Custom rendering logic
  }
}

// Register strategy
container.bind(TYPES.ITemplateStrategy)
  .to(CustomTemplateStrategy)
  .inSingletonScope();
```

#### Template Helpers

Register custom Handlebars helpers:

```typescript
const helperRegistry = container.get<IHelperRegistry>(TYPES.IHelperRegistry);

helperRegistry.registerHelper('myHelper', (value: string) => {
  return value.toUpperCase();
});
```

### 5. Plugin System

#### Creating Plugins

```typescript
import { IGeneratorPlugin, IEventDrivenGenerator } from '@glsp/generator/interfaces';

export class MyPlugin implements IGeneratorPlugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  
  async initialize(generator: IEventDrivenGenerator): Promise<void> {
    // Subscribe to events
    generator.on('generation.started', (config) => {
      console.log('Generation started:', config.grammarPath);
    });
    
    generator.on('grammar.parsed', (grammar) => {
      console.log('Grammar parsed:', grammar.name);
    });
    
    generator.on('templates.rendered', (files) => {
      console.log(`Rendered ${files.length} files`);
    });
  }
  
  async dispose(): Promise<void> {
    // Cleanup resources
  }
}
```

#### Using Plugins

```typescript
const generator = container.get<IGenerator>(TYPES.IGenerator);
const pluginManager = container.get<IPluginManager>(TYPES.IPluginManager);

// Register plugin
await pluginManager.registerPlugin(new MyPlugin());

// Plugins automatically participate in generation
await generator.generate(config);
```

### 6. Validation Changes

#### Custom Validation Rules

```typescript
import { IValidationRule } from '@glsp/generator/interfaces';

class NamingConventionRule implements IValidationRule {
  name = 'naming-convention';
  
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const errors = [];
    
    // Check interface naming
    for (const iface of context.grammar.interfaces) {
      if (!iface.name.endsWith('Node')) {
        errors.push({
          severity: 'warning',
          message: `Interface ${iface.name} should end with 'Node'`,
          location: iface.location
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// Register rule
const validator = container.get<IValidator>(TYPES.IValidator);
validator.addRule(new NamingConventionRule());
```

### 7. Error Handling

#### Structured Errors

```typescript
try {
  const result = await generator.generate(config);
} catch (error) {
  if (error instanceof GenerationError) {
    console.error(`Generation failed at ${error.phase}:`, error.message);
    
    // Access detailed error information
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
    
    // Handle specific error types
    switch (error.code) {
      case 'PARSE_ERROR':
        // Handle parse errors
        break;
      case 'VALIDATION_ERROR':
        // Handle validation errors
        break;
      case 'TEMPLATE_ERROR':
        // Handle template errors
        break;
    }
  }
}
```

## Migration Steps

### Step 1: Update Dependencies

```bash
# Remove old version
yarn remove glsp-generator

# Install new version
yarn add @glsp/generator@^2.0.0
```

### Step 2: Update Imports

```typescript
// Old
import { GLSPGenerator } from 'glsp-generator';

// New
import { createContainer, TYPES } from '@glsp/generator';
import { IGenerator, GenerationConfig } from '@glsp/generator/interfaces';
```

### Step 3: Update Code

Replace direct instantiation with DI container:

```typescript
// Old
const generator = new GLSPGenerator();

// New
const container = createContainer();
const generator = container.get<IGenerator>(TYPES.IGenerator);
```

### Step 4: Update Configuration

Create a `.glsprc.json` file with your configuration:

```json
{
  "extension": {
    "name": "your-extension",
    "version": "1.0.0"
  },
  "templates": ["browser", "server", "common"],
  "validation": {
    "strict": true
  }
}
```

### Step 5: Test and Validate

Run your generation with the new version and verify output:

```bash
# Dry run first
glsp-generator generate grammar.langium output/ --dry-run

# If successful, run actual generation
glsp-generator generate grammar.langium output/
```

## Breaking Changes

### 1. Custom Grammar AST Removed

The v2 generator uses Langium's native AST exclusively. Any code that relied on custom AST types needs updating:

```typescript
// Old
import { GrammarAST } from 'glsp-generator';

// New
import { Grammar } from 'langium';
```

### 2. Template Context Changes

Template context structure has changed:

```typescript
// Old context
{
  name: 'MyGrammar',
  interfaces: [...],
  rules: [...]
}

// New context
{
  grammar: Grammar,  // Full Langium Grammar object
  projectName: 'my-extension',
  namespace: 'com.example',
  version: '1.0.0',
  // Computed properties
  interfaces: [...],
  rules: [...],
  types: [...],
  hasInterfaces: true,
  hasTypes: false,
  entryRule: { name: 'Model', ... }
}
```

### 3. File Path Changes

Generated file paths now follow a consistent structure:

```
output/
├── browser/
│   ├── command-contribution.ts
│   ├── diagram-configuration.ts
│   └── frontend-module.ts
├── common/
│   ├── model-types.ts
│   └── protocol.ts
├── server/
│   ├── model-factory.ts
│   ├── node-handlers.ts
│   └── server-module.ts
└── package.json
```

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors

If you see "Cannot find module" errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
yarn install
```

#### 2. Template Not Found

Ensure templates are in the correct location:

```bash
# Check template directory
ls node_modules/@glsp/generator/templates/
```

#### 3. Plugin Loading Issues

Enable debug logging to troubleshoot:

```bash
GLSP_DEBUG=true glsp-generator generate grammar.langium output/
```

### Getting Help

- Check the [API documentation](./API_REFERENCE.md)
- Review [examples](../examples/)
- Report issues on [GitHub](https://github.com/eclipse-glsp/glsp-generator/issues)

## Benefits of Migrating

1. **Better Performance**: Caching and optimized template rendering
2. **Extensibility**: Plugin system for custom functionality
3. **Maintainability**: Modular architecture following SOLID principles
4. **Type Safety**: Full TypeScript support with strict types
5. **Testing**: Comprehensive test coverage and testing utilities
6. **Documentation**: TSDoc comments and generated API docs
7. **Standards**: Industry-standard packages and patterns

## Example Migration

Here's a complete example migrating a v1 project:

### Before (v1)

```typescript
// generate.js
const { GLSPGenerator } = require('glsp-generator');

async function generate() {
  const generator = new GLSPGenerator();
  
  try {
    await generator.generate('./grammar/mydsl.langium', './output', {
      validate: true,
      namespace: 'com.example.mydsl'
    });
    console.log('Generation complete');
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

generate();
```

### After (v2)

```typescript
// generate.ts
import { createContainer, TYPES } from '@glsp/generator';
import { IGenerator, GenerationConfig } from '@glsp/generator/interfaces';

async function generate() {
  // Setup DI container
  const container = createContainer();
  const generator = container.get<IGenerator>(TYPES.IGenerator);
  
  // Configuration
  const config: GenerationConfig = {
    grammarPath: './grammar/mydsl.langium',
    outputDir: './output',
    options: {
      validate: true,
      namespace: 'com.example.mydsl',
      templates: ['browser', 'server', 'common']
    }
  };
  
  try {
    // Generate with detailed result
    const result = await generator.generate(config);
    
    if (result.success) {
      console.log(`✓ Generated ${result.files.length} files`);
      console.log(`  Duration: ${result.metadata.duration}ms`);
      
      if (result.warnings.length > 0) {
        console.warn(`⚠ ${result.warnings.length} warnings`);
        result.warnings.forEach(w => console.warn(`  - ${w.message}`));
      }
    } else {
      console.error('✗ Generation failed');
      result.errors.forEach(e => console.error(`  - ${e.message}`));
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

generate();
```

## Conclusion

The migration to v2 provides significant improvements in architecture, extensibility, and maintainability. While there are breaking changes, the benefits outweigh the migration effort. The new plugin system and event-driven architecture enable powerful customizations that weren't possible in v1.

For questions or issues during migration, please refer to our [GitHub repository](https://github.com/eclipse-glsp/glsp-generator) or open an issue.