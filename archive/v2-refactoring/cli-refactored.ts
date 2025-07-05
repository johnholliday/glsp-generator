#!/usr/bin/env node
/**
 * Refactored CLI entry point using new architecture
 * @module cli-refactored
 */

import 'reflect-metadata';
import { Command } from 'commander';
import { createContainer } from './infrastructure/di/container';
import { TYPES } from './infrastructure/di/symbols';
import { IGenerator, GenerationConfig } from './core/interfaces/IGenerator';
import { IParser } from './core/interfaces/IParser';
import { IValidator } from './validation/interfaces/IValidator';
import { IStructuredLogger, LogLevel } from './infrastructure/logging/ILogger';
import { IEventBus } from './infrastructure/events/IEventBus';
import { IFileSystem } from './infrastructure/filesystem/IFileSystem';
import { IErrorHandler } from './infrastructure/errors/IErrorHandler';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main CLI class using refactored architecture
 */
class RefactoredCLI {
  private program: Command;
  private container = createContainer({
    verbose: process.env.DEBUG === 'true',
    enableCache: true,
    enablePlugins: true,
    enableMetrics: process.env.METRICS === 'true',
  });

  // Core services
  private generator: IGenerator;
  private parser: IParser;
  private validator: IValidator;
  private logger: IStructuredLogger;
  private eventBus: IEventBus;
  private fileSystem: IFileSystem;
  private errorHandler: IErrorHandler;

  constructor() {
    // Resolve services from DI container
    this.generator = this.container.get<IGenerator>(TYPES.IGenerator);
    this.parser = this.container.get<IParser>(TYPES.IParser);
    this.validator = this.container.get<IValidator>(TYPES.IValidator);
    this.logger = this.container.get<IStructuredLogger>(TYPES.IStructuredLogger);
    this.eventBus = this.container.get<IEventBus>(TYPES.IEventBus);
    this.fileSystem = this.container.get<IFileSystem>(TYPES.IFileSystem);
    this.errorHandler = this.container.get<IErrorHandler>(TYPES.IErrorHandler);

    // Read package.json for version info
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    // Initialize commander
    this.program = new Command()
      .name('glsp-gen')
      .description('Generate GLSP extensions from Langium grammars')
      .version(packageJson.version)
      .option('-v, --verbose', 'Enable verbose logging')
      .option('--debug', 'Enable debug mode');

    // Setup commands
    this.setupCommands();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup CLI commands
   */
  private setupCommands(): void {
    // Generate command
    this.program
      .command('generate <grammar>')
      .alias('gen')
      .description('Generate GLSP extension from Langium grammar')
      .option('-o, --output <dir>', 'Output directory', './output')
      .option('-t, --templates <templates...>', 'Template types to generate', ['browser', 'server', 'common'])
      .option('--no-validate', 'Skip grammar validation')
      .option('--force', 'Overwrite existing files')
      .option('--dry-run', 'Preview changes without writing files')
      .option('--plugin <plugins...>', 'Plugins to enable')
      .action(async (grammarPath: string, options) => {
        await this.handleGenerate(grammarPath, options);
      });

    // Validate command
    this.program
      .command('validate <grammar>')
      .alias('val')
      .description('Validate a Langium grammar file')
      .option('--strict', 'Enable strict validation mode')
      .action(async (grammarPath: string, options) => {
        await this.handleValidate(grammarPath, options);
      });

    // Clean command
    this.program
      .command('clean <output>')
      .description('Clean generated files')
      .option('--dry-run', 'Preview files to be deleted')
      .action(async (outputPath: string, options) => {
        await this.handleClean(outputPath, options);
      });

    // Templates command
    this.program
      .command('templates')
      .description('List available templates')
      .action(async () => {
        await this.handleListTemplates();
      });

    // Plugin command
    this.program
      .command('plugins')
      .description('List available plugins')
      .action(async () => {
        await this.handleListPlugins();
      });
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    // Generation events
    this.eventBus.on('generation:start', (data) => {
      this.logger.info('Generation started', data);
    });

    this.eventBus.on('generation:phase:start', (data) => {
      this.logger.debug(`Phase started: ${data.phase}`, data);
    });

    this.eventBus.on('generation:phase:complete', (data) => {
      this.logger.debug(`Phase completed: ${data.phase}`, data);
    });

    this.eventBus.on('generation:complete', (data) => {
      this.logger.info('Generation completed successfully', data);
    });

    this.eventBus.on('generation:error', (data) => {
      this.logger.error('Generation failed', data.error);
    });

    // Template events
    this.eventBus.on('template:render:start', (data) => {
      this.logger.trace(`Rendering template: ${data.template}`, data);
    });

    this.eventBus.on('template:render:complete', (data) => {
      this.logger.trace(`Template rendered: ${data.template}`, data);
    });

    // Validation events
    this.eventBus.on('validation:start', (data) => {
      this.logger.debug('Validation started', data);
    });

    this.eventBus.on('validation:complete', (data) => {
      this.logger.debug('Validation completed', data);
    });
  }

  /**
   * Handle generate command
   */
  private async handleGenerate(grammarPath: string, options: any): Promise<void> {
    const spinner = ora('Generating GLSP extension...').start();
    
    try {
      // Resolve absolute path
      const absoluteGrammarPath = path.resolve(grammarPath);
      const absoluteOutputPath = path.resolve(options.output);

      // Check if grammar file exists
      if (!await this.fileSystem.exists(absoluteGrammarPath)) {
        throw new Error(`Grammar file not found: ${grammarPath}`);
      }

      // Parse the grammar first
      spinner.text = 'Parsing grammar...';
      const parser = this.container.get<IParser>(TYPES.IParser);
      const grammar = await parser.parse(absoluteGrammarPath);

      // Validate grammar if not skipped
      if (options.validate !== false) {
        spinner.text = 'Validating grammar...';
        const validationResult = await this.validator.validate(grammar, {
          strict: options.strict
        });

        if (!validationResult.isValid) {
          spinner.fail('Grammar validation failed');
          this.logger.error('Validation errors:', new Error('Validation failed'), { errors: validationResult.errors });
          process.exit(1);
        }
      }

      // Check output directory
      if (await this.fileSystem.exists(absoluteOutputPath) && !options.force) {
        const files = await this.fileSystem.readdir(absoluteOutputPath);
        if (files.length > 0) {
          spinner.fail(`Output directory is not empty: ${options.output}`);
          this.logger.warn('Use --force to overwrite existing files');
          process.exit(1);
        }
      }

      // Prepare generation config
      const config: GenerationConfig = {
        grammarPath: absoluteGrammarPath,
        outputDir: absoluteOutputPath,
        options: {
          validate: options.validate !== false,
          templates: options.templates,
          force: options.force,
          dryRun: options.dryRun,
          plugins: options.plugin || [],
        }
      };

      // Generate extension
      spinner.text = 'Generating extension...';
      const result = await this.generator.generate(config);

      if (result.success) {
        spinner.succeed(chalk.green('✅ Extension generated successfully!'));
        this.logger.info('');
        this.logger.info(`${chalk.cyan('📍 Output location:')} ${result.outputDir}`);
        this.logger.info(`${chalk.cyan('📄 Files generated:')} ${result.filesGenerated || result.files.length}`);
        
        if (result.metadata) {
          this.logger.info(`${chalk.cyan('⏱️  Generation time:')} ${result.metadata.duration}ms`);
          if (result.metadata.grammarInfo) {
            const info = result.metadata.grammarInfo;
            this.logger.info(chalk.cyan('📊 Grammar info:'));
            this.logger.info(`   - Rules: ${info.rules}`);
            this.logger.info(`   - Interfaces: ${info.interfaces}`);
          }
        }

        // Show next steps
        this.logger.info('');
        this.logger.info(chalk.yellow('Next steps:'));
        this.logger.info(`  cd ${path.relative(process.cwd(), result.outputDir || options.output)}`);
        this.logger.info('  yarn install');
        this.logger.info('  yarn build');
      } else {
        spinner.fail(chalk.red('❌ Generation failed'));
        if (result.errors) {
          result.errors.forEach(error => {
            this.logger.error(`  - ${error.message}`, error);
          });
        }
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Generation failed'));
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }

  /**
   * Handle validate command
   */
  private async handleValidate(grammarPath: string, options: any): Promise<void> {
    const spinner = ora('Validating grammar...').start();
    
    try {
      const absolutePath = path.resolve(grammarPath);
      
      if (!await this.fileSystem.exists(absolutePath)) {
        throw new Error(`Grammar file not found: ${grammarPath}`);
      }

      // Parse the grammar first
      const parser = this.container.get<IParser>(TYPES.IParser);
      const grammar = await parser.parse(absolutePath);

      const result = await this.validator.validate(grammar, {
        strict: options.strict
      });

      if (result.isValid) {
        spinner.succeed(chalk.green('✅ Grammar is valid'));
        
        if (result.warnings && result.warnings.length > 0) {
          this.logger.warn(chalk.yellow('\n⚠️  Warnings:'));
          result.warnings.forEach(warning => {
            this.logger.warn(`  - ${warning.message}`);
            if (warning.location) {
              this.logger.warn(`    at line ${warning.location.startLine}, column ${warning.location.startColumn}`);
            }
          });
        }
      } else {
        spinner.fail(chalk.red('❌ Grammar validation failed'));
        
        if (result.errors && result.errors.length > 0) {
          this.logger.error(chalk.red('\n❌ Errors:'));
          result.errors.forEach(error => {
            this.logger.error(`  - ${error.message}`);
            if (error.location) {
              this.logger.error(`    at line ${error.location.startLine}, column ${error.location.startColumn}`);
            }
          });
        }
        
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Validation failed'));
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }

  /**
   * Handle clean command
   */
  private async handleClean(outputPath: string, options: any): Promise<void> {
    const spinner = ora('Cleaning generated files...').start();
    
    try {
      const absolutePath = path.resolve(outputPath);
      
      if (!await this.fileSystem.exists(absolutePath)) {
        spinner.warn(chalk.yellow('⚠️  Output directory does not exist'));
        return;
      }

      if (options.dryRun) {
        spinner.info('Dry run mode - no files will be deleted');
        const files = await this.fileSystem.glob('**/*', { cwd: absolutePath });
        this.logger.info(chalk.cyan('\nFiles to be deleted:'));
        files.forEach(file => {
          this.logger.info(`  - ${file}`);
        });
        spinner.succeed(chalk.green(`✅ Would delete ${files.length} files`));
      } else {
        await this.fileSystem.remove(absolutePath);
        spinner.succeed(chalk.green('✅ Generated files cleaned'));
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Clean failed'));
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }

  /**
   * Handle list templates command
   */
  private async handleListTemplates(): Promise<void> {
    const spinner = ora('Loading templates...').start();
    
    try {
      // Get template engine from container
      const templateEngine = this.container.get<any>(TYPES.ITemplateEngine);
      const templates = await templateEngine.listTemplates();

      spinner.succeed(chalk.green('✅ Available templates:'));
      this.logger.info('');
      
      // Group templates by strategy
      const grouped = templates.reduce((acc: any, template: any) => {
        const strategy = template.strategy || 'common';
        if (!acc[strategy]) acc[strategy] = [];
        acc[strategy].push(template);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([strategy, templates]: [string, any]) => {
        this.logger.info(chalk.cyan(`${strategy.toUpperCase()} Templates:`));
        templates.forEach((template: any) => {
          this.logger.info(`  - ${template.name}`);
          if (template.description) {
            this.logger.info(chalk.gray(`    ${template.description}`));
          }
        });
        this.logger.info('');
      });
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to list templates'));
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }

  /**
   * Handle list plugins command
   */
  private async handleListPlugins(): Promise<void> {
    const spinner = ora('Loading plugins...').start();
    
    try {
      // Get plugin manager from container
      const pluginManager = this.container.get<any>(TYPES.PluginManager);
      const plugins = await pluginManager.listPlugins();

      spinner.succeed(chalk.green('✅ Available plugins:'));
      this.logger.info('');
      
      if (plugins.length === 0) {
        this.logger.info(chalk.gray('  No plugins found'));
      } else {
        plugins.forEach((plugin: any) => {
          const status = plugin.enabled ? chalk.green('✓') : chalk.red('✗');
          this.logger.info(`  ${status} ${plugin.name} v${plugin.version}`);
          if (plugin.description) {
            this.logger.info(chalk.gray(`    ${plugin.description}`));
          }
          if (plugin.hooks && plugin.hooks.length > 0) {
            this.logger.info(chalk.gray(`    Hooks: ${plugin.hooks.join(', ')}`));
          }
        });
      }
      this.logger.info('');
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to list plugins'));
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }

  /**
   * Run the CLI
   */
  async run(): Promise<void> {
    try {
      // Parse global options first
      this.program.parse(process.argv);
      const options = this.program.opts();

      // Update container config based on CLI options
      if (options.verbose) {
        this.logger.setLevel(LogLevel.DEBUG);
      }
      if (options.debug) {
        this.logger.setLevel(LogLevel.TRACE);
        process.env.DEBUG = 'glsp-generator:*';
      }

      // If no command provided, show help
      if (process.argv.length <= 2) {
        this.program.help();
      }
    } catch (error) {
      await this.errorHandler.handle(error as Error);
      process.exit(1);
    }
  }
}

// Main entry point
(async () => {
  const cli = new RefactoredCLI();
  await cli.run();
})().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});