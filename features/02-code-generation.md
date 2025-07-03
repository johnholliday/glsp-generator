# Code Generation Feature

## Overview
The Code Generation feature is the core functionality that transforms parsed Langium grammars into complete GLSP extensions. It uses a template-based approach to generate TypeScript code for both client and server components.

## Purpose
- Generate complete GLSP extension from grammar AST
- Create browser, server, and common modules
- Produce ready-to-use TypeScript code
- Support customization through templates

## Current Implementation

### Components
1. **Main Generator** (`src/generator.ts`)
   - Orchestrates the generation process
   - Manages template rendering
   - Handles file system operations
   - Validates output structure

2. **Template System** (`src/templates/`)
   - Handlebars-based templates
   - Organized by module (browser/server/common)
   - Supports custom helpers
   - Generates Yarn 1.22 compatible package.json

3. **Template Loader** (`src/templates/template-loader.ts`)
   - Loads and caches templates
   - Validates template syntax
   - Manages template dependencies

### Generated Structure
```
output/
├── browser/
│   ├── command-contribution.ts      # Command palette integration
│   ├── diagram-configuration.ts     # Diagram setup and styling
│   └── frontend-module.ts          # Inversify bindings
├── common/
│   ├── model-types.ts              # Shared type definitions
│   └── protocol.ts                 # Client-server protocol
├── server/
│   ├── model-factory.ts            # Model element creation
│   ├── node-handlers.ts            # Element-specific handlers
│   └── server-module.ts            # Server bindings
├── package.json                    # Yarn 1.22 compatible
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Generated documentation
```

## Technical Details

### Template System
- **Engine**: Handlebars 4.x
- **Custom Helpers**:
  ```typescript
  // String manipulation
  toLowerCase(str: string): string
  toPascalCase(str: string): string  // "my-name" → "MyName"
  toCamelCase(str: string): string   // "my-name" → "myName"
  
  // Collection helpers
  hasElements(array: any[]): boolean
  join(array: any[], separator: string): string
  
  // Logical helpers
  eq(a: any, b: any): boolean
  neq(a: any, b: any): boolean
  and(...args: any[]): boolean
  or(...args: any[]): boolean
  ```

### Code Generation Process
1. **Validation**: Verify grammar AST is valid
2. **Preparation**: Create output directory structure
3. **Template Rendering**: Process each template with context
4. **Post-Processing**: Format code, add imports
5. **Package Setup**: Generate package.json and configs

### Generated Code Features
- **Type Safety**: Full TypeScript with strict mode
- **Dependency Injection**: Inversify-based architecture
- **Protocol Handling**: JSON-RPC communication
- **Model Management**: Factory pattern for elements
- **Command System**: VSCode command integration
- **Styling Support**: CSS-in-JS capabilities

## Usage Example
```typescript
const generator = new GLSPGenerator();

// Validate grammar first
const isValid = await generator.validateGrammar(grammarPath);
if (!isValid) {
  throw new Error('Invalid grammar');
}

// Generate extension
const result = await generator.generateExtension(
  grammarPath,
  outputDir,
  {
    generateDocs: true,
    generateTests: true,
    packageManager: 'yarn'
  }
);

console.log(`Generated ${result.filesGenerated.length} files`);
```

## Configuration Options
```typescript
interface GenerationOptions {
  // Feature flags
  generateDocs?: boolean
  generateTests?: boolean
  generateTypeSafety?: boolean
  generateCICD?: boolean
  
  // Customization
  templatePath?: string
  packageManager?: 'yarn' | 'npm'
  
  // Output control
  force?: boolean          // Overwrite existing files
  validateOnly?: boolean   // Only validate, don't generate
}
```

## Template Examples

### Model Type Template
```handlebars
{{#each interfaces}}
export interface {{toPascalCase name}}Node extends GNode {
  {{#each properties}}
  {{#if isOptional}}{{name}}?: {{type}};{{else}}{{name}}: {{type}};{{/if}}
  {{/each}}
}
{{/each}}
```

### Command Contribution Template
```handlebars
@injectable()
export class {{toPascalCase projectName}}CommandContribution implements CommandContribution {
  registerCommands(commands: CommandRegistry): void {
    {{#each commands}}
    commands.registerCommand({
      id: '{{id}}',
      label: '{{label}}'
    });
    {{/each}}
  }
}
```

## Performance Considerations
- Template rendering is synchronous
- File I/O is the primary bottleneck
- Consider parallel processing for large projects
- Template caching improves repeated generation

## Future Enhancements
1. **Incremental Generation**: Only regenerate changed files
2. **Custom Templates**: User-provided template support
3. **Multiple Output Formats**: Support other frameworks
4. **Code Formatting**: Integrated prettier support
5. **Source Maps**: Link generated code to grammar

## Dependencies
- `handlebars`: Template engine
- `fs-extra`: Enhanced file system operations
- `chalk`: Terminal styling
- `ora`: Progress indicators

## Testing
- Unit tests for each template
- Integration tests for complete generation
- Snapshot tests for generated output
- Cross-platform compatibility tests

## Related Features
- [Template Management](./13-template-management.md)
- [Configuration System](./04-configuration.md)
- [Type Safety](./07-type-safety.md)