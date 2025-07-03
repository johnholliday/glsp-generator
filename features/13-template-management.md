# Template Management Feature

## Overview
The Template Management feature provides a flexible system for managing, customizing, and extending code generation templates. It supports custom templates, template packages, inheritance, and hot-reloading for rapid development.

## Purpose
- Enable template customization without forking
- Support template packages and marketplaces
- Provide template inheritance and composition
- Allow project-specific overrides
- Enable template hot-reloading

## Current Implementation

### Components

#### 1. **Template Loader** (`src/templates/template-loader.ts`)
- Template discovery and loading
- Priority-based resolution
- Caching and compilation
- Validation and error handling

#### 2. **Template System** (`src/templates/index.ts`)
- Handlebars engine configuration
- Helper registration
- Partial management
- Context preparation

#### 3. **Template Structure**
```
templates/
├── browser/                    # Client-side templates
│   ├── command-contribution.hbs
│   ├── diagram-configuration.hbs
│   └── frontend-module.hbs
├── server/                     # Server-side templates
│   ├── model-factory.hbs
│   ├── node-handlers.hbs
│   └── server-module.hbs
├── common/                     # Shared templates
│   ├── model-types.hbs
│   └── protocol.hbs
├── partials/                   # Reusable components
│   ├── header.hbs
│   ├── imports.hbs
│   └── helpers/
└── layouts/                    # Base layouts
    ├── typescript.hbs
    └── package.hbs
```

### Template Features

#### Template Inheritance
```handlebars
{{!-- layouts/base.hbs --}}
<!DOCTYPE html>
<html>
<head>
  {{> meta}}
  {{#block "styles"}}{{/block}}
</head>
<body>
  {{#block "content"}}{{/block}}
  {{#block "scripts"}}{{/block}}
</body>
</html>

{{!-- pages/diagram.hbs --}}
{{#extend "layouts/base"}}
  {{#content "styles"}}
    <link rel="stylesheet" href="diagram.css">
  {{/content}}
  
  {{#content "content"}}
    <div id="diagram-container"></div>
  {{/content}}
{{/extend}}
```

#### Custom Helpers
```typescript
// Template helpers
Handlebars.registerHelper('switch', function(value, options) {
  this.switch_value = value
  return options.fn(this)
})

Handlebars.registerHelper('case', function(value, options) {
  if (value === this.switch_value) {
    return options.fn(this)
  }
})

Handlebars.registerHelper('formatType', function(type, options) {
  const { isArray, isOptional, isReference } = options.hash
  let result = isReference ? `Ref<${type}>` : type
  if (isArray) result = `${result}[]`
  if (isOptional) result = `${result} | undefined`
  return result
})
```

## Template Package System

### Package Structure
```
my-templates/
├── package.json
├── templates/
│   ├── index.json           # Template manifest
│   ├── browser/
│   ├── server/
│   └── common/
├── helpers/                 # Custom helpers
│   └── index.js
├── partials/               # Shared partials
└── examples/               # Usage examples
```

### Template Manifest
```json
{
  "name": "@company/glsp-templates",
  "version": "1.0.0",
  "templates": {
    "browser/custom-widget": {
      "description": "Custom widget component",
      "variables": ["widgetName", "widgetType"],
      "extends": "browser/base-widget"
    },
    "server/custom-handler": {
      "description": "Custom command handler",
      "variables": ["handlerName", "commandType"]
    }
  },
  "helpers": [
    "formatDate",
    "pluralize",
    "kebabCase"
  ],
  "partials": {
    "header": "partials/header.hbs",
    "footer": "partials/footer.hbs"
  }
}
```

## Usage Examples

### Using Custom Templates
```bash
# Use local templates
glsp-generator generate grammar.langium \
  --templates ./my-templates

# Use template package
glsp-generator generate grammar.langium \
  --template-package @company/glsp-templates

# Override specific template
glsp-generator generate grammar.langium \
  --override browser/diagram-config=./custom-diagram.hbs
```

### Template Configuration
```json
{
  "templates": {
    "sources": [
      "./templates",              // Local templates (highest priority)
      "@company/glsp-templates",  // Company package
      "builtin"                   // Built-in templates (lowest)
    ],
    "overrides": {
      "browser/diagram-configuration": "./custom/diagram.hbs"
    },
    "variables": {
      "companyName": "ACME Corp",
      "copyright": "2024"
    },
    "helpers": [
      "./template-helpers.js"
    ]
  }
}
```

### Creating Template Packages
```typescript
// package.json
{
  "name": "@mycompany/glsp-material-templates",
  "version": "1.0.0",
  "main": "index.js",
  "glsp-templates": {
    "path": "./templates",
    "theme": "material"
  }
}

// index.js
export default {
  name: 'Material Templates',
  description: 'Material Design templates for GLSP',
  
  templates: {
    'browser/material-node': {
      path: 'browser/material-node.hbs',
      description: 'Material Design node component'
    }
  },
  
  helpers: {
    materialColor: (color) => {
      const colors = {
        primary: '#1976d2',
        secondary: '#dc004e',
        error: '#f44336'
      }
      return colors[color] || color
    }
  },
  
  configure: (handlebars) => {
    // Register partials
    handlebars.registerPartial('material-header', 
      fs.readFileSync('./partials/header.hbs', 'utf8')
    )
  }
}
```

## Advanced Features

### Template Hot-Reloading
```typescript
// Development mode with hot-reload
class TemplateWatcher {
  watch() {
    chokidar.watch('templates/**/*.hbs')
      .on('change', (path) => {
        this.reloadTemplate(path)
        this.notifyReload(path)
      })
  }
  
  reloadTemplate(path: string) {
    // Clear cache
    delete this.compiledTemplates[path]
    
    // Recompile
    const source = fs.readFileSync(path, 'utf8')
    this.compiledTemplates[path] = Handlebars.compile(source)
  }
}
```

### Template Validation
```typescript
interface TemplateValidator {
  validate(template: string): ValidationResult
  checkVariables(template: string, context: any): string[]
  validateSyntax(template: string): SyntaxError[]
}

// Usage
const validator = new TemplateValidator()
const result = validator.validate(templateSource)

if (!result.valid) {
  console.error('Template errors:', result.errors)
}
```

### Template Testing
```typescript
// Test template output
describe('Model Factory Template', () => {
  it('should generate valid TypeScript', () => {
    const template = loadTemplate('server/model-factory')
    const context = {
      projectName: 'TestDSL',
      interfaces: [/* ... */]
    }
    
    const output = template(context)
    
    // Validate TypeScript syntax
    const sourceFile = ts.createSourceFile(
      'test.ts',
      output,
      ts.ScriptTarget.Latest
    )
    
    expect(sourceFile.parseDiagnostics).toHaveLength(0)
  })
})
```

## Template Development

### Best Practices
```handlebars
{{!-- Good: Clear variable names --}}
{{#each interfaces as |interface|}}
  export interface {{toPascalCase interface.name}} {
    {{#each interface.properties as |prop|}}
    {{prop.name}}: {{formatType prop.type prop.modifiers}}
    {{/each}}
  }
{{/each}}

{{!-- Good: Use partials for reusability --}}
{{> imports context="browser"}}

{{!-- Good: Comment complex logic --}}
{{!-- Generate factory methods for each interface --}}
{{#each interfaces}}
  {{> factoryMethod this}}
{{/each}}
```

### Template Context
```typescript
interface TemplateContext {
  // Project info
  projectName: string
  packageName: string
  version: string
  
  // Grammar data
  grammar: GrammarAST
  interfaces: Interface[]
  types: TypeAlias[]
  
  // Configuration
  config: GLSPConfig
  features: FeatureFlags
  
  // Utilities
  helpers: TemplateHelpers
  partials: PartialMap
}
```

## Template CLI Commands

### Template Management
```bash
# List available templates
glsp-generator templates list

# Install template package
glsp-generator templates install @company/templates

# Create new template
glsp-generator templates create my-template

# Validate templates
glsp-generator templates validate ./my-templates

# Package templates
glsp-generator templates pack ./my-templates
```

### Template Development
```bash
# Start template development server
glsp-generator templates dev --watch

# Test templates with sample data
glsp-generator templates test ./template.hbs --data sample.json

# Preview template output
glsp-generator templates preview browser/widget --grammar sample.langium
```

## Future Enhancements
1. **Template Marketplace**: NPM-based template sharing
2. **Visual Editor**: GUI for template creation
3. **AI Generation**: AI-assisted template creation
4. **Version Control**: Template versioning system
5. **Multi-Language**: Support other template engines

## Dependencies
- `handlebars`: Template engine
- `chokidar`: File watching
- `js-yaml`: YAML template support
- `prettier`: Template formatting

## Testing
- Template compilation tests
- Output validation tests
- Helper function tests
- Package loading tests
- Hot-reload tests

## Related Features
- [Code Generation](./02-code-generation.md)
- [Configuration System](./04-configuration.md)
- [Package Management](./18-package-management.md)