#!/usr/bin/env node

import 'reflect-metadata';
import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Container } from 'inversify';
import { ILogger } from './utils/logger/index.js';
import { TYPES } from './config/di/types.js';
import { setupMinimalContainer } from './config/di/minimal-container.js';
import { ICommand } from './commands/index.js';
import prompts from 'prompts';

// Commands
import { GenerateCommand } from './commands/generate.command.js';
import { ValidateCommand } from './commands/validate.command.js';
import { CleanCommand } from './commands/clean.command.js';
import { InitCommand } from './commands/init.command.js';
import { TemplatesCommand } from './commands/templates.command.js';
import { DocsCommand } from './commands/docs.command.js';
import { CICDCommand } from './commands/cicd.command.js';
import { NewCommand } from './commands/new.command.js';
import { ValidateConfigCommand } from './commands/validate-config.command.js';
import { BenchmarkCommand } from './commands/benchmark.command.js';
import { ProfileCommand } from './commands/profile.command.js';
// import { TemplatesCommand } from './commands/templates.command.js';
// import { BenchmarkCommand } from './commands/benchmark.command.js';
// import { ProfileCommand } from './commands/profile.command.js';
// import { CacheCommand } from './commands/cache.command.js';

class CLI {
  private container: Container;
  private logger: ILogger;
  private commands: ICommand[] = [];
  private yargs!: Argv;

  constructor() {
    this.container = setupMinimalContainer();
    this.logger = this.container.get<ILogger>(TYPES.Logger);
    this.registerCommands();
    this.setupYargs();
  }

  private registerCommands(): void {
    const commandClasses = [
      GenerateCommand,
      ValidateCommand,
      // CleanCommand,
      // InitCommand,
      // TemplatesCommand,
      // DocsCommand,
      // CICDCommand,
      // NewCommand,
      // ValidateConfigCommand,
      // BenchmarkCommand,
      // ProfileCommand,
    ];

    for (const CommandClass of commandClasses) {
      this.container.bind<ICommand>(CommandClass).to(CommandClass).inSingletonScope();
      const command = this.container.get<ICommand>(CommandClass);
      this.commands.push(command);
    }
  }

  private setupYargs(): void {
    const packageInfo = this.container.get<{ version: string }>(TYPES.PackageInfo);

    this.yargs = yargs(hideBin(process.argv))
      .scriptName('glsp')
      .usage('$0 <command> [options]')
      .version(packageInfo.version)
      .alias('version', 'v')
      .help()
      .alias('help', 'h')
      .demandCommand(0, '')
      .recommendCommands()
      .completion()
      .epilogue('For more information, visit: https://github.com/your-org/glsp-generator');

    // Register all commands
    for (const command of this.commands) {
      this.yargs.command(
        command.command,
        command.describe,
        (yargs: Argv) => command.builder(yargs),
        async (args: any) => {
          try {
            await command.handler(args);
          } catch (error) {
            this.logger.error('Command execution failed', error);
            process.exit(1);
          }
        }
      );
    }
  }

  async run(): Promise<void> {
    // Interactive mode when no arguments provided
    if (process.argv.length <= 2) {
      await this.runInteractiveMode();
    } else {
      this.yargs.parse();
    }
  }

  private async runInteractiveMode(): Promise<void> {
    this.logger.info('GLSP Generator - Interactive Mode');
    this.logger.info('Generate Theia GLSP extensions from Langium grammars');

    const response = await prompts({
      type: 'select',
      name: 'command',
      message: 'What would you like to do?',
      choices: [
        { title: 'Generate GLSP extension', value: 'generate' },
        { title: 'Generate test infrastructure', value: 'test' },
        { title: 'Generate CI/CD configuration', value: 'cicd' },
        { title: 'Generate documentation', value: 'docs' },
        { title: 'Generate type safety', value: 'types' },
        { title: 'Validate grammar', value: 'validate' },
        { title: 'Create new project', value: 'new' },
        { title: 'Initialize configuration', value: 'init' },
        { title: 'Validate configuration', value: 'validate-config' },
        { title: 'Clean generated files', value: 'clean' },
        { title: 'Manage templates', value: 'templates' },
        { title: 'Run benchmarks', value: 'benchmark' },
        { title: 'Profile generation', value: 'profile' },
        { title: 'Manage cache', value: 'cache' },
        { title: 'Show help', value: 'help' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    if (!response.command || response.command === 'exit') {
      process.exit(0);
    }

    if (response.command === 'help') {
      this.yargs.showHelp();
      process.exit(0);
    }

    // Delegate to interactive command handlers
    await this.handleInteractiveCommand(response.command);
  }

  private async handleInteractiveCommand(commandName: string): Promise<void> {
    const commandHandlers: Record<string, () => Promise<string[]>> = {
      generate: () => this.getGenerateArgs(),
      validate: () => this.getValidateArgs(),
      new: () => this.getNewProjectArgs(),
      init: () => this.getInitArgs(),
      'validate-config': () => this.getValidateConfigArgs(),
      test: () => this.getTestArgs(),
      cicd: () => this.getCICDArgs(),
      docs: () => this.getDocsArgs(),
      types: () => this.getTypesArgs(),
      templates: () => this.getTemplatesArgs(),
      profile: () => this.getProfileArgs(),
      cache: () => this.getCacheArgs(),
      clean: async () => ['clean'],
      benchmark: async () => ['benchmark']
    };

    const handler = commandHandlers[commandName];
    if (handler) {
      const args = await handler();
      this.yargs.parse(args);
    }
  }

  private async getGenerateArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: './output'
      },
      {
        type: 'select',
        name: 'metadataSource',
        message: 'How would you like to configure GLSP metadata?',
        choices: [
          { title: 'From grammar annotations (recommended)', value: 'annotations' },
          { title: 'Use attribute group (legacy)', value: 'group' },
          { title: 'External config file', value: 'config' },
          { title: 'Default configuration', value: 'default' }
        ]
      },
      {
        type: prev => prev === 'group' ? 'select' : null,
        name: 'attributeGroup',
        message: 'Select attribute group:',
        choices: [
          { title: 'Workflow - Process and state diagrams', value: 'workflow' },
          { title: 'Dataflow - Data processing pipelines', value: 'dataflow' },
          { title: 'Architecture - System architecture diagrams', value: 'architecture' },
          { title: 'Hierarchy - Tree and organizational charts', value: 'hierarchy' },
          { title: 'Mathematical - Graph and network diagrams', value: 'mathematical' },
          { title: 'Minimal - Basic diagram support', value: 'minimal' }
        ]
      },
      {
        type: prev => prev === 'config' ? 'text' : null,
        name: 'metadataConfig',
        message: 'Path to metadata config file:',
        initial: './glsp-metadata.json'
      },
      {
        type: 'select',
        name: 'mode',
        message: 'Generation mode:',
        choices: [
          { title: 'Generate VSIX package (default)', value: 'vsix' },
          { title: 'Development mode (open in VSCode)', value: 'dev' },
          { title: 'Debug mode (open extension host)', value: 'debug' },
          { title: 'Project only (no VSIX)', value: 'project' }
        ]
      },
      {
        type: 'confirm',
        name: 'watch',
        message: 'Watch for changes?',
        initial: false
      }
    ]);

    if (!inputs.grammar) return [];

    const args = ['generate', inputs.grammar, inputs.output];
    if (inputs.metadataSource === 'group' && inputs.attributeGroup) {
      args.push(`--${inputs.attributeGroup}`);
    }
    if (inputs.metadataSource === 'config' && inputs.metadataConfig) {
      args.push('--metadata-config', inputs.metadataConfig);
    }
    if (inputs.mode === 'dev') args.push('--dev');
    if (inputs.mode === 'debug') args.push('--debug');
    if (inputs.mode === 'project') args.push('--no-vsix');
    if (inputs.watch) args.push('--watch');
    return args;
  }

  private async getValidateArgs(): Promise<string[]> {
    const inputs = await prompts({
      type: 'text',
      name: 'grammar',
      message: 'Grammar file:',
      validate: async (value) => {
        if (!value) return 'Grammar file is required';
        const fs = await import('fs-extra');
        if (!await fs.pathExists(value)) return 'File not found';
        return true;
      }
    });

    return inputs.grammar ? ['validate', inputs.grammar] : [];
  }

  private async getNewProjectArgs(): Promise<string[]> {
    const inputs = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      validate: (value) => value ? true : 'Project name is required'
    });

    return inputs.name ? ['new', inputs.name] : [];
  }

  private async getInitArgs(): Promise<string[]> {
    const inputs = await prompts({
      type: 'text',
      name: 'path',
      message: 'Configuration file location:',
      initial: '.'
    });

    return ['init', '--path', inputs.path || '.'];
  }

  private async getValidateConfigArgs(): Promise<string[]> {
    const inputs = await prompts({
      type: 'text',
      name: 'config',
      message: 'Configuration file:',
      initial: '.glsprc.json'
    });

    return inputs.config ? ['validate-config', inputs.config] : [];
  }

  private async getTestArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: '.'
      },
      {
        type: 'multiselect',
        name: 'testTypes',
        message: 'Select test types to generate:',
        choices: [
          { title: 'Unit tests', value: 'unit', selected: true },
          { title: 'Integration tests', value: 'integration', selected: true },
          { title: 'E2E tests', value: 'e2e', selected: true },
          { title: 'Test factories', value: 'factories', selected: true }
        ]
      },
      {
        type: 'number',
        name: 'coverage',
        message: 'Target coverage percentage:',
        initial: 80,
        min: 0,
        max: 100
      }
    ]);

    if (!inputs.grammar) return [];

    const args = ['test', inputs.grammar, inputs.output];
    if (!inputs.testTypes.includes('unit')) args.push('--no-unit');
    if (!inputs.testTypes.includes('integration')) args.push('--no-integration');
    if (!inputs.testTypes.includes('e2e')) args.push('--no-e2e');
    if (!inputs.testTypes.includes('factories')) args.push('--no-factories');
    args.push('--coverage', inputs.coverage.toString());
    return args;
  }

  private async getCICDArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: '.'
      },
      {
        type: 'multiselect',
        name: 'features',
        message: 'Select CI/CD features:',
        choices: [
          { title: 'GitHub Actions workflows', value: 'workflows', selected: true },
          { title: 'Release scripts', value: 'scripts', selected: true },
          { title: 'Docker support', value: 'docker', selected: true },
          { title: 'Semantic release', value: 'semantic', selected: false }
        ]
      },
      {
        type: 'multiselect',
        name: 'platforms',
        message: 'Select CI platforms:',
        choices: [
          { title: 'Ubuntu', value: 'ubuntu-latest', selected: true },
          { title: 'Windows', value: 'windows-latest', selected: true },
          { title: 'macOS', value: 'macos-latest', selected: false }
        ]
      }
    ]);

    if (!inputs.grammar) return [];

    const args = ['cicd', inputs.grammar, inputs.output];
    if (!inputs.features.includes('workflows')) args.push('--no-workflows');
    if (!inputs.features.includes('scripts')) args.push('--no-scripts');
    if (!inputs.features.includes('docker')) args.push('--no-docker');
    if (inputs.features.includes('semantic')) args.push('--semantic-release');
    args.push('--platforms', ...inputs.platforms);
    return args;
  }

  private async getDocsArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: '.'
      }
    ]);

    return inputs.grammar ? ['docs', inputs.grammar, inputs.output] : [];
  }

  private async getTypesArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: '.'
      }
    ]);

    return inputs.grammar ? ['types', inputs.grammar, inputs.output] : [];
  }

  private async getTemplatesArgs(): Promise<string[]> {
    const templateAction = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do with templates?',
      choices: [
        { title: 'List installed packages', value: 'list' },
        { title: 'Search for packages', value: 'search' },
        { title: 'Install a package', value: 'install' },
        { title: 'Validate a package', value: 'validate' }
      ]
    });

    if (!templateAction.action) return [];

    if (templateAction.action === 'search') {
      const query = await prompts({
        type: 'text',
        name: 'query',
        message: 'Enter search query:'
      });
      return query.query ? ['templates', 'search', query.query] : [];
    }

    if (templateAction.action === 'install' || templateAction.action === 'validate') {
      const packageInput = await prompts({
        type: 'text',
        name: 'package',
        message: `Enter package ${templateAction.action === 'install' ? 'name' : 'name or path'}:`
      });
      return packageInput.package ? ['templates', templateAction.action, packageInput.package] : [];
    }

    return ['templates', templateAction.action];
  }

  private async getProfileArgs(): Promise<string[]> {
    const inputs = await prompts([
      {
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          const fs = await import('fs-extra');
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      },
      {
        type: 'text',
        name: 'output',
        message: 'Output directory:',
        initial: './profile-output'
      }
    ]);

    return inputs.grammar ? ['profile', inputs.grammar, inputs.output] : [];
  }

  private async getCacheArgs(): Promise<string[]> {
    const cacheAction = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do with cache?',
      choices: [
        { title: 'Show statistics', value: 'stats' },
        { title: 'Clear cache', value: 'clear' }
      ]
    });

    return cacheAction.action ? ['cache', cacheAction.action] : [];
  }
}

// Main entry point
(async () => {
  const cli = new CLI();
  await cli.run();
})().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});