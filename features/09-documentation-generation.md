# Documentation Generation Feature

## Overview
The Documentation Generation feature automatically creates comprehensive documentation for GLSP extensions, including API references, usage guides, examples, and visual grammar representations using railroad diagrams.

## Purpose
- Generate complete project documentation
- Create API references from code
- Produce visual grammar documentation
- Generate interactive examples
- Support multiple documentation formats

## Current Implementation

### Components

#### 1. **Documentation Generator** (`src/documentation/generator.ts`)
- Orchestrates documentation generation
- Manages output formats
- Handles asset generation
- Creates navigation structure

#### 2. **API Generator** (`src/documentation/api-generator.ts`)
- Extracts API from TypeScript code
- Generates method signatures
- Creates interface documentation
- Produces type references

#### 3. **README Generator** (`src/documentation/readme-generator.ts`)
- Creates main README.md
- Generates quick start guides
- Produces installation instructions
- Creates feature documentation

#### 4. **Example Generator** (`src/documentation/example-generator.ts`)
- Generates code examples
- Creates interactive demos
- Produces sample models
- Generates usage scenarios

#### 5. **Railroad Generator** (`src/documentation/railroad-generator.ts`)
- Creates visual grammar diagrams
- Generates syntax railroad diagrams
- Produces interactive visualizations
- Creates grammar reference cards

### Generated Documentation Structure
```
docs/
├── README.md                    # Main documentation
├── getting-started.md          # Quick start guide
├── installation.md             # Installation instructions
├── configuration.md            # Configuration reference
├── api/
│   ├── index.md               # API overview
│   ├── client/                # Client API docs
│   ├── server/                # Server API docs
│   └── common/                # Common types docs
├── guides/
│   ├── creating-nodes.md      # User guides
│   ├── custom-styling.md
│   └── extending.md
├── examples/
│   ├── basic/                 # Basic examples
│   ├── advanced/              # Advanced examples
│   └── playground.html        # Interactive playground
├── reference/
│   ├── grammar.md             # Grammar reference
│   ├── commands.md            # Command reference
│   └── configuration.md       # Config options
└── assets/
    ├── railroad-diagrams/     # Grammar visualizations
    ├── screenshots/           # UI screenshots
    └── diagrams/              # Architecture diagrams
```

## Generated Documentation Examples

### Main README
```markdown
# My DSL GLSP Extension

Visual editor for My Domain Specific Language, powered by Eclipse GLSP.

![Demo Screenshot](./docs/assets/screenshots/demo.png)

## Features

- 🎨 Visual diagram editing
- 🔧 Full TypeScript support
- 🚀 High-performance rendering
- 📝 Rich property editing
- 🔄 Undo/redo support
- 💾 Auto-save functionality

## Quick Start

\`\`\`bash
# Install dependencies
yarn install

# Build the extension
yarn build

# Start development server
yarn dev
\`\`\`

## Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api/index.md)
- [Configuration Guide](./docs/configuration.md)
- [Examples](./docs/examples/)

## Grammar Overview

\`\`\`langium
interface Node {
  id: ID
  name: string
  position: Position
  children: Node[]
}

interface Edge {
  source: @Node
  target: @Node
  label?: string
}
\`\`\`

See [Grammar Reference](./docs/reference/grammar.md) for complete syntax.
```

### API Documentation
```markdown
# API Reference

## Client API

### DiagramWidget

The main diagram widget component.

\`\`\`typescript
class DiagramWidget extends BaseGLSPWidget {
  /**
   * Initialize the diagram with a model
   * @param model - The initial diagram model
   * @returns Promise that resolves when initialized
   */
  async initialize(model: DiagramModel): Promise<void>
  
  /**
   * Execute a command on the diagram
   * @param command - Command to execute
   * @param args - Command arguments
   * @returns Command execution result
   */
  async executeCommand(command: string, args?: any): Promise<CommandResult>
  
  /**
   * Get the current selection
   * @returns Array of selected element IDs
   */
  getSelection(): string[]
}
\`\`\`

### Model Types

#### Node

Represents a node in the diagram.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier |
| name | string | Display name |
| position | Position | X/Y coordinates |
| type | NodeType | Node type enum |
| children | Node[] | Child nodes |

[Full API Documentation →](./client/diagram-widget.md)
```

### Railroad Diagrams
```markdown
# Grammar Railroad Diagrams

## Node Definition

![Node Railroad Diagram](./assets/railroad-diagrams/node.svg)

\`\`\`
Node ::= 'interface' ID '{'
           Property*
         '}'

Property ::= ID ':' Type Modifiers?

Modifiers ::= '?' | '[]' | '?[]'
\`\`\`

## Type System

![Type Railroad Diagram](./assets/railroad-diagrams/types.svg)

\`\`\`
Type ::= PrimitiveType
       | ID
       | '@' ID
       | Type '|' Type
       | Type '[]'
\`\`\`

[Interactive Grammar Explorer →](./examples/grammar-explorer.html)
```

### Interactive Examples
```html
<!-- docs/examples/playground.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My DSL Playground</title>
  <link rel="stylesheet" href="../assets/styles/playground.css">
</head>
<body>
  <div class="playground">
    <div class="editor-panel">
      <h3>Model Definition</h3>
      <textarea id="model-editor">
{
  "nodes": [
    {
      "id": "node1",
      "name": "Start",
      "position": { "x": 100, "y": 100 },
      "type": "task"
    }
  ],
  "edges": []
}
      </textarea>
      <button onclick="updateDiagram()">Update Diagram</button>
    </div>
    
    <div class="diagram-panel">
      <h3>Visual Diagram</h3>
      <div id="diagram-container"></div>
    </div>
    
    <div class="code-panel">
      <h3>Generated Code</h3>
      <pre id="generated-code"></pre>
    </div>
  </div>
  
  <script src="../assets/js/playground.js"></script>
</body>
</html>
```

## Usage Examples

### CLI Documentation Generation
```bash
# Generate all documentation
glsp-generator docs my-dsl.langium

# Generate specific sections
glsp-generator docs my-dsl.langium --api --examples

# With custom theme
glsp-generator docs my-dsl.langium --theme dark

# Generate for GitHub Pages
glsp-generator docs my-dsl.langium --format github-pages
```

### Configuration
```json
{
  "documentation": {
    "output": "./docs",
    "formats": ["markdown", "html"],
    "sections": {
      "api": true,
      "examples": true,
      "guides": true,
      "railroad": true
    },
    "theme": {
      "name": "default",
      "customCSS": "./custom.css"
    },
    "examples": {
      "interactive": true,
      "playground": true,
      "downloadable": true
    },
    "api": {
      "includePrivate": false,
      "groupBy": "module"
    }
  }
}
```

### Programmatic Usage
```typescript
const docGenerator = new DocumentationGenerator()

const result = await docGenerator.generate(grammar, config, {
  output: './docs',
  formats: ['markdown', 'html'],
  sections: {
    api: true,
    examples: true,
    railroad: true
  }
})

console.log(`Generated ${result.filesGenerated} documentation files`)
```

## Advanced Features

### Custom Templates
```typescript
// Register custom documentation template
docGenerator.registerTemplate('custom-section', {
  template: './templates/custom.hbs',
  data: async (grammar, config) => ({
    // Custom data preparation
  })
})
```

### Documentation Plugins
```typescript
// Add custom documentation processor
docGenerator.addProcessor({
  name: 'diagram-generator',
  process: async (docs) => {
    // Generate architecture diagrams
    // Add mermaid diagrams
    // Create sequence diagrams
  }
})
```

## Best Practices
1. **Keep Updated**: Regenerate docs with code changes
2. **Include Examples**: Provide runnable examples
3. **Visual Aids**: Use diagrams and screenshots
4. **Cross-Reference**: Link between sections
5. **Version Docs**: Document version-specific features

## Future Enhancements
1. **API Playground**: Interactive API testing
2. **Video Tutorials**: Generated video guides
3. **Multi-Language**: Internationalization support
4. **Search Integration**: Full-text search
5. **Version Switcher**: Multiple version support

## Dependencies
- `typedoc`: TypeScript documentation
- `marked`: Markdown processing
- `railroad-diagrams`: Grammar visualization
- `prismjs`: Syntax highlighting
- `mermaid`: Diagram generation

## Testing
- Documentation generation tests
- Link validation tests
- Example compilation tests
- Screenshot generation tests
- Cross-reference validation

## Related Features
- [Grammar Parsing](./01-grammar-parsing.md)
- [Type Safety](./07-type-safety.md)
- [Example Generation](./12-interactive-mode.md)