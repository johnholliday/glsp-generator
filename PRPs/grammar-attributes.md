# Claude Code: Enhance glspgen with Grammar-Based Metadata Parsing

## Project Overview

I have a TypeScript project called `glspgen` that generates complete VSCode extensions implementing both Language Server Protocol (LSP) and Eclipse/GLSP diagram editors from Langium grammar files. The project currently generates basic extensions, but I need to enhance it to support grammar-embedded metadata that controls visual rendering and behavior.

## Current State

- Working TypeScript project using Langium API for grammar parsing
- Generates VSCode extensions with LSP support
- Basic GLSP/sprotty integration for diagram editing
- CLI interface for generation

## Enhancement Goal

Add support for JSDoc-style comments in Langium grammar files that specify GLSP rendering metadata. This metadata should drive the generation of sprotty model classes, views, styles, and extension configuration.

## Technical Requirements

### 1. Metadata Parsing System

**Create a metadata parser that extracts JSDoc comments from Langium grammars:**

- Parse grammar-level metadata (before `grammar` keyword)
- Parse rule-level metadata (before `ParserRule` definitions)
- Support predefined attribute groups (`@glsp-group workflow|dataflow|architecture|hierarchy|mathematical|minimal`)
- Support individual property annotations (`@glsp-node`, `@glsp-shape`, `@glsp-style`, etc.)
- Use Langium CST API to access comments while preserving source locations
- Handle malformed annotations gracefully with clear error messages

**Grammar-level annotations:**
```typescript
/**
 * @glsp-group workflow
 * @glsp-layout hierarchical TB
 * @glsp-theme primary=#2563eb secondary=#64748b
 */
grammar MyLanguage
```

**Rule-level annotations:**
```typescript
/**
 * @glsp-node process
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-style fill=#2563eb stroke=#1e40af strokeWidth=2
 * @glsp-port north input
 * @glsp-port south output multiple
 */
ProcessStep:
    'process' name=ID '{' steps+=Step* '}';
```

### 2. Configuration System

**Implement a hierarchical configuration system:**

- Predefined attribute groups with sensible defaults
- Grammar metadata overrides attribute group settings
- External config file support (JSON/YAML) for final overrides
- Type-safe configuration interfaces using TypeScript
- Configuration validation with helpful error messages

**Key configuration interfaces needed:**
- `GLSPGenConfig` (root configuration)
- `GLSPConfig` (GLSP-specific settings)
- `StylingConfig` (colors, typography, spacing, animations)
- `ElementConfig` (node types, edge types, ports)
- `LayoutConfig` (algorithms, direction, spacing)
- `PaletteConfig` (tool groups, shortcuts)

### 3. Sprotty/GLSP Generation

**Generate complete sprotty-based GLSP extensions:**

**Model Classes:**
- Generate TypeScript model classes extending `SNode`, `SEdge`, etc.
- Include proper feature sets based on metadata (`connectableFeature`, `selectFeature`, etc.)
- Generate model factory with type registration
- Support custom properties from grammar analysis

**View Components:**
- Generate sprotty view classes implementing `IView`
- Support different shapes (rectangle, circle, diamond, hexagon, custom)
- Generate SVG-based rendering using virtual DOM
- Include hover states, selection indicators, and port rendering
- Generate CSS classes for styling

**GLSP Client Integration:**
- Generate diagram configuration
- Tool palette with drag-and-drop support
- Context menu actions
- Command handlers for CRUD operations
- Layout algorithm integration

**VSCode Extension Structure:**
- Generate proper `package.json` with all dependencies
- Extension activation and language client setup
- Webview integration for diagram editor
- Commands for creating/opening diagrams
- File association for grammar-specific diagram files

### 4. Template System

**Implement a robust template generation system:**

- Use a templating engine (Handlebars or similar) for code generation
- Separate templates for different file types (TypeScript, CSS, JSON, etc.)
- Support template partials for reusable components
- Template inheritance for customization
- Generate clean, well-formatted code with proper imports

### 5. Enhanced CLI

**Extend the CLI with new capabilities:**

```bash
# Grammar-driven generation (metadata from grammar comments)
glspgen --grammar=workflow.langium --output=./my-extension

# With external config overrides
glspgen --grammar=workflow.langium --config=custom.json --output=./extension

# Legacy attribute group support (fallback)
glspgen --grammar=basic.langium --workflow --output=./extension

# Development mode with watch
glspgen --grammar=workflow.langium --output=./extension --watch

# Validation only
glspgen --grammar=workflow.langium --validate
```

## Implementation Specifications

### File Structure Enhancement

```
src/
├── metadata/
│   ├── parser.ts              # LangiumMetadataParser class
│   ├── config-types.ts        # Configuration interfaces
│   ├── attribute-groups.ts    # Predefined groups
│   └── validator.ts           # Configuration validation
├── generators/
│   ├── sprotty/
│   │   ├── model-generator.ts     # Generate SNode/SEdge classes
│   │   ├── view-generator.ts      # Generate IView implementations
│   │   ├── style-generator.ts     # Generate CSS
│   │   └── config-generator.ts    # Generate GLSP configuration
│   ├── extension/
│   │   ├── package-generator.ts   # Generate package.json
│   │   ├── activation-generator.ts # Generate extension.ts
│   │   └── webview-generator.ts   # Generate webview integration
│   └── templates/             # Handlebars templates
├── cli/
│   ├── commands.ts            # CLI command definitions
│   └── options.ts             # CLI option parsing
└── utils/
    ├── file-utils.ts          # File system operations
    └── langium-utils.ts       # Langium service helpers
```

### Key Implementation Requirements

1. **Langium Integration:**
   - Use `LangiumServices` for proper grammar loading
   - Access CST nodes via `$cstNode` properties
   - Navigate CST tree to find preceding comments
   - Handle grammar parsing errors gracefully

2. **Type Safety:**
   - All configuration should be strongly typed
   - Generate TypeScript declaration files
   - Validate configurations at build time
   - Provide IntelliSense support for config files

3. **Error Handling:**
   - Clear error messages with source locations
   - Validation of grammar annotations
   - Graceful degradation for missing metadata
   - Helpful suggestions for common mistakes

4. **Testing:**
   - Unit tests for metadata parsing
   - Integration tests for full generation pipeline
   - Sample grammars with various annotation patterns
   - Generated extension validation

5. **Documentation:**
   - JSDoc comments on all public APIs
   - README with usage examples
   - Grammar annotation reference
   - Configuration schema documentation

## Expected Deliverables

1. **Enhanced metadata parsing system** that extracts GLSP configuration from Langium grammar JSDoc comments
2. **Complete sprotty generation pipeline** that creates working GLSP diagram editors
3. **Robust configuration system** with predefined groups and external config support
4. **Updated CLI** with new options and better error handling
5. **Comprehensive test suite** covering the new functionality
6. **Documentation and examples** showing the new capabilities

## Code Quality Expectations

- Follow TypeScript best practices with strict type checking
- Use async/await consistently for file operations
- Implement proper error boundaries and validation
- Generate clean, readable code with consistent formatting
- Include comprehensive JSDoc documentation
- Follow existing project conventions and structure

## Integration Notes

- Maintain backward compatibility with existing functionality
- Use existing Langium service setup and patterns
- Integrate with current template system if present
- Preserve existing CLI options and behavior
- Ensure generated extensions work with latest VSCode/sprotty versions

This enhancement should transform glspgen from a basic generator into a comprehensive tool that makes creating domain-specific visual languages as simple as writing a grammar with appropriate annotations.