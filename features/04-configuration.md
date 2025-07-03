# Configuration System Feature

## Overview
The Configuration System provides a flexible way to customize GLSP Generator behavior through JSON configuration files. It supports project-specific settings, feature toggles, dependency management, and styling options.

## Purpose
- Centralize project configuration in `.glsprc.json`
- Enable reproducible builds across teams
- Support configuration inheritance and overrides
- Validate configuration against JSON schema

## Current Implementation

### Components
1. **Config Loader** (`src/config/config-loader.ts`)
   - Loads configuration from multiple sources
   - Validates against JSON schema
   - Merges configurations with defaults
   - Supports environment variable interpolation

2. **Config Schema** (`src/config/glsprc.schema.json`)
   - JSON Schema definition
   - Comprehensive validation rules
   - Documentation for all options
   - IDE auto-completion support

3. **Config Types** (`src/config/types.ts`)
   - TypeScript interfaces
   - Type-safe configuration access
   - Default values definition

### Configuration Structure
```json
{
  "$schema": "./node_modules/@glsp/generator/config/glsprc.schema.json",
  "extension": {
    "name": "my-dsl-glsp",
    "displayName": "My DSL Editor",
    "version": "1.0.0",
    "publisher": "my-company",
    "description": "Visual editor for My DSL",
    "license": "MIT",
    "repository": "https://github.com/company/my-dsl",
    "categories": ["Programming Languages", "Visualization"]
  },
  "dependencies": {
    "@eclipse-glsp/server": "^2.0.0",
    "@eclipse-glsp/client": "^2.0.0",
    "@theia/core": "^1.30.0"
  },
  "generation": {
    "outputDir": "./generated",
    "features": {
      "documentation": true,
      "typeSafety": true,
      "tests": true,
      "cicd": true
    },
    "templates": {
      "path": "./templates",
      "package": "@company/glsp-templates"
    }
  },
  "diagram": {
    "defaultTool": "selection",
    "grid": {
      "enabled": true,
      "size": 10,
      "visible": true
    },
    "features": {
      "autoLayout": true,
      "animation": true,
      "clipboard": true,
      "contextMenu": true,
      "deletion": true,
      "editing": true,
      "export": true,
      "palette": true,
      "propertyView": true,
      "search": true,
      "selection": true,
      "toolbar": true,
      "undo": true,
      "validation": true,
      "zoom": true
    }
  },
  "styling": {
    "theme": "light",
    "defaultColors": {
      "node": "#4A90E2",
      "edge": "#333333",
      "selected": "#FF6B6B",
      "hover": "#FFA500",
      "error": "#DC143C"
    },
    "fonts": {
      "default": "Arial, sans-serif",
      "monospace": "Consolas, Monaco, monospace"
    },
    "nodeDefaults": {
      "width": 100,
      "height": 60,
      "borderRadius": 4,
      "borderWidth": 1
    }
  },
  "validation": {
    "rules": {
      "noCircularRefs": true,
      "noDuplicateProperties": true,
      "noUndefinedTypes": true,
      "namingConvention": "camelCase"
    },
    "customRules": "./validation-rules.js"
  }
}
```

## Technical Details

### Configuration Loading Order
1. Built-in defaults
2. Global config (`~/.glsprc.json`)
3. Project config (`./.glsprc.json`)
4. Environment variables (`GLSP_*`)
5. Command-line arguments

### Interpolation Support
```json
{
  "extension": {
    "name": "${grammarName}-glsp",
    "version": "${env:VERSION:-1.0.0}",
    "description": "Editor for ${grammarName}"
  }
}
```

### Schema Validation
- Required fields validation
- Type checking
- Pattern matching for strings
- Range validation for numbers
- Enum validation
- Custom validation functions

## Usage Examples

### Basic Configuration
```json
{
  "extension": {
    "name": "statemachine-glsp",
    "displayName": "State Machine Editor"
  }
}
```

### Advanced Configuration
```json
{
  "generation": {
    "features": {
      "documentation": {
        "enabled": true,
        "includeExamples": true,
        "apiDocs": true
      },
      "typeSafety": {
        "enabled": true,
        "strict": true,
        "runtime": true
      }
    }
  },
  "hooks": {
    "preGenerate": "./scripts/prepare.js",
    "postGenerate": "./scripts/finalize.js"
  }
}
```

### Environment-Specific Config
```json
{
  "profiles": {
    "development": {
      "generation": {
        "features": {
          "tests": true,
          "documentation": true
        }
      }
    },
    "production": {
      "generation": {
        "minify": true,
        "sourceMaps": false
      }
    }
  }
}
```

## Configuration API

### Loading Configuration
```typescript
const configLoader = new ConfigLoader();
const config = await configLoader.loadConfig(projectDir, configPath);
```

### Validating Configuration
```typescript
const errors = await configLoader.validateConfig(config);
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

### Merging Configurations
```typescript
const merged = configLoader.mergeConfigs(baseConfig, overrides);
```

## Best Practices
1. **Version Control**: Commit `.glsprc.json` to repository
2. **Schema Reference**: Always include `$schema` for IDE support
3. **Environment Variables**: Use for sensitive or dynamic values
4. **Modular Config**: Split large configs into profiles
5. **Validation**: Run validation in CI/CD pipeline

## Future Enhancements
1. **Config Migration**: Automatic config version migration
2. **Config UI**: Web-based configuration editor
3. **Config Inheritance**: Extend from base configurations
4. **Dynamic Reloading**: Hot-reload config changes
5. **Config Presets**: Built-in configuration templates

## Dependencies
- `ajv`: JSON schema validation
- `json5`: JSON with comments support
- `dotenv`: Environment variable loading
- `deepmerge`: Configuration merging

## Testing
- Unit tests for config loading
- Schema validation tests
- Interpolation tests
- Migration tests
- Error handling tests

## Related Features
- [CLI Interface](./03-cli-interface.md)
- [Template Management](./13-template-management.md)
- [Validation & Linting](./05-validation-linting.md)