# Prompt 006: Documentation Generator

## Objective
Automatically generate comprehensive documentation from Langium grammars, including README files, API documentation, visual grammar diagrams, and example model files.

## Background
Generated extensions lack documentation. Users need to manually create READMEs, API docs, and examples. Automated documentation generation would improve adoption and usability.

## Requirements

### 1. README Generation
Generate `README.md` with:
- Extension overview
- Installation instructions
- Language syntax guide
- Model examples
- API reference links
- Contributing guidelines
- Diagram screenshots

### 2. API Documentation
Generate TypeScript API docs:
- Interface documentation
- Type definitions
- Property descriptions
- Usage examples
- JSDoc comments
- Markdown API reference

### 3. Grammar Railroad Diagrams
Generate visual syntax diagrams:
- SVG railroad diagrams
- Interactive HTML version
- PNG exports for docs
- Syntax highlighting
- Clickable navigation

### 4. Example Model Files
Generate example files:
- Showcase all language features
- Simple to complex examples
- Valid model files
- Inline comments
- Test data for users

### 5. Language Server Protocol Docs
Document LSP features:
- Supported capabilities
- Custom commands
- Validation rules
- Code actions
- Completion items

### 6. Visual Documentation
Generate visual aids:
- Grammar structure diagram
- Inheritance hierarchy
- Reference relationships
- Example model visualizations

## Implementation Details

### Documentation Structure
```
generated-extension/
├── README.md                    # Main documentation
├── docs/
│   ├── api/
│   │   ├── index.md            # API overview
│   │   ├── interfaces.md       # Interface docs
│   │   └── types.md            # Type docs
│   ├── grammar/
│   │   ├── railroad.html       # Interactive diagrams
│   │   ├── syntax.md           # Syntax guide
│   │   └── diagrams/           # SVG/PNG files
│   ├── examples/
│   │   ├── basic.model         # Basic example
│   │   ├── advanced.model      # Complex example
│   │   └── tutorial.md         # Step-by-step guide
│   └── images/
│       ├── screenshot.png      # Extension screenshot
│       └── architecture.svg    # Architecture diagram
```

### README Template
```markdown
# {{extension.displayName}}

{{extension.description}}

## Installation

\`\`\`bash
yarn add {{extension.name}}
\`\`\`

## Language Overview

{{#each interfaces}}
### {{name}}

{{description}}

**Properties:**
{{#each properties}}
- `{{name}}`: {{type}}{{#if optional}} (optional){{/if}} - {{description}}
{{/each}}

{{/each}}

## Quick Start

\`\`\`{{languageId}}
{{quickStartExample}}
\`\`\`

## Examples

See the [examples directory](./docs/examples/) for more complex models.

## API Documentation

Full API documentation is available at [docs/api/](./docs/api/).

## Grammar Visualization

Interactive grammar railroad diagrams: [docs/grammar/railroad.html](./docs/grammar/railroad.html)
```

### Railroad Diagram Generation
```typescript
interface RailroadGenerator {
  generateDiagram(grammar: GrammarAST): {
    svg: string;
    html: string;
    png: Buffer;
  };
  
  generateRuleDiagram(rule: Rule): SVGElement;
  generateHTMLViewer(diagrams: SVGElement[]): string;
}
```

## Acceptance Criteria

1. ✅ Comprehensive README generated
2. ✅ API documentation with examples
3. ✅ Visual railroad diagrams
4. ✅ Working example files
5. ✅ Screenshots and visual aids
6. ✅ Documentation is searchable
7. ✅ Links between doc sections work

## Testing Requirements

Create tests in `src/documentation/`:
- Test README generation
- Test API doc extraction
- Test railroad diagram generation
- Test example generation
- Validate markdown output
- Check link validity

## Files to Create/Modify

1. `src/documentation/readme-generator.ts`
2. `src/documentation/api-generator.ts`
3. `src/documentation/railroad-generator.ts`
4. `src/documentation/example-generator.ts`
5. `src/documentation/templates/` - Doc templates
6. `src/generator.ts` - Add doc generation option
7. Update CLI with `--docs` flag

## Dependencies
- None (but complements all other enhancements)

## Notes
- Consider using TypeDoc for API generation
- Railroad diagrams could use railroad-diagrams library
- Documentation should be version-controlled
- Could later support custom doc templates
- Consider generating Docusaurus site
