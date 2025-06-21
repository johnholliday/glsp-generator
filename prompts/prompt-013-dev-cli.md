# Prompt 013: Development CLI with Yargs and Yarn Link

## Objective
Create a simplified, developer-friendly CLI using Yargs that can be globally linked with Yarn for easy testing from any folder during development.

## Background
The current CLI requires navigating to the project directory and using `node dist/cli.js`. A globally-linked command would enable rapid testing from any location, improving the development workflow.

## Requirements

### 1. Yargs-based CLI
Replace commander with Yargs for:
- Better command organization
- Built-in help generation
- Type-safe argument parsing
- Middleware support
- Command aliases
- Improved error messages

### 2. Global Command Setup
Create `glsp` command that:
- Works globally after `yarn link`
- Provides intuitive subcommands
- Supports shortcuts and aliases
- Auto-completes in terminals
- Shows version from package.json

### 3. Simplified Command Structure
```powershell
# Instead of: node dist/cli.js generate grammar.langium -o output
glsp gen grammar.langium output

# Or with current directory as output
glsp gen grammar.langium

# Validate grammar
glsp validate grammar.langium
# Or short alias
glsp val grammar.langium

# Watch mode
glsp watch grammar.langium

# Create new project from template
glsp new my-dsl

# Show help
glsp help
glsp --help
glsp -h
```

### 4. Development Commands
Add development-specific commands:
```powershell
# Test all examples
glsp test-examples

# Benchmark performance
glsp benchmark grammar.langium

# Analyze grammar complexity
glsp analyze grammar.langium

# Clean all generated files
glsp clean

# Run with debug output
glsp gen grammar.langium --debug
```

### 5. Yarn Link Configuration
Setup for global development:
```json
{
  "name": "glsp-generator",
  "bin": {
    "glsp": "./dist/cli.js",
    "glsp-gen": "./dist/cli.js"
  }
}
```

### 6. Interactive Mode
Add interactive prompts when arguments missing:
```powershell
> glsp gen
? Grammar file: my-grammar.langium
? Output directory: ./output
? Include tests? (Y/n)
? Include documentation? (Y/n)
✓ Generated successfully!
```

## Implementation Details

### Yargs CLI Structure
```typescript
#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { generateGLSPExtension } from './index.js';

const cli = yargs(hideBin(process.argv))
  .scriptName('glsp')
  .usage('$0 <command> [options]')
  .version()
  .alias('v', 'version')
  .help()
  .alias('h', 'help')
  .strict()
  .recommendCommands()
  .completion();

// Generate command
cli.command(
  ['generate <grammar> [output]', 'gen', 'g'],
  'Generate GLSP extension from Langium grammar',
  (yargs) => {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string',
        normalize: true
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: './output',
        normalize: true
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .option('watch', {
        alias: 'w',
        describe: 'Watch for changes',
        type: 'boolean'
      })
      .option('debug', {
        alias: 'd',
        describe: 'Enable debug output',
        type: 'boolean'
      })
      .option('validate-only', {
        describe: 'Only validate, don\'t generate',
        type: 'boolean'
      })
      .example('$0 gen state-machine.langium', 'Generate with default output')
      .example('$0 gen grammar.langium ./my-extension', 'Custom output directory');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('🚀 GLSP Generator'));
      console.log(chalk.gray(`Grammar: ${argv.grammar}`));
      console.log(chalk.gray(`Output: ${argv.output}`));
      
      if (argv.debug) {
        process.env.DEBUG = 'glsp-generator:*';
      }
      
      const options = {
        validate: !argv['no-validate'],
        watch: argv.watch,
        config: argv.config
      };
      
      await generateGLSPExtension(argv.grammar, argv.output, options);
      
      console.log(chalk.green('✅ Generation complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'), error.message);
      process.exit(1);
    }
  }
);

// Validate command
cli.command(
  ['validate <grammar>', 'val', 'v'],
  'Validate Langium grammar',
  (yargs) => {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string',
        normalize: true
      });
  },
  async (argv) => {
    console.log(chalk.blue('🔍 Validating grammar...'));
    // Implementation
  }
);

// Watch command
cli.command(
  ['watch <grammar> [output]', 'w'],
  'Watch grammar and regenerate on changes',
  (yargs) => {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string'
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: './output'
      })
      .option('serve', {
        describe: 'Start development server',
        type: 'boolean'
      });
  },
  async (argv) => {
    console.log(chalk.blue('👀 Watching for changes...'));
    // Implementation
  }
);

// New project command
cli.command(
  ['new <name>', 'init'],
  'Create new DSL project from template',
  (yargs) => {
    return yargs
      .positional('name', {
        describe: 'Project name',
        type: 'string'
      })
      .option('template', {
        alias: 't',
        describe: 'Template to use',
        choices: ['basic', 'advanced', 'minimal'],
        default: 'basic'
      });
  },
  async (argv) => {
    console.log(chalk.blue(`📁 Creating new project: ${argv.name}`));
    // Implementation
  }
);

// Parse arguments and run
cli.parse();
```

### Setup Script for Development
Create `scripts/setup-dev-cli.js`:
```javascript
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

console.log(chalk.blue('Setting up GLSP CLI for development...'));

try {
  // Build the project first
  console.log(chalk.gray('Building project...'));
  execSync('yarn build', { stdio: 'inherit' });
  
  // Create global link
  console.log(chalk.gray('Creating global link...'));
  execSync('yarn link', { stdio: 'inherit' });
  
  console.log(chalk.green('✅ Setup complete!'));
  console.log(chalk.yellow('\nYou can now use the following commands from anywhere:'));
  console.log('  glsp gen <grammar> [output]');
  console.log('  glsp validate <grammar>');
  console.log('  glsp watch <grammar>');
  console.log('  glsp new <project-name>');
  
  console.log(chalk.gray('\nTo unlink later, run: yarn unlink'));
} catch (error) {
  console.error(chalk.red('❌ Setup failed:'), error.message);
  process.exit(1);
}
```

### PowerShell Completion Script
Create `scripts/glsp-completion.ps1`:
```powershell
# PowerShell completion for glsp command
Register-ArgumentCompleter -CommandName glsp -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameter)
    
    $commands = @(
        'generate', 'gen', 'g',
        'validate', 'val', 'v',
        'watch', 'w',
        'new', 'init',
        'help'
    )
    
    $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}
```

## Acceptance Criteria

1. ✅ Yargs CLI with intuitive command structure
2. ✅ Global `glsp` command works after `yarn link`
3. ✅ Short aliases for common commands
4. ✅ Interactive mode when arguments missing
5. ✅ Colored output with chalk
6. ✅ PowerShell completion support
7. ✅ Works from any directory on the system

## Testing Requirements

Create tests in `src/cli/`:
- Test command parsing
- Test argument validation
- Test interactive prompts
- Test global command execution
- Test error handling
- Mock file system for CLI tests

## Files to Create/Modify

1. `src/cli.ts` - Rewrite with Yargs
2. `src/cli/commands/` - Individual command files
3. `scripts/setup-dev-cli.js` - Development setup
4. `scripts/glsp-completion.ps1` - PowerShell completions
5. Update `package.json` with bin configuration
6. Add Yargs dependencies
7. Update README with new CLI usage

## Dependencies
- yargs: Modern CLI framework
- yargs-interactive: Interactive prompts
- chalk: Terminal colors
- ora: Spinner for long operations

## Notes
- Consider bash/zsh completion scripts too
- Add `glsp config` command for managing .glsprc
- Could add `glsp update` for self-updates
- Consider `glsp doctor` for troubleshooting
- Add telemetry opt-in for usage analytics
