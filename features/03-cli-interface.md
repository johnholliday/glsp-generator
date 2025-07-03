# Command-Line Interface (CLI) Feature

## Overview
The CLI provides a comprehensive command-line interface for the GLSP Generator, offering multiple commands for generation, validation, development, and maintenance tasks. Built with Yargs, it provides a user-friendly experience with detailed help, examples, and interactive modes.

## Purpose
- Provide accessible command-line interface for all features
- Support both one-off generation and continuous development
- Enable automation and CI/CD integration
- Offer interactive guidance for new users

## Current Implementation

### Main Commands

#### 1. **generate** (alias: gen)
Generate GLSP extension from grammar file
```bash
glsp-generator generate <grammar-file> [options]
```

#### 2. **validate**
Validate grammar file without generation
```bash
glsp-generator validate <grammar-file> [options]
```

#### 3. **watch**
Auto-regenerate on file changes with live reload
```bash
glsp-generator watch <grammar-file> [options]
```

#### 4. **new**
Create new DSL project from templates
```bash
glsp-generator new <project-name> [options]
```

#### 5. **init**
Initialize configuration in current directory
```bash
glsp-generator init [options]
```

#### 6. **docs**
Generate documentation for DSL
```bash
glsp-generator docs <grammar-file> [options]
```

#### 7. **cicd**
Generate CI/CD workflows
```bash
glsp-generator cicd [options]
```

#### 8. **test**
Generate test infrastructure
```bash
glsp-generator test <grammar-file> [options]
```

#### 9. **benchmark**
Run performance benchmarks
```bash
glsp-generator benchmark <grammar-file> [options]
```

#### 10. **profile**
Profile generation performance
```bash
glsp-generator profile <grammar-file> [options]
```

#### 11. **clean**
Clean generated files
```bash
glsp-generator clean <output-dir> [options]
```

#### 12. **templates**
Manage template packages
```bash
glsp-generator templates <command> [options]
```

#### 13. **types**
Generate type definitions only
```bash
glsp-generator types <grammar-file> [options]
```

#### 14. **cache**
Manage generation cache
```bash
glsp-generator cache <command> [options]
```

## Technical Details

### CLI Architecture
```typescript
// Main CLI entry (src/cli.ts)
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const cli = yargs(hideBin(process.argv))
  .scriptName('glsp-generator')
  .usage('$0 <command> [options]')
  .command(commands)
  .demandCommand(1)
  .strict()
  .help()
  .version();
```

### Command Structure
Each command follows this pattern:
```typescript
interface Command {
  command: string
  describe: string
  aliases?: string[]
  builder: (yargs: Argv) => Argv
  handler: (args: Arguments) => Promise<void>
}
```

### Common Options
```typescript
// Global options available to all commands
interface GlobalOptions {
  config?: string      // Path to config file
  verbose?: boolean    // Enable verbose logging
  debug?: boolean      // Enable debug mode
  quiet?: boolean      // Suppress output
  force?: boolean      // Force overwrite
  'no-color'?: boolean // Disable colored output
}
```

### Generate Command Options
```typescript
interface GenerateOptions extends GlobalOptions {
  grammar: string      // Grammar file path
  output?: string      // Output directory
  watch?: boolean      // Enable watch mode
  
  // Feature flags
  docs?: boolean       // Generate documentation
  types?: boolean      // Generate type safety
  tests?: boolean      // Generate tests
  ci?: boolean         // Generate CI/CD
  
  // Type safety options
  'types-all'?: boolean
  'types-declarations'?: boolean
  'types-validation'?: boolean
  'types-guards'?: boolean
  'types-zod'?: boolean
  
  // Test options
  'tests-unit'?: boolean
  'tests-e2e'?: boolean
  'tests-coverage'?: number
  
  // CI/CD options
  'ci-platforms'?: string[]
  'ci-node-versions'?: string[]
  'ci-publish-npm'?: boolean
}
```

## Usage Examples

### Basic Generation
```bash
# Generate with defaults
glsp-generator generate my-dsl.langium

# Custom output directory
glsp-generator generate my-dsl.langium -o ./my-extension

# With all features
glsp-generator generate my-dsl.langium --docs --types --tests --ci
```

### Development Workflow
```bash
# Start watch mode with dev server
glsp-generator watch my-dsl.langium --serve --port 3000

# Interactive mode for beginners
glsp-generator generate --interactive

# Validate before committing
glsp-generator validate my-dsl.langium --strict
```

### Advanced Usage
```bash
# Profile performance
glsp-generator profile my-dsl.langium --iterations 10

# Generate with custom templates
glsp-generator generate my-dsl.langium --templates ./my-templates

# CI/CD integration
glsp-generator generate grammar.langium --ci --ci-platforms github,gitlab
```

## Interactive Features

### Prompts
When required arguments are missing:
```
? Enter path to grammar file: › 
? Select output directory: › ./output
? Which features would you like to generate?
  ◉ Documentation
  ◯ Type Safety
  ◯ Tests
  ◯ CI/CD
```

### Progress Indicators
```
🚀 Generating GLSP extension...
  ✔ Parsing grammar
  ✔ Validating structure
  ⠋ Generating code...
    └─ browser/command-contribution.ts
    └─ server/model-factory.ts
```

### Error Handling
```
❌ Generation failed: Invalid grammar

  Error at line 15, column 8:
    interface Node {
      name: string
      parent: UnknownType  // ← Type 'UnknownType' is not defined
    }

  Run with --debug for stack trace
```

## Configuration Integration
The CLI integrates with `.glsprc.json`:
```json
{
  "defaultOutput": "./generated",
  "features": {
    "documentation": true,
    "typeSafety": true
  },
  "templates": {
    "path": "./custom-templates"
  }
}
```

## Exit Codes
- `0`: Success
- `1`: General error
- `2`: Invalid arguments
- `3`: Grammar validation failed
- `4`: Generation failed
- `5`: Configuration error

## Future Enhancements
1. **Plugin System**: Support for CLI plugins
2. **Shell Completion**: Auto-completion for bash/zsh
3. **Update Notifications**: Check for new versions
4. **Telemetry**: Optional usage analytics
5. **Workspace Mode**: Multi-grammar projects

## Dependencies
- `yargs`: Command-line parsing
- `prompts`: Interactive prompts
- `chalk`: Terminal colors
- `ora`: Progress spinners
- `boxen`: Terminal boxes

## Testing
- Unit tests for argument parsing
- Integration tests for commands
- E2E tests for workflows
- Cross-platform compatibility

## Related Features
- [Configuration System](./04-configuration.md)
- [Watch Mode](./11-watch-mode.md)
- [Interactive Mode](./12-interactive-mode.md)