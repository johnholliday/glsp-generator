#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import prompts from 'prompts';
import { GLSPGenerator } from './generator.js';
import { ConfigLoader } from './config/config-loader.js';
import { getProjectRoot } from './utils/paths.js';

// Get version from package.json
const packageJson = JSON.parse(await fs.readFile(path.join(getProjectRoot(), 'package.json'), 'utf-8'));

// Create CLI instance
const cli = yargs(hideBin(process.argv))
  .scriptName('glsp')
  .usage('$0 <command> [options]')
  .version(packageJson.version)
  .alias('version', 'v')
  .help()
  .alias('help', 'h')
  .demandCommand(0, '')  // Don't require a command for --version and --help
  .recommendCommands()
  .completion()
  .epilogue(chalk.gray('For more information, visit: https://github.com/your-org/glsp-generator'));

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
        describe: 'Configuration file path (.glsprc.json)',
        type: 'string'
      })
      .option('set', {
        describe: 'Override config values (e.g., --set extension.version=2.0.0)',
        type: 'array',
        coerce: (values: string[]) => {
          const overrides: Record<string, any> = {};
          values.forEach(v => {
            const [key, value] = v.split('=');
            if (key && value) {
              overrides[key] = value;
            }
          });
          return overrides;
        }
      })
      .option('watch', {
        alias: 'w',
        describe: 'Watch for changes (deprecated - use watch command instead)',
        type: 'boolean',
        default: false,
        deprecated: true
      })
      .option('debug', {
        alias: 'd',
        describe: 'Enable debug output',
        type: 'boolean',
        default: false
      })
      .option('validate-only', {
        describe: 'Only validate, don\'t generate',
        type: 'boolean',
        default: false
      })
      .option('no-validate', {
        describe: 'Skip validation',
        type: 'boolean',
        default: false
      })
      .option('force', {
        alias: 'f',
        describe: 'Overwrite existing files',
        type: 'boolean',
        default: false
      })
      .example('$0 gen state-machine.langium', 'Generate with default output')
      .example('$0 gen grammar.langium ./my-extension', 'Custom output directory')
      .example('$0 gen grammar.langium -w', 'Generate and watch for changes')
      .check((argv) => {
        if (argv.grammar && !argv.grammar.endsWith('.langium')) {
          console.warn(chalk.yellow('⚠️  Warning: File does not have .langium extension'));
        }
        return true;
      });
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold('🚀 GLSP Generator v' + packageJson.version));
      console.log(chalk.gray('Generating Theia GLSP extension from Langium grammar\n'));

      if (argv.debug) {
        process.env.DEBUG = 'glsp-generator:*';
        console.log(chalk.gray('Debug mode enabled'));
      }

      // Check if grammar file exists
      let grammarPath: string = argv.grammar || '';
      if (!grammarPath || !await fs.pathExists(grammarPath)) {
        if (grammarPath) {
          console.error(chalk.red(`❌ Grammar file not found: ${grammarPath}`));
        }
        
        // Interactive mode: ask for grammar file
        const response = await prompts({
          type: 'text',
          name: 'grammar',
          message: 'Enter path to grammar file:',
          validate: async (value: string) => await fs.pathExists(value) || 'File not found'
        });
        
        if (!response.grammar) {
          process.exit(1);
        }
        
        grammarPath = response.grammar;
      }

      // Load configuration
      const configLoader = new ConfigLoader();
      let config = await configLoader.loadConfig(process.cwd(), argv.config);
      
      // Apply CLI overrides
      if (argv.set) {
        config = configLoader.applyOverrides(config, argv.set as Record<string, any>);
      }

      const generator = new GLSPGenerator(config);

      // Validate grammar unless skipped
      if (!argv['no-validate']) {
        const spinner = ora('Validating grammar...').start();
        const isValid = await generator.validateGrammar(grammarPath);
        
        if (!isValid) {
          spinner.fail('Grammar validation failed');
          process.exit(1);
        }
        
        spinner.succeed('Grammar is valid');
      }

      if (argv['validate-only']) {
        console.log(chalk.green('✅ Validation complete'));
        return;
      }

      // Check if output directory exists and has files
      const outputPath = path.resolve(argv.output || './output');
      if (await fs.pathExists(outputPath) && !argv.force) {
        const files = await fs.readdir(outputPath);
        if (files.length > 0) {
          const response = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: `Output directory ${outputPath} is not empty. Overwrite?`,
            initial: false
          });
          
          if (!response.overwrite) {
            console.log(chalk.yellow('Generation cancelled'));
            process.exit(0);
          }
        }
      }

      // Generate extension
      const generateSpinner = ora('Generating GLSP extension...').start();
      await generator.generateExtension(grammarPath, outputPath);
      generateSpinner.succeed('Generation complete');

      console.log(chalk.green.bold('\n🎉 Generation completed successfully!'));
      console.log(chalk.cyan(`📁 Output: ${outputPath}`));
      
      if (!argv.watch) {
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray(`  cd ${path.relative(process.cwd(), outputPath)}`));
        console.log(chalk.gray('  yarn install'));
        console.log(chalk.gray('  yarn build'));
        console.log(chalk.gray('\nOr run with --watch to auto-regenerate on changes'));
      }

      // Watch mode
      if (argv.watch) {
        console.log(chalk.blue('\n👀 Watching for changes...'));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));

        const chokidar = await import('chokidar');
        const watcher = chokidar.watch(grammarPath, {
          persistent: true,
          ignoreInitial: true
        });

        watcher.on('change', async () => {
          console.log(chalk.yellow(`\n📝 File changed: ${grammarPath}`));
          try {
            await generator.generateExtension(grammarPath, outputPath);
            console.log(chalk.green('✅ Regenerated successfully'));
          } catch (error) {
            console.error(chalk.red(`❌ Regeneration failed: ${error}`));
          }
        });
      }

    } catch (error) {
      console.error(chalk.red(`\n❌ Generation failed: ${error instanceof Error ? error.message : error}`));
      if (argv.debug && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
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
      })
      .option('debug', {
        alias: 'd',
        describe: 'Show detailed validation errors',
        type: 'boolean',
        default: false
      })
      .option('report', {
        alias: 'r',
        describe: 'Generate validation report',
        type: 'string'
      })
      .option('format', {
        alias: 'f',
        describe: 'Report format',
        choices: ['markdown', 'html'],
        default: 'markdown'
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file with linter rules',
        type: 'string'
      })
      .example('$0 validate my-grammar.langium', 'Validate a grammar file')
      .example('$0 val grammar.langium -d', 'Validate with debug output')
      .example('$0 val grammar.langium -r report.md', 'Generate markdown report')
      .example('$0 val grammar.langium -r report.html -f html', 'Generate HTML report');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('🔍 Validating grammar...'));

      const grammarFile = argv.grammar;
      if (!grammarFile || !await fs.pathExists(grammarFile)) {
        console.error(chalk.red(`❌ Grammar file not found: ${grammarFile || 'undefined'}`));
        process.exit(1);
      }

      // Load configuration if specified
      let config = undefined;
      if (argv.config) {
        const configLoader = new ConfigLoader();
        config = await configLoader.loadConfig(process.cwd(), argv.config);
      }

      const generator = new GLSPGenerator(config);
      const spinner = ora('Running validation...').start();
      
      const options = {
        generateReport: !!argv.report,
        reportPath: argv.report,
        reportFormat: argv.format as 'markdown' | 'html'
      };
      
      const isValid = await generator.validateGrammar(grammarFile, options);
      
      if (isValid) {
        spinner.succeed('Grammar is valid');
        console.log(chalk.green('✅ No errors found'));
      } else {
        spinner.fail('Grammar validation failed');
        console.error(chalk.red('❌ Please fix the errors above'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : error}`));
      if (argv.debug && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
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
        type: 'string',
        normalize: true
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: './output',
        normalize: true
      })
      .option('serve', {
        alias: 's',
        describe: 'Start development server with live reload',
        type: 'boolean',
        default: false
      })
      .option('port', {
        alias: 'p',
        describe: 'Development server port',
        type: 'number',
        default: 3000
      })
      .option('debounce', {
        alias: 'd',
        describe: 'Debounce time in milliseconds',
        type: 'number',
        default: 500
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .option('clear', {
        describe: 'Clear console on each generation',
        type: 'boolean',
        default: false
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Verbose output',
        type: 'boolean',
        default: false
      })
      .example('$0 watch grammar.langium', 'Watch and regenerate on changes')
      .example('$0 w grammar.langium -s', 'Watch with dev server')
      .example('$0 w grammar.langium -s -p 8080', 'Custom dev server port')
      .example('$0 w grammar.langium --clear', 'Clear console between generations');
  },
  async (argv) => {
    try {
      const { GrammarWatcher } = await import('./watch/watcher.js');
      
      console.log(chalk.blue.bold('🚀 GLSP Generator v' + packageJson.version));
      
      const watcher = new GrammarWatcher(argv.grammar!, argv.output!, {
        serve: argv.serve,
        port: argv.port,
        debounceMs: argv.debounce,
        config: argv.config,
        clearConsole: argv.clear,
        verbose: argv.verbose
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n👋 Shutting down...'));
        await watcher.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        await watcher.stop();
        process.exit(0);
      });
      
      // Start watching
      await watcher.start();
      
    } catch (error) {
      console.error(chalk.red('❌ Watch mode failed:'), error);
      process.exit(1);
    }
  }
);

// New project command
cli.command(
  ['new <name>', 'init', 'create'],
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
      })
      .option('no-git', {
        describe: 'Skip git initialization',
        type: 'boolean',
        default: false
      })
      .option('no-install', {
        describe: 'Skip dependency installation',
        type: 'boolean',
        default: false
      })
      .example('$0 new my-dsl', 'Create new project with basic template')
      .example('$0 new my-dsl -t advanced', 'Use advanced template');
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold(`📁 Creating new GLSP project: ${argv.name}`));

      const projectName = argv.name;
      if (!projectName) {
        console.error(chalk.red('❌ Project name is required'));
        process.exit(1);
      }
      const projectPath = path.join(process.cwd(), projectName);
      
      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        console.error(chalk.red(`❌ Directory already exists: ${argv.name}`));
        process.exit(1);
      }

      // Interactive prompts for project details
      const answers = await prompts([
        {
          type: 'text',
          name: 'description',
          message: 'Project description:',
          initial: 'A new GLSP-based domain-specific language'
        },
        {
          type: 'text',
          name: 'author',
          message: 'Author name:',
          initial: ''
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: 'Use TypeScript?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'tests',
          message: 'Include test setup?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'ci',
          message: 'Add CI/CD configuration?',
          initial: true
        }
      ]);

      const spinner = ora('Creating project structure...').start();

      // Create project directory
      await fs.ensureDir(projectPath);

      // Create basic project structure
      const dirs = [
        'src',
        'src/grammar',
        'src/examples',
        'generated',
        'docs'
      ];

      if (answers.tests) {
        dirs.push('test');
      }

      for (const dir of dirs) {
        await fs.ensureDir(path.join(projectPath, dir));
      }

      // Create package.json
      const projectPackageJson: any = {
        name: projectName,
        version: '0.1.0',
        description: answers.description,
        author: answers.author,
        license: 'MIT',
        type: 'module',
        scripts: {
          'generate': 'glsp gen src/grammar/main.langium generated',
          'generate:watch': 'glsp watch src/grammar/main.langium generated',
          'build': 'yarn generate && tsc',
          'dev': 'yarn generate:watch',
          'clean': 'rimraf generated dist'
        },
        devDependencies: {
          'glsp-generator': `^${(packageJson as any).version}`,
          'rimraf': '^5.0.5'
        }
      };

      if (answers.typescript) {
        projectPackageJson.devDependencies['typescript'] = '^5.0.0';
        projectPackageJson.devDependencies['@types/node'] = '^20.0.0';
      }

      if (answers.tests) {
        projectPackageJson.scripts['test'] = 'jest';
        projectPackageJson.devDependencies['jest'] = '^29.5.0';
        projectPackageJson.devDependencies['@types/jest'] = '^29.5.0';
      }

      await fs.writeJson(path.join(projectPath, 'package.json'), projectPackageJson, { spaces: 2 });

      // Create example grammar
      const grammarContent = `// ${argv.name} Grammar Definition
grammar ${argv.name}

// Define your language elements here
interface Element {
    name: string
}

interface Node extends Element {
    x: number
    y: number
}

interface Edge extends Element {
    source: @Node
    target: @Node
}

// Define union types
type ModelElement = Node | Edge
`;

      await fs.writeFile(
        path.join(projectPath, 'src/grammar/main.langium'),
        grammarContent
      );

      // Create README
      const readmeContent = `# ${projectName}

${answers.description}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   yarn install
   \`\`\`

2. Generate GLSP extension:
   \`\`\`bash
   yarn generate
   \`\`\`

3. Watch for changes:
   \`\`\`bash
   yarn dev
   \`\`\`

## Project Structure

- \`src/grammar/\` - Langium grammar definitions
- \`src/examples/\` - Example models
- \`generated/\` - Generated GLSP extension code
- \`docs/\` - Documentation

## License

${answers.author ? `Copyright (c) ${new Date().getFullYear()} ${answers.author}` : ''}
Licensed under the MIT License.
`;

      await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);

      // Create .gitignore
      if (!argv['no-git']) {
        const gitignoreContent = `node_modules
dist
generated
*.log
.DS_Store
`;
        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
      }

      // Create TypeScript config if needed
      if (answers.typescript) {
        const tsConfig = {
          compilerOptions: {
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'node',
            lib: ['ES2022'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist', 'generated']
        };
        await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
      }

      spinner.succeed('Project structure created');

      // Initialize git
      if (!argv['no-git']) {
        const gitSpinner = ora('Initializing git repository...').start();
        const { execSync } = await import('child_process');
        
        try {
          execSync('git init', { cwd: projectPath, stdio: 'ignore' });
          execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
          execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'ignore' });
          gitSpinner.succeed('Git repository initialized');
        } catch (error) {
          gitSpinner.warn('Git initialization failed (git might not be installed)');
        }
      }

      // Install dependencies
      if (!argv['no-install']) {
        const installSpinner = ora('Installing dependencies...').start();
        const { execSync } = await import('child_process');
        
        try {
          execSync('yarn install', { cwd: projectPath, stdio: 'ignore' });
          installSpinner.succeed('Dependencies installed');
        } catch (error) {
          installSpinner.warn('Dependency installation failed - run yarn install manually');
        }
      }

      console.log(chalk.green.bold('\n🎉 Project created successfully!'));
      console.log(chalk.cyan(`📁 Location: ${projectPath}`));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray(`  cd ${argv.name}`));
      if (argv['no-install']) {
        console.log(chalk.gray('  yarn install'));
      }
      console.log(chalk.gray('  yarn generate'));
      console.log(chalk.gray('  yarn dev'));

    } catch (error) {
      console.error(chalk.red(`❌ Project creation failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// Init command - create configuration file
cli.command(
  ['init', 'config'],
  'Create default .glsprc.json configuration file',
  (yargs) => {
    return yargs
      .option('force', {
        alias: 'f',
        describe: 'Overwrite existing config',
        type: 'boolean',
        default: false
      })
      .option('path', {
        alias: 'p',
        describe: 'Output path for config file',
        type: 'string',
        default: '.'
      })
      .example('$0 init', 'Create .glsprc.json in current directory')
      .example('$0 init -p ./config', 'Create in specific directory');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('📝 Creating GLSP configuration file...'));
      
      const configLoader = new ConfigLoader();
      const outputPath = path.resolve(argv.path);
      
      // Check if config already exists
      const configPath = path.join(outputPath, '.glsprc.json');
      if (await fs.pathExists(configPath) && !argv.force) {
        const response = await prompts({
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration file already exists. Overwrite?',
          initial: false
        });
        
        if (!response.overwrite) {
          console.log(chalk.yellow('Configuration creation cancelled'));
          return;
        }
        
        await fs.remove(configPath);
      }
      
      await configLoader.createDefaultConfig(outputPath);
      console.log(chalk.green('✅ Configuration file created successfully'));
      console.log(chalk.gray(`\nEdit ${path.relative(process.cwd(), configPath)} to customize your extension`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create configuration: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// Validate-config command
cli.command(
  'validate-config [config]',
  'Validate GLSP configuration file',
  (yargs) => {
    return yargs
      .positional('config', {
        describe: 'Configuration file path',
        type: 'string',
        default: '.glsprc.json'
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Show detailed validation output',
        type: 'boolean',
        default: false
      })
      .example('$0 validate-config', 'Validate .glsprc.json in current directory')
      .example('$0 validate-config ./config/.glsprc.json', 'Validate specific config file');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('🔍 Validating configuration file...'));
      
      const configPath = path.resolve(argv.config || '.glsprc.json');
      if (!await fs.pathExists(configPath)) {
        console.error(chalk.red(`❌ Configuration file not found: ${configPath}`));
        process.exit(1);
      }
      
      const configLoader = new ConfigLoader();
      const result = await configLoader.validateConfigFile(configPath);
      
      if (result.valid) {
        console.log(chalk.green('✅ Configuration is valid'));
        
        if (argv.verbose) {
          const config = await configLoader.loadConfig(process.cwd(), configPath);
          console.log(chalk.gray('\nLoaded configuration:'));
          console.log(JSON.stringify(config, null, 2));
        }
      } else {
        console.error(chalk.red('❌ Configuration validation failed:'));
        result.errors?.forEach(error => {
          console.error(chalk.red(`  ${error}`));
        });
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// Clean command
cli.command(
  'clean',
  'Clean all generated files',
  (yargs) => {
    return yargs
      .option('force', {
        alias: 'f',
        describe: 'Force clean without confirmation',
        type: 'boolean',
        default: false
      })
      .example('$0 clean', 'Clean generated files')
      .example('$0 clean -f', 'Force clean without confirmation');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('🧹 Cleaning generated files...'));

      const dirsToClean = ['dist', 'generated', 'output'];
      const existingDirs = [];

      for (const dir of dirsToClean) {
        if (await fs.pathExists(dir)) {
          existingDirs.push(dir);
        }
      }

      if (existingDirs.length === 0) {
        console.log(chalk.yellow('No generated files found'));
        return;
      }

      console.log(chalk.gray('Directories to clean:'));
      existingDirs.forEach(dir => console.log(chalk.gray(`  - ${dir}`)));

      if (!argv.force) {
        const response = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: 'Delete these directories?',
          initial: true
        });

        if (!response.confirm) {
          console.log(chalk.yellow('Clean cancelled'));
          return;
        }
      }

      const spinner = ora('Cleaning...').start();

      for (const dir of existingDirs) {
        await fs.remove(dir);
      }

      spinner.succeed('Clean complete');
      console.log(chalk.green('✅ All generated files removed'));

    } catch (error) {
      console.error(chalk.red(`❌ Clean failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// Interactive mode when no arguments provided
if (process.argv.length <= 2) {
  (async () => {
    console.log(chalk.blue.bold('🚀 GLSP Generator - Interactive Mode'));
    console.log(chalk.gray('Generate Theia GLSP extensions from Langium grammars\n'));

    const response = await prompts({
      type: 'select',
      name: 'command',
      message: 'What would you like to do?',
      choices: [
        { title: 'Generate GLSP extension', value: 'generate' },
        { title: 'Validate grammar', value: 'validate' },
        { title: 'Create new project', value: 'new' },
        { title: 'Initialize configuration', value: 'init' },
        { title: 'Validate configuration', value: 'validate-config' },
        { title: 'Clean generated files', value: 'clean' },
        { title: 'Show help', value: 'help' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    if (!response.command || response.command === 'exit') {
      process.exit(0);
    }

    if (response.command === 'help') {
      cli.showHelp();
      process.exit(0);
    }

    // Get command-specific inputs
    if (response.command === 'generate') {
      const inputs = await prompts([
        {
          type: 'text',
          name: 'grammar',
          message: 'Grammar file:',
          validate: async (value) => {
            if (!value) return 'Grammar file is required';
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
          type: 'confirm',
          name: 'watch',
          message: 'Watch for changes?',
          initial: false
        }
      ]);

      if (inputs.grammar) {
        const args = ['generate', inputs.grammar, inputs.output];
        if (inputs.watch) args.push('--watch');
        cli.parse(args);
      }
    } else if (response.command === 'validate') {
      const inputs = await prompts({
        type: 'text',
        name: 'grammar',
        message: 'Grammar file:',
        validate: async (value) => {
          if (!value) return 'Grammar file is required';
          if (!await fs.pathExists(value)) return 'File not found';
          return true;
        }
      });

      if (inputs.grammar) {
        cli.parse(['validate', inputs.grammar]);
      }
    } else if (response.command === 'new') {
      const inputs = await prompts({
        type: 'text',
        name: 'name',
        message: 'Project name:',
        validate: (value) => value ? true : 'Project name is required'
      });

      if (inputs.name) {
        cli.parse(['new', inputs.name]);
      }
    } else if (response.command === 'init') {
      const inputs = await prompts({
        type: 'text',
        name: 'path',
        message: 'Configuration file location:',
        initial: '.'
      });
      
      cli.parse(['init', '--path', inputs.path || '.']);
    } else if (response.command === 'validate-config') {
      const inputs = await prompts({
        type: 'text',
        name: 'config',
        message: 'Configuration file:',
        initial: '.glsprc.json'
      });
      
      if (inputs.config) {
        cli.parse(['validate-config', inputs.config]);
      }
    } else {
      cli.parse([response.command]);
    }
  })();
} else {
  // Parse command line arguments
  cli.parse();
}