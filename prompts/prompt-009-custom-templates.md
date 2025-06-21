# Prompt 009: Custom Template System

## Objective
Create a system that allows users to provide their own Handlebars templates, override default templates, and share template packages, enabling full customization of generated extensions.

## Background
The current template system is fixed. Users cannot customize the generated code structure without forking the entire project. A flexible template system would enable domain-specific customizations.

## Requirements

### 1. Template Discovery
Support multiple template sources:
- Default templates (built-in)
- User templates directory
- npm packages
- Git repositories
- Template marketplace

### 2. Template Override System
Allow selective overrides:
- Override individual templates
- Extend existing templates
- Template inheritance
- Partial templates
- Layout templates

### 3. Template Package Format
Define standard format:
```
my-glsp-templates/
├── package.json
├── templates/
│   ├── browser/
│   ├── common/
│   ├── server/
│   └── custom/           # Additional templates
├── partials/             # Reusable partials
├── helpers/              # Custom Handlebars helpers
├── config.json           # Template configuration
└── README.md
```

### 4. Template Configuration
Support template options:
```json
{
  "name": "my-glsp-templates",
  "version": "1.0.0",
  "extends": "@glsp-generator/default-templates",
  "templates": {
    "browser/frontend-module": {
      "override": true,
      "description": "Custom frontend module"
    },
    "custom/my-service": {
      "description": "Additional service",
      "targetDir": "src/services"
    }
  },
  "helpers": [
    "helpers/string-helpers.js",
    "helpers/model-helpers.js"
  ],
  "partials": {
    "header": "partials/header.hbs",
    "imports": "partials/imports.hbs"
  }
}
```

### 5. CLI Integration
Extend CLI to support templates:
```powershell
# Use custom template directory
node dist/cli.js generate grammar.langium -o output --templates ./my-templates

# Use npm package
node dist/cli.js generate grammar.langium -o output --templates my-glsp-templates

# Use Git repository
node dist/cli.js generate grammar.langium -o output --templates https://github.com/user/templates.git

# List available templates
node dist/cli.js templates list

# Install template package
node dist/cli.js templates install my-glsp-templates
```

### 6. Template Development Tools
Provide tools for template authors:
- Template scaffolding command
- Template validation
- Preview generation
- Hot reload during development
- Documentation generator

## Implementation Details

### Template Loader
```typescript
class TemplateLoader {
  private templateSources: TemplateSource[] = [];

  async loadTemplates(options: TemplateOptions): Promise<TemplateSet> {
    // Load default templates
    const defaultTemplates = await this.loadDefaultTemplates();
    
    // Load custom templates
    const customTemplates = await this.loadCustomTemplates(options);
    
    // Merge with override logic
    return this.mergeTemplates(defaultTemplates, customTemplates);
  }

  private async loadCustomTemplates(options: TemplateOptions): Promise<Templates> {
    if (options.templatesPath) {
      return this.loadFromPath(options.templatesPath);
    } else if (options.templatesPackage) {
      return this.loadFromPackage(options.templatesPackage);
    } else if (options.templatesRepo) {
      return this.loadFromGit(options.templatesRepo);
    }
    return {};
  }
}
```

### Template Inheritance
```handlebars
{{!-- base-layout.hbs --}}
<!DOCTYPE html>
<html>
<head>
  {{> header}}
  {{#block "styles"}}{{/block}}
</head>
<body>
  {{#block "content"}}{{/block}}
  {{#block "scripts"}}{{/block}}
</body>
</html>

{{!-- custom-page.hbs --}}
{{#extend "base-layout"}}
  {{#content "styles"}}
    <link rel="stylesheet" href="custom.css">
  {{/content}}
  
  {{#content "content"}}
    <div class="custom-content">
      {{> myPartial}}
    </div>
  {{/content}}
{{/extend}}
```

### Template Package Example
```json
{
  "name": "@company/glsp-templates-enterprise",
  "version": "1.0.0",
  "description": "Enterprise GLSP templates with authentication",
  "main": "index.js",
  "glspTemplates": {
    "extends": "@glsp-generator/default-templates",
    "features": ["auth", "multi-tenant", "audit-logging"]
  },
  "peerDependencies": {
    "glsp-generator": "^1.0.0"
  }
}
```

## Acceptance Criteria

1. ✅ Override individual templates
2. ✅ Load templates from multiple sources
3. ✅ Template inheritance works
4. ✅ Custom helpers and partials
5. ✅ Template packages installable via npm
6. ✅ Documentation for template authors
7. ✅ Template validation and error messages

## Testing Requirements

Create tests for:
- Template loading from various sources
- Override logic
- Helper registration
- Partial resolution
- Template package validation
- CLI template commands

## Files to Create/Modify

1. `src/templates/template-loader.ts`
2. `src/templates/template-resolver.ts`
3. `src/templates/package-manager.ts`
4. `src/templates/inheritance.ts`
5. `src/cli.ts` - Add template commands
6. `scripts/create-template-package.js`
7. Documentation for template authors

## Dependencies
- None

## Notes
- Consider a template marketplace/registry
- Version compatibility is important
- Security: validate third-party templates
- Consider template testing framework
- Could support other template engines later
