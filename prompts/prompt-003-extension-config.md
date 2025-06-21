# Prompt 003: Extension Configuration System

## Objective
Create a configuration system that allows users to customize the generated Theia GLSP extension through a `.glsprc.json` configuration file.

## Background
Currently, the generator uses hardcoded values for dependencies, metadata, and styling. Users need a way to customize these aspects without modifying templates directly.

## Requirements

### 1. Configuration File Format
Support `.glsprc.json` with schema:
```json
{
  "$schema": "./glsprc.schema.json",
  "extension": {
    "name": "my-modeling-tool",
    "displayName": "My Modeling Tool",
    "version": "1.0.0",
    "publisher": "my-company",
    "description": "Visual modeling tool for X",
    "license": "MIT",
    "repository": "https://github.com/..."
  },
  "dependencies": {
    "@eclipse-glsp/server": "^2.0.0",
    "@theia/core": "^1.35.0",
    "customDeps": {
      "my-lib": "^1.0.0"
    }
  },
  "diagram": {
    "type": "node-edge",
    "features": {
      "compartments": true,
      "ports": true,
      "routing": "manhattan",
      "grid": true,
      "snapToGrid": true
    }
  },
  "styling": {
    "theme": "light",
    "defaultColors": {
      "node": "#4A90E2",
      "edge": "#333333",
      "selected": "#FF6B6B"
    },
    "fonts": {
      "default": "Arial, sans-serif",
      "monospace": "Consolas, monospace"
    }
  },
  "generation": {
    "outputStructure": "standard",
    "includeExamples": true,
    "generateTests": true,
    "generateDocs": true
  }
}
```

### 2. Schema Validation
Create JSON schema:
- Full IntelliSense support in VS Code
- Validation of configuration values
- Clear descriptions for each option
- Default values specified

### 3. Configuration Loading
Enhance generator to:
- Look for `.glsprc.json` in current directory
- Fall back to parent directories
- Merge with default configuration
- Support CLI overrides
- Validate configuration before use

### 4. Template Integration
Update templates to use configuration:
- Access config values in Handlebars
- Conditional sections based on features
- Dynamic dependency injection
- Configurable styling

### 5. CLI Integration
Extend CLI with:
- `--config <path>` option
- `init` command to create default config
- `validate-config` command
- Override individual options: `--set extension.version=2.0.0`

## Implementation Details

### Configuration Loader
```typescript
interface GLSPConfig {
  extension: ExtensionMetadata;
  dependencies: DependencyConfig;
  diagram: DiagramConfig;
  styling: StylingConfig;
  generation: GenerationConfig;
}

class ConfigLoader {
  async loadConfig(startPath: string): Promise<GLSPConfig> {
    // Search for .glsprc.json
    // Validate against schema
    // Merge with defaults
    // Return validated config
  }
}
```

### Template Usage
```handlebars
{
  "name": "{{config.extension.name}}",
  "displayName": "{{config.extension.displayName}}",
  "version": "{{config.extension.version}}",
  {{#if config.extension.repository}}
  "repository": "{{config.extension.repository}}",
  {{/if}}
  "dependencies": {
    "@eclipse-glsp/server": "{{config.dependencies.[@eclipse-glsp/server]}}",
    {{#each config.dependencies.customDeps}}
    "{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
    {{/each}}
  }
}
```

## Acceptance Criteria

1. ✅ Configuration file with full JSON schema support
2. ✅ Generator loads and validates configuration
3. ✅ Templates use configuration values
4. ✅ CLI supports configuration options
5. ✅ Documentation explains all options
6. ✅ Error messages for invalid configuration
7. ✅ Works with relative and absolute paths

## Testing Requirements

Create tests in `src/config/config-loader.test.ts`:
- Test configuration discovery
- Test schema validation
- Test default value merging
- Test CLI overrides
- Test invalid configurations
- Test template integration

## Files to Create/Modify

1. `src/config/config-loader.ts` - Configuration loading logic
2. `src/config/glsprc.schema.json` - JSON schema
3. `src/config/default-config.ts` - Default configuration
4. `src/cli.ts` - Add config options
5. `src/generator.ts` - Use configuration
6. Update all templates to use config
7. `examples/.glsprc.json` - Example configuration
8. Update `README.md` with configuration docs

## Dependencies
- None

## Notes
- Consider supporting `.glsprc.js` for dynamic configuration
- Schema should be published to schema store
- Configuration could later support project templates
- Consider environment variable support
