# GLSP Generator

A TypeScript-based tool for generating Theia GLSP extensions from Langium grammars.

## Features

- 🚀 **Langium AST Parser**: Uses Langium's own parser for accurate grammar analysis
- 📝 **Handlebars Templates**: Flexible template system for code generation
- 🧪 **Jest Testing**: Comprehensive test suite with ES modules support
- 🎯 **Type-Safe Generation**: Generates properly typed TypeScript code
- ✅ **Grammar Validation**: Built-in validation of Langium grammar files
- 🔧 **CLI Interface**: Easy-to-use command-line interface with Yargs
- ⚙️ **Configuration System**: Extensive customization via `.glsprc.json`
- 👀 **Watch Mode**: Auto-regenerate on grammar changes with live reload
- 📦 **Project Scaffolding**: Create new DSL projects from templates

## What's New

### Version 2.1.167
- **Langium AST Parser**: Replaced regex-based parsing with Langium's official AST parser
- **Fixed Type Generation**: Union types now generate proper TypeScript string literals
- **Improved Naming**: Consistent PascalCase/camelCase naming throughout generated code
- **Better Error Handling**: Clear error messages for grammar parsing issues
- **Enhanced Templates**: More robust template generation with proper type safety

## Installation

### Global Installation
```bash
npm install -g glsp-generator
# or
yarn global add glsp-generator
```

### Development Setup
```bash
git clone <repository>
cd glsp-generator
yarn install
yarn build
yarn setup:dev  # Creates global 'glsp' command for development
```

## Usage

### Quick Start

```bash
# Generate VSIX package from grammar file (default)
glsp gen my-grammar.langium

# Development mode - generate and open in VSCode
glsp gen my-grammar.langium --dev

# Interactive mode
glsp

# Create new project
glsp new my-dsl-project
```

### CLI Commands

#### Generate Extension
```bash
glsp generate <grammar> [output]
# or use short aliases
glsp gen <grammar> [output]
glsp g <grammar> [output]
```

**Options:**
- `--config, -c <file>`: Configuration file
- `--dev`: Development mode - generate project and open in VSCode
- `--debug, -d`: Debug mode - open VSCode extension host with generated VSIX
- `--no-vsix`: Skip VSIX packaging (generate project only)
- `--watch, -w`: Watch for changes and regenerate
- `--validate-only`: Only validate, don't generate
- `--no-validate`: Skip validation
- `--force, -f`: Overwrite existing files

**Examples:**
```bash
# Generate VSIX package (default)
glsp gen state-machine.langium

# Development mode - generate and open in VSCode
glsp gen grammar.langium --dev

# Debug mode - generate VSIX and open extension host
glsp gen grammar.langium --debug

# Generate project only (no VSIX)
glsp gen grammar.langium --no-vsix

# Custom output directory for VSIX
glsp gen grammar.langium ./output

# Watch mode with project generation
glsp gen grammar.langium --no-vsix -w
```

#### Validate Grammar
```bash
glsp validate <grammar>
# or use short aliases
glsp val <grammar>
glsp v <grammar>
```

**Options:**
- `--debug, -d`: Show detailed validation errors

**Examples:**
```bash
glsp validate my-grammar.langium
glsp val grammar.langium -d
```

#### Watch Mode
```bash
glsp watch <grammar> [output]
# or use short alias
glsp w <grammar> [output]
```

Watch mode automatically regenerates your GLSP extension whenever the grammar file changes. It includes smart debouncing, error recovery, and optional development server with live reload.

**Options:**
- `--serve, -s`: Start development server with live reload
- `--port, -p <number>`: Development server port (default: 3000)
- `--debounce, -d <ms>`: Debounce time in milliseconds (default: 500)
- `--config, -c <file>`: Configuration file to watch
- `--clear`: Clear console on each generation
- `--verbose, -v`: Verbose output with stack traces

**Examples:**
```bash
# Basic watch mode
glsp watch grammar.langium

# Watch with live reload server
glsp w grammar.langium -s

# Custom port and faster debouncing
glsp w grammar.langium -s -p 8080 -d 300

# Clear console between generations
glsp w grammar.langium --clear

# Watch with config file
glsp w grammar.langium -c .glsprc.json
```

**Features:**
- 🔄 Automatic regeneration on file changes
- ⚡ Smart debouncing prevents excessive regeneration
- 🛡️ Error recovery - continues watching after errors
- 🌐 Optional dev server with WebSocket live reload
- 📊 Generation statistics and timing
- 🎯 Clear error messages with file locations
- ⌨️ Graceful shutdown on Ctrl+C

#### Create New Project
```bash
glsp new <name>
# or use aliases
glsp init <name>
glsp create <name>
```

**Options:**
- `--template, -t <type>`: Template to use (basic|advanced|minimal)
- `--no-git`: Skip git initialization
- `--no-install`: Skip dependency installation

**Examples:**
```bash
# Create with prompts
glsp new my-dsl

# Use advanced template
glsp new my-dsl -t advanced

# Skip git and install
glsp new my-dsl --no-git --no-install
```

#### Configuration Management

##### Initialize Configuration
```bash
glsp init
# or
glsp config
```

Creates a `.glsprc.json` configuration file in the current directory with default values.

**Options:**
- `--force, -f`: Overwrite existing config
- `--path, -p <dir>`: Output path for config file

**Examples:**
```bash
# Create in current directory
glsp init

# Create in specific directory
glsp init -p ./config

# Overwrite existing
glsp init -f
```

##### Validate Configuration
```bash
glsp validate-config [config]
```

Validates a GLSP configuration file against the schema.

**Options:**
- `--verbose, -v`: Show detailed validation output

**Examples:**
```bash
# Validate .glsprc.json in current directory
glsp validate-config

# Validate specific file
glsp validate-config ./config/.glsprc.json

# Show full config after validation
glsp validate-config -v
```

#### Clean Generated Files
```bash
glsp clean
```

**Options:**
- `--force, -f`: Force clean without confirmation

### Interactive Mode

When you run `glsp` without any arguments, it starts in interactive mode:

```bash
> glsp
? What would you like to do? (Use arrow keys)
❯ Generate GLSP extension
  Validate grammar
  Create new project
  Clean generated files
  Show help
  Exit
```

### PowerShell Completion

For PowerShell users, enable tab completion:

```powershell
# Load completion script
. ./scripts/glsp-completion.ps1

# Now use tab completion
glsp <TAB>
glsp gen <TAB>
```

### Programmatic Usage

```typescript
import { GLSPGenerator } from 'glsp-generator';

const generator = new GLSPGenerator();

// Generate extension
await generator.generateExtension('my-domain.langium', './output');

// Validate grammar
const isValid = await generator.validateGrammar('my-domain.langium');
```

## Default VSIX Generation

By default, the generator creates a VSIX package ready for installation in VSCode/Theia:

```bash
# Generates state-machine-glsp-1.0.0.vsix in ./output
glsp gen state-machine.langium

# Install the generated VSIX
code --install-extension ./output/state-machine-glsp-1.0.0.vsix
```

The VSIX generation process:
1. Creates extension in a temporary directory
2. Runs `yarn install` and `yarn build`
3. Packages as VSIX using `vsce`
4. Copies VSIX to output directory
5. Cleans up temporary files

## Generated Structure

The generator creates a complete Theia GLSP extension with the following structure:

```
my-domain-glsp-extension/
├── package.json
├── tsconfig.json
└── src/
    ├── browser/
    │   ├── my-domain-command-contribution.ts
    │   └── diagram/
    │       └── my-domain-diagram-configuration.ts
    ├── common/
    │   └── my-domain-model.ts
    └── server/
        ├── handlers/
        │   └── create-my-domain-node-handler.ts
        └── model/
            └── my-domain-server-model.ts
```

## Langium Grammar Support

The generator supports the following Langium grammar constructs:

- **Interfaces**: Converted to TypeScript interfaces with type hierarchy
- **Types**: Union types and type aliases with proper string literal types
- **Properties**: With proper TypeScript typing (optional, arrays, references)
- **Inheritance**: Interface extension relationships

### Example Grammar

```langium
grammar MyDomain

interface Element {
    name: string
}

interface Node extends Element {
    position: Position
    size?: Size
    label?: string
}

interface Edge extends Element {
    source: @Node
    target: @Node
    type: EdgeType
}

interface Position {
    x: number
    y: number
}

type EdgeType = 'association' | 'dependency' | 'inheritance';
```

### Generated TypeScript

```typescript
export namespace MyDomainModel {
    export const TypeHierarchy = {
        element: 'element:Element',
        node: 'node:Node',
        edge: 'edge:Edge',
        position: 'position:Position'
    };

    export interface MyDomainElement {
        type: string;
        id?: string;
        [key: string]: any;
    }

    export interface Element extends MyDomainElement {
        name: string;
    }

    export interface Node extends Element {
        position: Position;
        size?: Size;
        label?: string;
    }

    export interface Edge extends Element {
        source: Node;
        target: Node;
        type: EdgeType;
    }

    export type EdgeType = 'association' | 'dependency' | 'inheritance';
}
```

## Configuration System

The GLSP Generator supports extensive customization through a `.glsprc.json` configuration file. This allows you to customize extension metadata, dependencies, diagram features, styling, and generation options without modifying templates.

### Configuration File

Create a `.glsprc.json` file in your project root:

```json
{
  "$schema": "./node_modules/glsp-generator/src/config/glsprc.schema.json",
  "extension": {
    "name": "my-dsl-glsp",
    "displayName": "My DSL Extension",
    "version": "1.0.0",
    "publisher": "my-company",
    "description": "A GLSP-based modeling tool",
    "license": "MIT"
  },
  "dependencies": {
    "@eclipse-glsp/server": "^2.0.0",
    "@eclipse-glsp/client": "^2.0.0",
    "@eclipse-glsp/theia-integration": "^2.0.0",
    "@theia/core": "^1.35.0",
    "customDeps": {
      "lodash": "^4.17.21"
    }
  },
  "diagram": {
    "type": "node-edge",
    "features": {
      "compartments": false,
      "ports": true,
      "routing": "manhattan",
      "grid": true,
      "snapToGrid": true,
      "autoLayout": false,
      "animation": true
    }
  },
  "styling": {
    "theme": "light",
    "defaultColors": {
      "node": "#4A90E2",
      "edge": "#333333",
      "selected": "#FF6B6B"
    }
  }
}
```

### Configuration Options

#### Extension Metadata
- `name`: Package name for the extension
- `displayName`: Human-readable name
- `version`: Semantic version
- `publisher`: Publisher name or organization
- `description`: Short description
- `license`: License identifier (e.g., MIT, Apache-2.0)
- `repository`: Repository URL
- `author`: Author name and email
- `keywords`: Array of keywords for discovery

#### Dependencies
- `@eclipse-glsp/*`: GLSP framework versions
- `@theia/core`: Theia platform version
- `customDeps`: Additional custom dependencies

#### Diagram Configuration
- `type`: Diagram type (node-edge, compartment, port, hierarchical)
- `features`: Feature flags for diagram capabilities
  - `compartments`: Enable compartment support
  - `ports`: Enable port support
  - `routing`: Edge routing (manhattan, polyline, bezier)
  - `grid`: Show grid
  - `snapToGrid`: Snap elements to grid
  - `autoLayout`: Enable automatic layout
  - `animation`: Enable animations

#### Styling
- `theme`: Default theme (light, dark, auto)
- `defaultColors`: Color scheme for diagram elements
- `fonts`: Font configuration
- `nodeDefaults`: Default node dimensions and styling

#### Generation Options
- `outputStructure`: Directory structure (standard, flat, custom)
- `includeExamples`: Generate example models
- `generateTests`: Generate test files
- `generateDocs`: Generate documentation
- `templateOverrides`: Custom template paths

### Using Configuration

#### With Generate Command
```bash
# Uses .glsprc.json from current directory
glsp gen grammar.langium

# Specify config file
glsp gen grammar.langium --config ./config/.glsprc.json

# Override config values
glsp gen grammar.langium --set extension.version=2.1.167 --set styling.theme=dark
```

#### With Watch Mode
```bash
# Watch with config
glsp watch grammar.langium --config .glsprc.json
```

#### Configuration Discovery
The generator searches for `.glsprc.json`:
1. In the specified path (--config option)
2. In the current directory
3. In parent directories up to the root

### Examples

See `examples/` directory for configuration examples:
- `.glsprc.json` - Standard configuration
- `.glsprc.minimal.json` - Minimal configuration
- `.glsprc.advanced.json` - Advanced features with custom dependencies

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
```

### Development Mode

```bash
npm run dev            # TypeScript compiler in watch mode
```

## Templates

The generator uses Handlebars templates located in `src/templates/`. You can customize these templates to modify the generated code:

- `model.hbs`: Common model definitions
- `command-contribution.hbs`: Browser-side command contributions
- `diagram-configuration.hbs`: Diagram configuration
- `server-model.hbs`: Server-side model initialization
- `create-node-handler.hbs`: Node creation handlers
- `package-json.hbs`: Generated package.json
- `tsconfig.hbs`: Generated tsconfig.json

### Handlebars Helpers

The following helpers are available in templates:

- `toLowerCase`: Convert string to lowercase
- `toPascalCase`: Convert string to PascalCase
- `toCamelCase`: Convert string to camelCase
- `hasElements`: Check if array has elements
- `join`: Join array elements with separator
- `eq`, `neq`: Equality/inequality comparison
- `and`, `or`: Logical operations
- `unless`: Inverse of if

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Examples

The `examples/` directory contains a comprehensive set of Langium grammar examples:

### Basic Examples (`examples/basic/`)
- `state-machine.langium` - Simple finite state machine
- `workflow.langium` - Basic workflow/process language  
- `entity-model.langium` - Data modeling with entities and relationships
- `expression.langium` - Expression language with operators

### Advanced Examples (`examples/advanced/`)
- `hierarchical-fsm.langium` - Hierarchical state machines with regions
- `uml-class.langium` - UML-like class diagrams with full features
- `bpmn-subset.langium` - Business process modeling notation subset
- `component-system.langium` - Component-based architecture DSL

### Feature Showcases (`examples/features/`)
- `inheritance.langium` - Interface inheritance patterns
- `references.langium` - Cross-references and scoping examples
- `arrays-optionals.langium` - Array and optional property patterns
- `type-unions.langium` - Union types and type aliases
- `literals.langium` - String, number, boolean, and complex literals

### Edge Cases (`examples/edge-cases/`)
- `empty.langium` - Minimal valid grammar
- `large-grammar.langium` - Performance testing (100+ interfaces)
- `circular-refs.langium` - Circular reference handling
- `deep-inheritance.langium` - Deep inheritance chains
- `complex-unions.langium` - Nested union types

### Testing Examples

Test all examples:
```bash
npm run test:examples
# or
node scripts/test-all-examples.js
```

Generate from any example:
```bash
glsp gen examples/basic/state-machine.langium ./output
```

See `examples/COOKBOOK.md` for patterns and best practices.

## License

MIT
