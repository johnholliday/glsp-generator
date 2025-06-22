# CLAUDE.md
This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Yarn Version Management

### Critical Version Requirements
- **GLSP Generator Project**: Uses Yarn Berry (v3+) exclusively
  - Modern Yarn with Plug'n'Play (PnP) support
  - `.yarnrc.yml` configuration
  - Zero-installs capability
  
- **Generated Theia Extensions**: MUST use Yarn Classic v1.22
  - Theia framework requires Yarn 1.x
  - Generated `package.json` must be compatible with Yarn 1.22
  - No Yarn Berry features in generated code
  - Use `node_modules` approach, not PnP

### Yarn Usage Guidelines
```powershell
# For GLSP Generator development (Yarn Berry) - PowerShell
yarn install          # Install dependencies
yarn add <package>    # Add new dependency
yarn dlx <command>    # Run one-off commands

# Commands in generated extensions (Yarn 1.22)
# These must work in generated package.json:
yarn install          # Classic install to node_modules
yarn add <package>    # Classic dependency addition
yarn run <script>     # Run scripts
npx <command>         # Use npx, not yarn dlx
```

### Generated package.json Requirements
The generated package.json must be fully compatible with these Yarn 1.22 commands in PowerShell:
- `yarn install` - Install all dependencies
- `yarn build` - Build the extension
- `yarn clean` - Clean build artifacts (use rimraf for cross-platform)
- `yarn watch` - Watch mode (if applicable)
- `yarn lint` - Run linting (if applicable)

### Strict Yarn Version Adherence
Claude Code MUST follow these rules without exception:

1. **GLSP Generator Development** (this project):
   - Use Yarn Berry commands and features
   - Leverage PnP, zero-installs, and modern Yarn capabilities
   - Update `.yarnrc.yml` for configuration

2. **Generated Extension Code**:
   - MUST be 100% compatible with Yarn 1.22
   - NO Yarn Berry features whatsoever
   - Classic `yarn install` must work perfectly
   - Use traditional `node_modules` structure
   - Include `.yarnrc` (not `.yarnrc.yml`) if needed

3. **Template Validation**:
   - Test generated extensions with Yarn 1.22
   - Ensure all dependencies resolve correctly
   - Verify Theia can build the extension

### Common Mistakes to Avoid
- ❌ Using `yarn dlx` in generated scripts
- ❌ Workspace protocol (`workspace:*`) in generated package.json
- ❌ PnP references in generated code
- ❌ `.yarnrc.yml` in generated extensions
- ✅ Use `npx` instead of `yarn dlx` in generated code
- ✅ Use exact versions or ranges in dependencies
- ✅ Traditional scripts that work with Yarn 1.x

## Directory Structure
```
glsp-generator/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── index.ts              # Library exports
│   ├── generator.ts          # Core generation orchestration
│   ├── types/
│   │   └── grammar.ts        # TypeScript interfaces for grammar AST
│   ├── utils/
│   │   ├── langium-ast-parser.ts  # Modern AST parser (preferred)
│   │   ├── langium-parser.ts      # Legacy parser (deprecating)
│   │   └── handlebars-helpers.ts  # Template helper functions
│   └── templates/            # Handlebars templates
│       ├── browser/
│       ├── common/
│       └── server/
├── dist/                     # Compiled output (git-ignored)
├── test/                     # Test fixtures and data
├── scripts/                  # Utility scripts (Claude Code outputs here)
├── history/                  # Claude Code action documentation
├── prompts/                  # Enhancement implementation prompts
│   ├── README.md            # Prompt index and status
│   └── prompt-*.md          # Individual enhancement prompts
├── package.json
├── tsconfig.json
├── vitest.config.ts          # Vitest configuration
├── CLAUDE.md                 # This file
├── TESTPLAN.md              # Test documentation (maintained by Claude)
└── README.md
```

## Essential Commands
**Note**: All commands use Yarn Berry (v3+) for the GLSP Generator project itself.

### Package Manager Rules
**IMPORTANT**: This project uses Yarn exclusively. Never use npm commands.
- ✅ Use `yarn` for all dependency management
- ✅ Use `yarn install` to install dependencies
- ✅ Use `yarn add <package>` to add new dependencies
- ✅ Use `yarn remove <package>` to remove dependencies
- ❌ Never use `npm install` or `npm run`
- ❌ Never create or commit `package-lock.json`
- ✅ If a `package-lock.json` exists, delete it immediately

### Build and Development
```powershell
# Install dependencies (uses Yarn Berry)
yarn install

# Build the project (compiles TypeScript and copies templates)
yarn build

# Development mode (watch for changes and rebuild)
yarn dev

# Clean build directory (PowerShell)
Remove-Item -Recurse -Force dist; yarn build
# Or use cross-platform rimraf (if installed)
yarn rimraf dist && yarn build

# Run tests with Vitest
yarn test

# Run tests with coverage (aim for 100%)
yarn test:coverage

# Run tests in watch mode
yarn test:watch

# Run specific test file (PowerShell paths)
yarn test src\utils\langium-ast-parser.test.ts

# Or with forward slashes (also works)
yarn test src/utils/langium-ast-parser.test.ts

# Run tests with UI (opens browser)
yarn test:ui

# Update TESTPLAN.md after test changes
# (Claude must do this automatically)
```

### CLI Usage
```powershell
# Generate a GLSP extension from a Langium grammar
node dist/cli.js generate <grammar-file> -o <output-dir>

# Example with real file (PowerShell paths)
node dist/cli.js generate .\examples\statemachine.langium -o .\output\statemachine-glsp

# Validate a grammar file
node dist/cli.js validate <grammar-file>

# Generate with validation only (no file generation)
node dist/cli.js generate <grammar-file> --validate-only

# Skip validation (use with caution)
node dist/cli.js generate <grammar-file> --no-validate

# Migration Commands
# Migrate from ANTLR4
node dist/cli.js migrate grammar.g4

# Migrate from Xtext
node dist/cli.js migrate grammar.xtext output.langium

# Extract grammar from GLSP project
node dist/cli.js migrate ./my-glsp-project -t glsp-project

# Use interactive migration wizard
node dist/cli.js migrate -i

# Check for generator updates
node dist/cli.js upgrade --check

# Upgrade to latest version
node dist/cli.js upgrade

# Upgrade with automatic fixes
node dist/cli.js upgrade --fix
```

## Architecture and Code Structure

### Core Architecture Flow
```
1. Grammar File (.langium) → 2. Parser (AST) → 3. Type System → 4. Generator → 5. Templates → 6. Output Files
```

### Key Components

#### Entry Points
- **src/cli.ts**: Command-line interface executable
  - Handles argument parsing using commander
  - Provides user-friendly error messages
  - Manages file I/O operations

- **src/index.ts**: Library exports for programmatic use
  ```typescript
  export { generateGLSPExtension } from './generator';
  export * from './types/grammar';
  ```

#### Parser System
- **src/utils/langium-ast-parser.ts**: Modern AST-based parser
  - Uses Langium's official createLangiumGrammarServices()
  - Handles grammar validation
  - Returns structured GrammarAST
  
- **src/utils/langium-parser.ts**: Legacy parser (being phased out)
  - Manual parsing implementation
  - Keep for backward compatibility only

#### Type System (src/types/grammar.ts)
```typescript
interface GrammarAST {
  name: string;
  imports: Import[];
  rules: Rule[];
  interfaces: Interface[];
  types: TypeAlias[];
}

interface Property {
  name: string;
  type: PropertyType;
  isOptional: boolean;
  isArray: boolean;
  isReference: boolean;
}
```

#### Generator (src/generator.ts)
- Orchestrates the entire generation process
- Manages template rendering
- Handles file system operations
- Key functions:
  ```typescript
  generateGLSPExtension(grammarPath: string, outputDir: string): Promise<void>
  validateGrammar(ast: GrammarAST): ValidationResult
  renderTemplates(ast: GrammarAST, outputDir: string): Promise<void>
  ```

#### Migration System (src/migration/)
- **antlr-converter.ts**: Converts ANTLR4 grammars (.g4) to Langium
  - Parses ANTLR grammar structure
  - Converts parser/lexer rules
  - Preserves semantic actions as comments
  
- **xtext-converter.ts**: Converts Xtext grammars to Langium
  - Handles Xtext-specific syntax
  - Converts metamodel declarations
  - Maps terminal and data type rules
  
- **glsp-analyzer.ts**: Analyzes existing GLSP TypeScript projects
  - Extracts interfaces and types using TypeScript compiler API
  - Detects common GLSP patterns
  - Generates Langium grammar from extracted types
  
- **upgrade-assistant.ts**: Helps upgrade between generator versions
  - Applies automated fixes for breaking changes
  - Creates backups before upgrading
  - Provides upgrade recommendations
  
- **migration-wizard.ts**: Interactive migration tool
  - Guides users through migration process
  - Auto-detects source format
  - Previews conversion results

### Template System

#### Template Directory Structure
```
templates/
├── browser/
│   ├── command-contribution.hbs
│   ├── diagram-configuration.hbs
│   └── frontend-module.hbs
├── common/
│   ├── model-types.hbs
│   └── protocol.hbs
├── server/
│   ├── model-factory.hbs
│   ├── node-handlers.hbs
│   └── server-module.hbs
└── package.json.hbs          # MUST generate Yarn 1.22 compatible output
```

#### Template Compatibility Rules
- No Yarn Berry specific features in generated code
- Use `dependencies` and `devDependencies` (not `peerDependencies` meta)
- Scripts must use Yarn 1.x syntax
- No workspace protocol references
- Traditional `node_modules` resolution

#### Available Handlebars Helpers
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
unless(condition: any, options: any): string
```

#### Template Usage Example
```handlebars
{{#each interfaces}}
export interface {{toPascalCase name}}Node extends GNode {
  {{#each properties}}
  {{#if isOptional}}{{name}}?: {{type}};{{else}}{{name}}: {{type}};{{/if}}
  {{/each}}
}
{{/each}}
```

## Generated Extension Structure

### Output Directory Layout
```
output/
├── browser/
│   ├── command-contribution.ts
│   ├── diagram-configuration.ts
│   └── frontend-module.ts
├── common/
│   ├── model-types.ts
│   └── protocol.ts
├── server/
│   ├── model-factory.ts
│   ├── node-handlers.ts
│   └── server-module.ts
├── package.json              # MUST be Yarn 1.22 compatible
├── .yarnrc                  # Yarn 1.x configuration (if needed)
└── tsconfig.json
```

### Generated package.json Requirements
```json
{
  "name": "@example/extension",
  "version": "0.1.0",
  "engines": {
    "node": ">=14.0.0",
    "yarn": "1.x"
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf lib",
    "prepare": "yarn clean && yarn build"
  },
  "dependencies": {
    "@eclipse-glsp/server": "^1.0.0",
    "@theia/core": "^1.30.0"
  }
}
```

### Integration Points
- **Theia Integration**: Via frontend-module.ts using Inversify bindings
- **GLSP Client**: Diagram configuration and command contributions
- **GLSP Server**: Model factory and node handlers
- **Sprotty**: Diagram rendering engine integration
- **Yarn 1.22**: All generated code must work with classic Yarn

## Development Guidelines

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
```

### Coding Conventions
- Use ES modules exclusively (`import`/`export`)
- Async/await over callbacks
- Functional programming patterns where appropriate
- Immutable data structures preferred
- Early returns for error conditions
- Descriptive variable names (no single letters except loop indices)
- **Path handling**: Always use `path.join()` or `path.resolve()` for cross-platform compatibility
- **File URLs**: Use `pathToFileURL()` from 'url' module when needed
- **Never hardcode**: Path separators (`/` or `\`), use Node.js path module

### Error Handling Patterns
```typescript
// Preferred pattern (works everywhere)
try {
  const ast = await parseGrammar(grammarPath);
  if (!ast) {
    throw new Error(`Failed to parse grammar: ${grammarPath}`);
  }
  // Continue processing
} catch (error) {
  console.error('Generation failed:', error);
  process.exit(1);  // Works in both PowerShell and WSL
}
```

## Testing Requirements

### Automatic Test Creation
Claude Code MUST create Vitest tests for every new or modified functionality:
- **File naming**: For every `src/<name>.ts` file, create `src/<name>.test.ts`
- **Coverage requirement**: Aim for 100% code coverage
- **Test categories**:
  - Unit tests for all utilities and helpers
  - Integration tests for parser and generator
  - Snapshot tests for template outputs
  - Error case tests for validation logic

### Test Structure Template
```typescript
// src/utils/example.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exampleFunction } from './example';

describe('exampleFunction', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  it('should handle normal case', () => {
    expect(exampleFunction('input')).toBe('expected');
  });

  it('should throw error for invalid input', () => {
    expect(() => exampleFunction(null)).toThrow('Invalid input');
  });

  it('should handle edge cases', () => {
    expect(exampleFunction('')).toBe('');
  });

  // Mocking example
  it('should mock dependencies', () => {
    const mockFn = vi.fn().mockReturnValue('mocked');
    expect(mockFn()).toBe('mocked');
  });
});
```

### TESTPLAN.md Management
Claude Code MUST maintain a `TESTPLAN.md` file in the project root that includes:
- Overview of all test suites
- Step-by-step instructions for running each test
- Expected outcomes for each test
- Coverage reports interpretation
- Troubleshooting guide

### TESTPLAN.md Structure Template
```markdown
# Test Plan for GLSP Generator

## Overview
Total test suites: X
Total test cases: Y
Current coverage: Z%
Last updated: YYYY-MM-DD

## Quick Commands (PowerShell)
- Run all tests: `yarn test`
- Run with coverage: `yarn test:coverage`
- Watch mode: `yarn test:watch`
- Run with UI: `yarn test:ui`
- Specific file: `yarn test src\utils\langium-ast-parser.test.ts`

## Test Suites

### 1. Parser Tests
**File**: `src/utils/langium-ast-parser.test.ts`
**Purpose**: Validates grammar parsing functionality
**Test count**: X tests
**Coverage**: 100%
**Key scenarios**:
- Valid grammar parsing
- Invalid grammar detection
- Edge cases (empty files, large files)
**Run**: `yarn test src\utils\langium-ast-parser.test.ts`

### 2. Generator Tests
[Similar structure for each test suite]

## Coverage Report Interpretation
- Statements: Should be 95%+
- Branches: Should be 90%+
- Functions: Should be 100%
- Lines: Should be 95%+

## Adding New Tests
1. Create test file next to source file
2. Follow naming convention: `<filename>.test.ts`
3. Update this document
4. Run coverage to ensure no regression

## Troubleshooting (PowerShell)
- Mock file system issues: Check `jest.config.js` setupFiles
- Path issues: Use forward slashes in Jest config
- Async test timeouts: Increase timeout in specific tests
- Coverage gaps: Run `yarn test --coverage` to identify untested code
- Windows-specific issues: Ensure cross-platform path handling
```

Claude must update this file every time tests are added, modified, or removed.

### Automatic Test Creation Examples

#### When Adding a New Utility Function
```typescript
// src\utils\string-helpers.ts (Windows path)
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// Claude MUST immediately create:
// src\utils\string-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { toKebabCase } from './string-helpers';  // Use forward slash in imports

describe('toKebabCase', () => {
  it('should convert PascalCase to kebab-case', () => {
    expect(toKebabCase('PascalCase')).toBe('-pascal-case');
  });
  
  it('should handle empty strings', () => {
    expect(toKebabCase('')).toBe('');
  });
  
  it('should handle already kebab-case strings', () => {
    expect(toKebabCase('already-kebab')).toBe('already-kebab');
  });
});

// And update TESTPLAN.md:
### String Helpers Tests
**File**: `src\utils\string-helpers.test.ts`
**Added**: 2025-06-19
**Functions tested**: toKebabCase
**Run**: `yarn test src\utils\string-helpers.test.ts`
```

#### When Modifying Existing Code
- Update existing tests to cover new behavior
- Add tests for new edge cases
- Update TESTPLAN.md with changes
- Ensure coverage remains at or near 100%

### Testing Strategy
- Unit tests for parsers and utilities
- Integration tests for full generation pipeline
- Snapshot tests for template output
- Test file naming: `*.test.ts` or `*.spec.ts`
- Mock file system operations in tests
- Use Vitest's built-in mocking capabilities (vi.mock, vi.fn, vi.spyOn)

## Grammar Support

### Supported Langium Constructs
```langium
// Interfaces with single inheritance
interface Node extends BaseNode {
  name: string
  children: Node[]
  parent?: @Node  // Reference with @ symbol
}

// Type aliases and unions
type NodeType = 'task' | 'gateway' | 'event'
type Element = Node | Edge

// Property modifiers
interface Example {
  required: string      // Required property
  optional?: string     // Optional with ?
  array: string[]       // Array with []
  reference: @Node      // Reference with @
}

// Built-in types
type Primitives = string | number | boolean | Date
```

### Grammar Validation Rules
1. Interface names must be unique
2. Circular inheritance is not allowed
3. Property names must be unique within an interface
4. Referenced types must exist
5. Reserved keywords cannot be used as names

## Common Issues and Solutions

### Build Issues
- **Templates not found**: Ensure `yarn build` was run to copy templates
- **Module not found**: Check `"type": "module"` in package.json
- **Import errors**: Use `.js` extensions in relative imports
- **Path errors**: Use forward slashes in imports even on Windows
- **Script errors**: Ensure scripts use cross-platform commands

### Parser Issues
- **Invalid grammar**: Run validate command first
- **Unsupported construct**: Check supported constructs list
- **Memory issues**: Increase Node heap size with `--max-old-space-size`

### Generation Issues
- **File permissions**: Ensure write access to output directory
- **Template errors**: Check Handlebars syntax and helper usage
- **Type conflicts**: Verify no duplicate type definitions

## Performance Considerations
- Grammar files > 1000 lines may require increased memory
- Template rendering is synchronous - consider chunking for large outputs
- File I/O is the primary bottleneck - use SSD for best performance

## Debugging Tips
```powershell
# Enable verbose logging (PowerShell)
$env:DEBUG="glsp-generator:*"; node dist/cli.js generate ...

# Check parsed AST structure (PowerShell)
node -e "console.log(JSON.stringify(require('./dist/utils/langium-ast-parser').parseGrammar('grammar.langium'), null, 2))"

# Validate templates manually
npx handlebars templates/browser/command-contribution.hbs -D '{\"name\":\"Test\"}'

# Run with Node.js debugging
node --inspect dist/cli.js generate <grammar-file>
```

## Extension Development Workflow
1. Define your language in a `.langium` file
2. Validate the grammar: `node dist/cli.js validate my-language.langium`
3. Generate the extension: `node dist/cli.js generate my-language.langium -o .\my-extension`
4. Navigate to output: `cd my-extension`
5. Install dependencies: `yarn install` (uses Yarn 1.22)
6. Build the extension: `yarn build`
7. Test in Theia: `yarn theia start`

**Note**: All commands above work in PowerShell. Use backslashes for Windows paths or forward slashes (both work).

## API Reference
See `src/index.ts` for public API exports. Main function:
```typescript
generateGLSPExtension(
  grammarPath: string,
  outputDir: string,
  options?: {
    validate?: boolean;
    verbose?: boolean;
  }
): Promise<void>
```

## PowerShell/Windows Compatibility Requirements

### Command Syntax
- **Use PowerShell syntax** in all documentation and examples
- **Path separators**: Use backslashes `\` or forward slashes `/` (both work in PowerShell)
- **Environment variables**: Use `$env:VAR_NAME` not `export VAR_NAME`
- **File operations**: Use PowerShell cmdlets or cross-platform Node.js packages

### Cross-Platform Scripts
When creating scripts in the `scripts/` folder:
1. **Preferred**: Node.js scripts (.js/.ts) that work everywhere
2. **Windows-specific**: PowerShell scripts (.ps1) when needed
3. **Avoid**: Bash scripts (.sh) unless specifically requested

### Common Command Translations
```powershell
# Instead of: rm -rf dist
Remove-Item -Recurse -Force dist
# Or better: yarn rimraf dist

# Instead of: cp -r src dest
Copy-Item -Recurse src dest
# Or better: Use Node.js fs.cpSync

# Instead of: export DEBUG=*
$env:DEBUG="*"

# Instead of: ./script.sh
.\script.ps1
# Or: node script.js

# Instead of: cat file.txt
Get-Content file.txt
# Or: type file.txt
```

### File Encoding and Line Endings
- **Line endings**: Use CRLF for Windows compatibility (configure in `.gitattributes`)
- **File encoding**: UTF-8 without BOM
- **Script files**: Ensure `.ps1` files have proper encoding for PowerShell
- **Template files**: Maintain consistent line endings in Handlebars templates

### Package.json Scripts
Ensure all npm/yarn scripts work in PowerShell:
```json
{
  "scripts": {
    "clean": "rimraf dist",  // Cross-platform
    "build": "tsc && node scripts/copy-templates.js",  // Not bash-specific
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "dev": "tsc --watch",
    "copy-templates": "node scripts/copy-templates.js",  // Not cp -r
    "prebuild": "yarn clean",
    "postbuild": "yarn copy-templates"
  }
}
```

**Note**: Avoid `&&` chaining that relies on bash behavior. Use `prebuild`/`postbuild` hooks or Node.js scripts for complex operations.

## Claude Code File Organization Rules

### Script Management
- **All utility scripts** created by Claude Code must be placed in the `scripts/` folder
- Create the `scripts/` folder if it doesn't exist
- Scripts should be PowerShell-compatible (.ps1) or cross-platform (.js/.ts)
- Do not create bash scripts (.sh) unless specifically requested
- Script naming convention: `<action>-<target>.ps1` or `<action>-<target>.js`
- Examples:
  - `scripts/analyze-grammar.js` (cross-platform Node.js script)
  - `scripts/cleanup-dist.ps1` (PowerShell script)
  - `scripts/validate-templates.js` (cross-platform Node.js script)
- Prefer Node.js scripts for cross-platform compatibility
- Use PowerShell scripts only when Windows-specific functionality is needed

### Documentation and History
- **All generated documentation** explaining Claude's actions must be placed in the `history/` folder
- Create the `history/` folder if it doesn't exist
- Use timestamp prefixes for history files: `YYYY-MM-DD-<description>.md`
- Examples:
  - `history/2025-06-19-refactoring-parser.md`
  - `history/2025-06-19-template-updates.md`
- **Root-level .md files allowed**: Only README.md, CLAUDE.md, and TESTPLAN.md
- Do not create other loose `.md` files in the project root

### Enhancement Prompts
- **Feature implementation prompts** are stored in the `prompts/` folder
- These are NOT instructions for Claude Code, but implementation requests
- Each prompt is a self-contained enhancement request
- Use prompts sequentially based on priority and dependencies
- Update `prompts/README.md` status when implementing prompts

### Git Considerations
- `scripts/` folder: Generally should be committed (contains useful utilities)
- `history/` folder: Consider adding to `.gitignore` if used for local reference only
- Always review generated scripts before committing

### Folder Structure with Claude Additions
```
glsp-generator\
├── src\                      # Source code only
├── dist\                     # Compiled output (git-ignored)
├── test\                     # Test files
├── scripts\                  # Utility scripts created by Claude
│   ├── analyze-grammar.js    # Cross-platform Node.js script
│   ├── cleanup-dist.ps1      # PowerShell script (if needed)
│   └── validate-templates.js # Cross-platform Node.js script
├── history\                  # Claude action documentation
│   ├── 2025-06-19-refactoring-parser.md
│   └── 2025-06-19-template-updates.md
├── prompts\                  # Enhancement implementation prompts
│   ├── README.md            # Prompt index and status tracking
│   ├── prompt-001-template-validation.md
│   ├── prompt-002-grammar-test-suite.md
│   └── ... (13 total enhancement prompts)
├── package.json
├── CLAUDE.md                 # This file
├── TESTPLAN.md              # Test documentation
└── README.md                 # Project documentation
```

**Note**: Paths shown with backslashes for Windows. Forward slashes also work in PowerShell and are preferred in code for cross-platform compatibility.

## Contributing Guidelines
- **Always create tests** for new functionality before committing
- Update TESTPLAN.md when adding or modifying tests
- Run full test suite with coverage: `yarn test --coverage`
- Update this CLAUDE.md file when adding new features or making structural changes
- Follow existing code patterns
- Document complex algorithms
- Keep utility scripts organized in `scripts/`
- Document significant changes in `history/`
- Ensure generated code is Yarn 1.22 compatible

## Related Documentation
- [Langium Documentation](https://langium.org/)
- [Eclipse GLSP](https://www.eclipse.org/glsp/)
- [Theia IDE](https://theia-ide.org/)
- [Handlebars Templates](https://handlebarsjs.com/)
- [Yarn Classic (v1) Documentation](https://classic.yarnpkg.com/)
- [Yarn Berry Documentation](https://yarnpkg.com/)

## Quick Reference for Claude

### Must Do
- ✅ Use Yarn exclusively (never npm)
- ✅ Create Vitest tests for every new function
- ✅ Update TESTPLAN.md with every test change
- ✅ Place utility scripts in `scripts/`
- ✅ Place documentation in `history/`
- ✅ Use Yarn Berry for GLSP Generator
- ✅ Generate Yarn 1.22 compatible code
- ✅ Write PowerShell-compatible commands and scripts
- ✅ Use cross-platform Node.js scripts when possible
- ✅ Delete `package-lock.json` if found

### Must Not Do
- ❌ Use npm commands (always use yarn)
- ❌ Create or commit package-lock.json
- ❌ Create .md files in root (except allowed ones)
- ❌ Use Yarn Berry features in generated code
- ❌ Skip test creation for any functionality
- ❌ Leave TESTPLAN.md out of date
- ❌ Mix Yarn versions in templates
- ❌ Create scripts outside `scripts/` folder
- ❌ Use bash/WSL-specific commands in documentation
- ❌ Create .sh scripts (unless specifically requested)