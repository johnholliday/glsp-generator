# Prompt 020: Interactive CLI Experience

## Goal
Transform the CLI from a command-line tool into an interactive, guided experience with wizards, progress indicators, and intelligent prompts that make it accessible to users of all skill levels.

## Why
- New users struggle with command-line syntax
- No guidance on available options
- Long operations provide no feedback
- Errors require re-running entire commands
- No way to discover features interactively
- Missing visual feedback for operations

## What
An enhanced CLI with interactive mode, guided wizards, real-time progress indicators, and colorful output that provides a delightful user experience.

### Success Criteria
- [ ] Interactive mode when no arguments provided
- [ ] Guided wizard for grammar generation
- [ ] Progress bars for long operations
- [ ] Color-coded output for clarity
- [ ] Auto-completion suggestions
- [ ] Command history and replay
- [ ] Contextual help at each step
- [ ] Graceful interruption handling

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/packages/generator/src/cli.ts
  why: Current CLI implementation to enhance
  
- url: https://github.com/terkelg/prompts
  why: Interactive command line prompts
  
- url: https://github.com/SBoudrias/Inquirer.js
  why: Alternative prompt library with rich features

- url: https://github.com/visionmedia/commander.js
  why: CLI framework with built-in features

- url: https://github.com/chalk/chalk
  why: Terminal string styling
```

## Implementation Blueprint

### Phase 1: Interactive Mode Entry

CREATE packages/generator/src/cli-interactive.ts:
```typescript
import prompts from 'prompts';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { GLSPGenerator } from './generator.js';

export class InteractiveCLI {
  async run() {
    // Welcome banner
    console.clear();
    const banner = figlet.textSync('GLSP Generator', { 
      horizontalLayout: 'fitted' 
    });
    console.log(gradient.rainbow(banner));
    console.log(chalk.gray('\n  Generate GLSP extensions from Langium grammars\n'));

    // Main menu
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: '🚀 Generate GLSP Extension', value: 'generate' },
        { title: '✅ Validate Grammar', value: 'validate' },
        { title: '📚 View Examples', value: 'examples' },
        { title: '🔧 Configure Settings', value: 'settings' },
        { title: '❓ Help', value: 'help' },
        { title: '👋 Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'generate':
        await this.generateWizard();
        break;
      case 'validate':
        await this.validateWizard();
        break;
      // ... other actions
    }
  }

  async generateWizard() {
    console.log(chalk.cyan('\n📋 Generate GLSP Extension\n'));

    const responses = await prompts([
      {
        type: 'text',
        name: 'grammarFile',
        message: 'Grammar file path:',
        validate: (value) => {
          if (!value) return 'Grammar file is required';
          if (!value.endsWith('.langium')) return 'File must be a .langium file';
          return true;
        },
        suggest: async (input) => {
          // Auto-complete file paths
          return await this.suggestFiles(input, '.langium');
        }
      },
      {
        type: 'select',
        name: 'outputMode',
        message: 'Output mode:',
        choices: [
          { title: 'VSIX Package (default)', value: 'vsix' },
          { title: 'Project Files Only', value: 'project' },
          { title: 'Development Mode', value: 'dev' }
        ],
        initial: 0
      },
      {
        type: 'text',
        name: 'outputDir',
        message: 'Output directory:',
        initial: './output',
        format: (val) => path.resolve(val)
      },
      {
        type: 'multiselect',
        name: 'features',
        message: 'Additional features:',
        choices: [
          { title: 'Documentation', value: 'docs', selected: true },
          { title: 'Type Safety', value: 'types', selected: true },
          { title: 'Tests', value: 'tests' },
          { title: 'CI/CD', value: 'cicd' }
        ]
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Generate with these settings?',
        initial: true
      }
    ]);

    if (!responses.confirm) {
      console.log(chalk.yellow('\n✋ Generation cancelled\n'));
      return;
    }

    // Execute generation with progress
    await this.executeGeneration(responses);
  }
}
```

### Phase 2: Progress Indicators

CREATE packages/generator/src/cli/progress.ts:
```typescript
import ora, { Ora } from 'ora';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class ProgressManager {
  private spinner?: Ora;
  private progressBar?: cliProgress.SingleBar;
  
  startSpinner(text: string): void {
    this.spinner = ora({
      text,
      color: 'cyan',
      spinner: 'dots12'
    }).start();
  }
  
  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }
  
  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
    }
  }
  
  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
    }
  }
  
  startProgress(total: number, message: string): void {
    this.progressBar = new cliProgress.SingleBar({
      format: `${chalk.cyan('{bar}')} {percentage}% | ${message} | {value}/{total}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
    
    this.progressBar.start(total, 0);
  }
  
  updateProgress(current: number, message?: string): void {
    if (this.progressBar) {
      this.progressBar.update(current, { message });
    }
  }
  
  stopProgress(): void {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = undefined;
    }
  }
}
```

### Phase 3: Command Enhancement

UPDATE packages/generator/src/cli.ts to support both modes:
```typescript
import { Command } from 'commander';
import { InteractiveCLI } from './cli-interactive.js';

const program = new Command();

// If no arguments, launch interactive mode
if (process.argv.length === 2) {
  new InteractiveCLI().run();
} else {
  // Enhanced traditional CLI
  program
    .name('glsp')
    .description(chalk.cyan('Generate GLSP extensions from Langium grammars'))
    .version(version, '-v, --version', 'Display version')
    .addHelpCommand('help [command]', 'Display help for command')
    .configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => chalk.green(cmd.name())
    });

  // Generate command with progress
  program
    .command('generate <grammar-file>')
    .alias('gen')
    .description('Generate GLSP extension from grammar')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('--no-vsix', 'Skip VSIX packaging')
    .option('--dev', 'Development mode')
    .option('--verbose', 'Verbose output')
    .action(async (grammarFile, options) => {
      const progress = new ProgressManager();
      
      try {
        progress.startSpinner('Parsing grammar...');
        // ... generation logic with progress updates
      } catch (error) {
        progress.failSpinner('Generation failed');
        await errorHandler.handle(error);
      }
    });
}
```

### Phase 4: Auto-completion

CREATE packages/generator/src/cli/completion.ts:
```typescript
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';

export class CompletionProvider {
  async suggestFiles(input: string, extension?: string): Promise<string[]> {
    const dir = dirname(input) || '.';
    const prefix = input.split('/').pop() || '';
    
    try {
      const files = await readdir(dir);
      return files
        .filter(f => f.startsWith(prefix))
        .filter(f => !extension || f.endsWith(extension))
        .map(f => join(dir, f));
    } catch {
      return [];
    }
  }
  
  async suggestCommands(input: string): Promise<string[]> {
    const commands = [
      'generate', 'validate', 'init', 'test', 
      'watch', 'clean', 'doctor', 'help'
    ];
    
    return commands.filter(cmd => cmd.startsWith(input));
  }
}
```

### Phase 5: Rich Output Formatting

CREATE packages/generator/src/cli/formatter.ts:
```typescript
import Table from 'cli-table3';
import boxen from 'boxen';
import chalk from 'chalk';

export class OutputFormatter {
  static success(message: string): void {
    console.log(boxen(
      chalk.green(`✅ ${message}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  }
  
  static error(message: string): void {
    console.log(boxen(
      chalk.red(`❌ ${message}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red'
      }
    ));
  }
  
  static table(headers: string[], rows: string[][]): void {
    const table = new Table({
      head: headers.map(h => chalk.cyan(h)),
      style: { 
        head: [], 
        border: ['grey'] 
      }
    });
    
    rows.forEach(row => table.push(row));
    console.log(table.toString());
  }
  
  static tree(data: any, indent = 0): void {
    // Render tree structure for file listings
  }
}
```

## Validation Loop

### Test Interactive Mode
```bash
# Launch without arguments
glsp
# Should show interactive menu

# Test wizard flow
# Select "Generate GLSP Extension"
# Follow prompts
# Verify generation with progress
```

### Test Enhanced CLI
```bash
# Test with progress
glsp generate test.langium --verbose
# Should show progress indicators

# Test help formatting
glsp help generate
# Should show colorful, formatted help
```

## Final Validation Checklist
- [ ] Interactive mode launches when no args
- [ ] Wizards guide through all options
- [ ] Progress indicators for all long operations
- [ ] Colors enhance readability
- [ ] Auto-completion works for files/commands
- [ ] Interruption (Ctrl+C) handled gracefully
- [ ] Help is contextual and useful
- [ ] Works in all terminal emulators

## Success Metrics
- User satisfaction: 90%+ positive feedback
- Task completion: 50% faster for new users
- Error reduction: 70% fewer syntax errors
- Feature discovery: 100% of features accessible