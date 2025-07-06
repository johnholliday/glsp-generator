import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import path from 'path';
import { BaseCommand } from './base/base.command.js';
import { InteractiveHelper } from './base/interactive.helper.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { ConfigLoader } from '../config/config-loader.js';
import { ConfigInterpolator } from '../config/config-interpolator.js';
import { LangiumGrammarParser } from '../utils/langium-parser.js';
import { getUserProjectRoot } from '../utils/paths.js';
import { TempDirectoryManager } from '../utils/temp-directory.js';
import { VsixPackager } from '../utils/vsix-packager.js';
import ora from 'ora';

interface GenerateArgs {
  grammar?: string;
  output?: string;
  config?: string;
  set?: Record<string, any>;
  watch?: boolean;
  debug?: boolean;
  'validate-only'?: boolean;
  'no-validate'?: boolean;
  force?: boolean;
  docs?: boolean;
  'docs-theme'?: 'light' | 'dark';
  types?: boolean;
  'types-all'?: boolean;
  'types-declarations'?: boolean;
  'types-validation'?: boolean;
  'types-guards'?: boolean;
  'types-zod'?: boolean;
  'types-utilities'?: boolean;
  tests?: boolean;
  'tests-unit'?: boolean;
  'tests-integration'?: boolean;
  'tests-e2e'?: boolean;
  'tests-coverage'?: number;
  ci?: boolean;
  templates?: string;
  'templates-path'?: string;
  'templates-package'?: string;
  'templates-repo'?: string;
  'ci-platforms'?: string[];
  'ci-node-versions'?: string[];
  'ci-publish-npm'?: boolean;
  'ci-publish-ovsx'?: boolean;
  'ci-docker'?: boolean;
  // Metadata-driven generation options
  workflow?: boolean;
  dataflow?: boolean;
  architecture?: boolean;
  hierarchy?: boolean;
  mathematical?: boolean;
  minimal?: boolean;
  'glsp-config'?: string;
  'validate-metadata'?: boolean;
  'metadata-config'?: string;
  'dev'?: boolean;
  'no-vsix'?: boolean;
}

@injectable()
export class GenerateCommand extends BaseCommand<GenerateArgs> {
  readonly command = ['generate <grammar> [output]', 'gen', 'g'];
  readonly describe = 'Generate GLSP extension from Langium grammar';
  readonly aliases = ['gen', 'g'];

  private readonly interactive: InteractiveHelper;
  private parser: LangiumGrammarParser;
  private configLoader: ConfigLoader;
  private tempDirManager: TempDirectoryManager;
  private vsixPackager: VsixPackager;

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.PackageInfo) private readonly packageInfo: { version: string },
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator
  ) {
    super(logger);
    this.interactive = new InteractiveHelper(logger);
    this.parser = new LangiumGrammarParser();
    this.configLoader = new ConfigLoader();
    this.tempDirManager = new TempDirectoryManager(logger);
    this.vsixPackager = new VsixPackager(logger);
  }

  builder(yargs: Argv): Argv<GenerateArgs> {
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
      .option('docs', {
        describe: 'Generate documentation along with extension',
        type: 'boolean',
        default: false
      })
      .option('docs-theme', {
        describe: 'Theme for documentation diagrams',
        choices: ['light', 'dark'],
        default: 'light'
      })
      .option('types', {
        describe: 'Generate type safety features',
        type: 'boolean',
        default: false
      })
      .option('types-all', {
        describe: 'Generate all type safety features',
        type: 'boolean',
        default: false
      })
      .option('types-declarations', {
        describe: 'Generate TypeScript declarations',
        type: 'boolean',
        default: true
      })
      .option('types-validation', {
        describe: 'Generate runtime validation',
        type: 'boolean',
        default: true
      })
      .option('types-guards', {
        describe: 'Generate type guards',
        type: 'boolean',
        default: true
      })
      .option('types-zod', {
        describe: 'Generate Zod schemas',
        type: 'boolean',
        default: true
      })
      .option('types-utilities', {
        describe: 'Generate type utilities',
        type: 'boolean',
        default: true
      })
      .option('tests', {
        describe: 'Generate test infrastructure',
        type: 'boolean',
        default: false
      })
      .option('tests-unit', {
        describe: 'Generate unit tests',
        type: 'boolean',
        default: true
      })
      .option('tests-integration', {
        describe: 'Generate integration tests',
        type: 'boolean',
        default: true
      })
      .option('tests-e2e', {
        describe: 'Generate E2E tests',
        type: 'boolean',
        default: true
      })
      .option('tests-coverage', {
        describe: 'Target code coverage percentage',
        type: 'number',
        default: 80
      })
      .option('ci', {
        describe: 'Generate CI/CD configuration',
        type: 'boolean',
        default: false
      })
      .option('templates', {
        alias: 't',
        describe: 'Custom templates path, package, or Git repository',
        type: 'string'
      })
      .option('templates-path', {
        describe: 'Path to custom templates directory',
        type: 'string'
      })
      .option('templates-package', {
        describe: 'npm package name for custom templates',
        type: 'string'
      })
      .option('templates-repo', {
        describe: 'Git repository URL for custom templates',
        type: 'string'
      })
      .option('ci-platforms', {
        describe: 'CI platforms to target',
        type: 'array',
        choices: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
        default: ['ubuntu-latest', 'windows-latest']
      })
      .option('ci-node-versions', {
        describe: 'Node.js versions for CI',
        type: 'array',
        default: ['16.x', '18.x', '20.x']
      })
      .option('ci-publish-npm', {
        describe: 'Include npm publishing in CI',
        type: 'boolean',
        default: true
      })
      .option('ci-publish-ovsx', {
        describe: 'Include Open VSX publishing in CI',
        type: 'boolean',
        default: true
      })
      .option('ci-docker', {
        describe: 'Include Docker support in CI',
        type: 'boolean',
        default: true
      })
      // Metadata-driven generation options
      .option('workflow', {
        describe: 'Use workflow attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('dataflow', {
        describe: 'Use dataflow attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('architecture', {
        describe: 'Use architecture attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('hierarchy', {
        describe: 'Use hierarchy attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('mathematical', {
        describe: 'Use mathematical attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('minimal', {
        describe: 'Use minimal attribute group (legacy)',
        type: 'boolean',
        default: false
      })
      .option('glsp-config', {
        describe: 'Path to GLSP metadata configuration file',
        type: 'string'
      })
      .option('validate-metadata', {
        describe: 'Validate grammar metadata annotations',
        type: 'boolean',
        default: true
      })
      .option('metadata-config', {
        describe: 'External metadata configuration file (JSON/YAML)',
        type: 'string'
      })
      .option('dev', {
        describe: 'Development mode - generate project and open in VSCode',
        type: 'boolean',
        default: false
      })
      .option('debug', {
        alias: 'd',
        describe: 'Debug mode - open VSCode extension host with generated VSIX',
        type: 'boolean',
        default: false
      })
      .option('no-vsix', {
        describe: 'Skip VSIX packaging (generate project only)',
        type: 'boolean',
        default: false
      })
      .example('$0 gen state-machine.langium', 'Generate with default output')
      .example('$0 gen grammar.langium ./my-extension', 'Custom output directory')
      .example('$0 gen grammar.langium --tests', 'Generate with test infrastructure')
      .example('$0 gen grammar.langium --ci', 'Generate with CI/CD configuration')
      .example('$0 gen workflow.langium --workflow', 'Use workflow attribute group (legacy)')
      .example('$0 gen annotated.langium', 'Use metadata from grammar annotations')
      .example('$0 gen grammar.langium --metadata-config glsp.json', 'Use external metadata config')
      .example('$0 gen grammar.langium --dev', 'Generate project and open in VSCode for development')
      .example('$0 gen grammar.langium --debug', 'Generate VSIX and open in VSCode extension host')
      .example('$0 gen grammar.langium --no-vsix', 'Generate project only, skip VSIX packaging')
      .check((argv) => {
        if (argv.grammar && !argv.grammar.endsWith('.langium')) {
          this.logger.warn('File does not have .langium extension', { file: argv.grammar });
        }
        
        // Check for conflicting attribute groups
        const attributeGroups = ['workflow', 'dataflow', 'architecture', 'hierarchy', 'mathematical', 'minimal'];
        const selectedGroups = attributeGroups.filter(group => argv[group]);
        if (selectedGroups.length > 1) {
          throw new Error(`Cannot use multiple attribute groups: ${selectedGroups.join(', ')}`);
        }
        
        return true;
      }) as Argv<GenerateArgs>;
  }

  async handler(args: GenerateArgs): Promise<void> {
    try {
      this.logger.info('GLSP Generator starting', { version: this.packageInfo.version });

      if (args.debug) {
        process.env.DEBUG = 'glsp-generator:*';
        this.logger.debug('Debug mode enabled');
      }

      // Get grammar file
      let grammarPath = await this.resolveGrammarPath(args.grammar);

      // Parse grammar for interpolation context
      const interpolationContext = await this.getInterpolationContext(grammarPath);

      // Load configuration
      await this.loadConfiguration(args.config, interpolationContext, args.set, args);

      // Validate grammar
      if (!args['no-validate']) {
        await this.validateGrammar(grammarPath);
      }

      if (args['validate-only']) {
        this.logger.info('Validation complete');
        return;
      }

      // Check output directory
      const outputPath = path.resolve(args.output || './output');
      
      // Handle different generation modes
      if (args.dev) {
        // Development mode: generate to output directory and open in VSCode
        await this.checkOutputDirectory(outputPath, args.force);
        await this.generateExtension(grammarPath, outputPath, args);
        await this.vsixPackager.openProjectInVSCode(outputPath);
        this.logger.info('Opened project in VSCode for development');
      } else if (args['no-vsix']) {
        // Generate project only
        await this.checkOutputDirectory(outputPath, args.force);
        await this.generateExtension(grammarPath, outputPath, args);
        this.showNextSteps(outputPath);
      } else {
        // Default: generate VSIX package
        const tempDir = await this.tempDirManager.createTempDirectory('glsp-gen-');
        try {
          // Generate to temp directory
          await this.generateExtension(grammarPath, tempDir.path, args);
          
          // Package as VSIX
          const packageResult = await this.vsixPackager.packageExtension({
            projectPath: tempDir.path,
            outputPath,
            logger: this.logger
          });

          if (!packageResult.success) {
            throw new Error(`Failed to package VSIX: ${packageResult.error?.message}`);
          }

          this.logger.info('Generated VSIX package', { path: packageResult.vsixPath });

          // Handle debug mode
          if (args.debug) {
            await this.vsixPackager.openInVSCode(packageResult.vsixPath, true);
            this.logger.info('Opened VSIX in VSCode extension host');
          } else {
            this.logger.info('VSIX package ready for installation:');
            this.logger.info(`  code --install-extension ${packageResult.vsixPath}`);
          }
        } finally {
          await tempDir.cleanup();
        }
      }

      // Handle watch mode
      if (args.watch) {
        await this.startWatchMode(grammarPath, outputPath, args);
      } else {
        setTimeout(() => process.exit(0), 100);
      }

    } catch (error) {
      this.handleError(error, args.debug);
    }
  }

  private async resolveGrammarPath(grammar?: string): Promise<string> {
    const fsModule = await import('fs-extra');
    const fs = fsModule.default;

    if (grammar && await fs.pathExists(grammar)) {
      return grammar;
    }

    if (grammar) {
      this.logger.error('Grammar file not found', { path: grammar });
    }

    return await this.interactive.promptForFile('Enter path to grammar file:');
  }

  private async getInterpolationContext(grammarPath: string): Promise<any> {
    try {
      const parsedGrammar = await this.parser.parseGrammarFile(grammarPath);
      const grammarFileName = path.basename(grammarPath);
      return ConfigInterpolator.createContext(parsedGrammar, grammarFileName);
    } catch (error) {
      this.logger.warn('Could not parse grammar for config interpolation', error);
      return undefined;
    }
  }

  private async loadConfiguration(
    configPath?: string,
    interpolationContext?: any,
    overrides?: Record<string, any>,
    args?: GenerateArgs
  ): Promise<any> {
    let config = await this.configLoader.loadConfig(
      getUserProjectRoot(),
      configPath,
      interpolationContext
    );

    // Apply legacy attribute group if specified
    if (args) {
      const attributeGroups = ['workflow', 'dataflow', 'architecture', 'hierarchy', 'mathematical', 'minimal'];
      const selectedGroup = attributeGroups.find(group => args[group as keyof GenerateArgs]);
      
      if (selectedGroup) {
        config = {
          ...config,
          metadata: {
            attributeGroup: selectedGroup
          }
        };
      }
    }

    if (overrides) {
      config = this.configLoader.applyOverrides(config, overrides);
    }

    return config;
  }

  private async validateGrammar(grammarPath: string): Promise<void> {
    const spinner = ora('Validating grammar...').start();
    const isValid = await this.generator.validateGrammar(grammarPath);

    if (!isValid) {
      spinner.fail('Grammar validation failed');
      throw new Error('Grammar validation failed');
    }

    spinner.succeed('Grammar is valid');
  }

  private async checkOutputDirectory(outputPath: string, force?: boolean): Promise<void> {
    const fsModule = await import('fs-extra');
    const fs = fsModule.default;

    if (await fs.pathExists(outputPath) && !force) {
      const files = await fs.readdir(outputPath);
      if (files.length > 0) {
        const overwrite = await this.interactive.confirm(
          `Output directory ${outputPath} is not empty. Overwrite?`,
          false
        );

        if (!overwrite) {
          this.logger.warn('Generation cancelled');
          process.exit(0);
        }
      }
    }
  }

  private async generateExtension(
    grammarPath: string,
    outputPath: string,
    args: GenerateArgs
  ): Promise<string> {
    const generateSpinner = ora('Generating GLSP extension...').start();

    // Determine selected attribute group
    const attributeGroups = ['workflow', 'dataflow', 'architecture', 'hierarchy', 'mathematical', 'minimal'];
    const selectedGroup = attributeGroups.find(group => args[group as keyof GenerateArgs]);

    const { extensionDir } = await this.generator.generateExtension(grammarPath, outputPath, {
      generateDocs: args.docs,
      docsOptions: {
        theme: args['docs-theme']
      },
      generateTypeSafety: args.types || args['types-all'],
      typeSafetyOptions: args['types-all'] ? {} : {
        declarations: args['types-declarations'],
        validation: args['types-validation'],
        guards: args['types-guards'],
        zodSchemas: args['types-zod'],
        utilities: args['types-utilities']
      },
      generateTests: args.tests,
      testOptions: {
        unitTests: {
          generateModelTests: args['tests-unit'],
          generateValidationTests: args['tests-unit'],
          generateTypeGuardTests: args['tests-unit'],
          coverage: args['tests-coverage']
        },
        integrationTests: {
          generateServerTests: args['tests-integration'],
          generateHandlerTests: args['tests-integration'],
          generateClientTests: args['tests-integration'],
          generateCommunicationTests: args['tests-integration']
        },
        e2eTests: {
          generateBasicTests: args['tests-e2e'],
          generateDiagramTests: args['tests-e2e'],
          generateModelPersistenceTests: args['tests-e2e'],
          generateKeyboardShortcutTests: args['tests-e2e']
        },
        coverage: args['tests-coverage']
      },
      generateCICD: args.ci,
      cicdOptions: {
        platforms: args['ci-platforms'] || ['ubuntu-latest', 'windows-latest'],
        nodeVersions: args['ci-node-versions'] || ['16.x', '18.x', '20.x'],
        publishTargets: [
          ...(args['ci-publish-npm'] ? ['npm' as const] : []),
          ...(args['ci-publish-ovsx'] ? ['ovsx' as const] : [])
        ],
        containerSupport: args['ci-docker']
      },
      templateOptions: {
        templatesPath: args['templates-path'],
        templatesPackage: args['templates-package'],
        templatesRepo: args['templates-repo']
      },
      // Metadata-driven generation options
      metadataOptions: {
        attributeGroup: selectedGroup as any,
        glspConfigPath: args['glsp-config'],
        validateMetadata: args['validate-metadata'],
        metadataConfigPath: args['metadata-config']
      }
    });

    generateSpinner.succeed('Generation complete');

    this.logger.info('Generation completed successfully', { outputDir: extensionDir });

    return extensionDir;
  }

  private async startWatchMode(
    grammarPath: string,
    outputPath: string,
    args: GenerateArgs
  ): Promise<void> {
    this.logger.info('Watch mode enabled - monitoring for changes');
    this.logger.info('Press Ctrl+C to stop');

    const chokidar = await import('chokidar');
    const watcher = chokidar.watch(grammarPath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      this.logger.info('File changed, regenerating', { file: grammarPath });
      try {
        await this.generateExtension(grammarPath, outputPath, args);
        this.logger.info('Regeneration completed successfully');
      } catch (error) {
        this.logger.error('Regeneration failed', error);
      }
    });
  }

  private showNextSteps(extensionDir: string): void {
    this.logger.info('Next steps:');
    const relativePath = path.relative(process.cwd(), extensionDir);
    const displayPath = process.platform === 'win32' ? relativePath.replace(/\//g, '\\') : relativePath;

    this.logger.info(`  cd ${displayPath}`);
    this.logger.info('  yarn install');
    this.logger.info('  yarn build');
    this.logger.info('Or run with --watch to auto-regenerate on changes');
  }
}