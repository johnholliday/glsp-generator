# CLI Migration Guide

This guide shows how to migrate from the existing CLI to the refactored architecture.

## Overview

The refactored CLI uses a clean architecture with dependency injection, making it more modular, testable, and maintainable. The key changes include:

1. **Dependency Injection**: All services are resolved through InversifyJS container
2. **SOLID Principles**: Each service has a single responsibility
3. **Event-Driven**: Built-in event bus for monitoring and extensibility
4. **Plugin Architecture**: Support for extending functionality through plugins
5. **Industry-Standard Packages**: Uses cosmiconfig, zod, fs-extra, etc.

## Running the Refactored CLI

### Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Make the CLI executable
chmod +x dist/cli-refactored.js
```

### Basic Usage

```bash
# Generate a GLSP extension
node dist/cli-refactored.js generate my-grammar.langium -o ./output

# With custom templates
node dist/cli-refactored.js generate my-grammar.langium -o ./output -t browser server

# Validate only
node dist/cli-refactored.js validate my-grammar.langium

# Clean generated files
node dist/cli-refactored.js clean ./output

# List available templates
node dist/cli-refactored.js templates

# List available plugins
node dist/cli-refactored.js plugins
```

### Advanced Options

```bash
# Dry run (preview without writing files)
node dist/cli-refactored.js generate my-grammar.langium --dry-run

# Force overwrite existing files
node dist/cli-refactored.js generate my-grammar.langium --force

# Enable verbose logging
node dist/cli-refactored.js generate my-grammar.langium --verbose

# Enable debug mode
node dist/cli-refactored.js generate my-grammar.langium --debug

# Skip validation
node dist/cli-refactored.js generate my-grammar.langium --no-validate

# Enable specific plugins
node dist/cli-refactored.js generate my-grammar.langium --plugin documentation type-safety
```

## Backward Compatibility

To maintain backward compatibility with existing code, we provide an adapter layer:

```typescript
// Using the adapter in existing code
import { GenerateCommandAdapter } from './commands/base/GenerateCommandAdapter';

const adapter = new GenerateCommandAdapter(logger);

// Works exactly like the old GLSPGenerator
const result = await adapter.generateExtension(
  'my-grammar.langium',
  './output',
  {
    generateDocs: true,
    generateTypeSafety: true,
    generateTests: true,
    generateCICD: true
  }
);
```

## Migration Steps

### Step 1: Update CLI Entry Point

Replace the CLI initialization in your scripts:

```bash
# Old
node dist/cli.js generate my-grammar.langium

# New (during migration)
node dist/cli-refactored.js generate my-grammar.langium
```

### Step 2: Update package.json

Update the bin entry once migration is complete:

```json
{
  "bin": {
    "glsp-gen": "./dist/cli-refactored.js"
  }
}
```

### Step 3: Update Existing Commands

Existing commands can be gradually migrated to use the new services:

```typescript
// Old approach
import { GLSPGenerator } from '../generator.js';

// New approach
import { IGenerator } from '../core/interfaces/IGenerator';
import { TYPES } from '../infrastructure/di/symbols';

// In command handler
const generator = container.get<IGenerator>(TYPES.IGenerator);
```

### Step 4: Update Configuration

The new architecture uses cosmiconfig for configuration discovery:

```javascript
// .glsprc.json
{
  "templates": {
    "dir": "./templates",
    "custom": ["my-custom-template"]
  },
  "plugins": {
    "enabled": ["documentation", "type-safety"],
    "dir": "./plugins"
  },
  "generation": {
    "validate": true,
    "force": false
  }
}
```

## Benefits of the New Architecture

### 1. Better Testing

```typescript
// Easy to mock services
const mockGenerator = {
  generate: jest.fn().mockResolvedValue({ success: true })
};

container.rebind(TYPES.IGenerator).toConstantValue(mockGenerator);
```

### 2. Plugin Support

```typescript
// Create custom plugins
export class MyPlugin implements IGeneratorPlugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async beforeGenerate(config: GenerationConfig): Promise<void> {
    // Custom logic
  }
  
  async afterGenerate(result: GenerationResult): Promise<void> {
    // Custom logic
  }
}
```

### 3. Event Monitoring

```typescript
// Subscribe to generation events
eventBus.on('generation:complete', (data) => {
  console.log('Generation took', data.duration, 'ms');
  console.log('Generated', data.filesCount, 'files');
});
```

### 4. Better Error Handling

```typescript
// Centralized error handling
errorHandler.registerHandler(ValidationError, (error) => {
  console.error('Validation failed:', error.errors);
  // Custom error reporting
});
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all dependencies are installed: `yarn install`
   - Rebuild the project: `yarn build`

2. **Permission denied**
   - Make the CLI executable: `chmod +x dist/cli-refactored.js`

3. **Configuration not found**
   - The new CLI uses cosmiconfig, which looks for:
     - `.glsprc.json`
     - `.glsprc.yaml`
     - `glsp.config.js`
     - `package.json` (glsp field)

4. **Plugin not loading**
   - Check plugin is in the plugins directory
   - Ensure plugin exports the correct interface
   - Enable plugin in configuration or CLI args

## Next Steps

1. Test the refactored CLI with your existing grammars
2. Gradually migrate custom commands to use new services
3. Create custom plugins for project-specific needs
4. Update CI/CD pipelines to use the new CLI

For more information, see the architecture documentation in `/docs/architecture/`.