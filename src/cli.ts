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
      .example('$0 gen state-machine.langium', 'Generate with default output')
      .example('$0 gen grammar.langium ./my-extension', 'Custom output directory')
      .example('$0 gen grammar.langium -w', 'Generate and watch for changes')
      .example('$0 gen grammar.langium --tests', 'Generate with test infrastructure')
      .example('$0 gen grammar.langium --ci', 'Generate with CI/CD configuration')
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
      await generator.generateExtension(grammarPath, outputPath, {
        generateDocs: argv.docs,
        docsOptions: {
          theme: argv['docs-theme'] as 'light' | 'dark'
        },
        generateTypeSafety: argv.types || argv['types-all'],
        typeSafetyOptions: argv['types-all'] ? {} : {
          declarations: argv['types-declarations'],
          validation: argv['types-validation'],
          guards: argv['types-guards'],
          zodSchemas: argv['types-zod'],
          utilities: argv['types-utilities']
        },
        generateTests: argv.tests,
        testOptions: {
          unitTests: {
            generateModelTests: argv['tests-unit'],
            generateValidationTests: argv['tests-unit'],
            generateTypeGuardTests: argv['tests-unit'],
            coverage: argv['tests-coverage']
          },
          integrationTests: {
            generateServerTests: argv['tests-integration'],
            generateHandlerTests: argv['tests-integration'],
            generateClientTests: argv['tests-integration'],
            generateCommunicationTests: argv['tests-integration']
          },
          e2eTests: {
            generateBasicTests: argv['tests-e2e'],
            generateDiagramTests: argv['tests-e2e'],
            generateModelPersistenceTests: argv['tests-e2e'],
            generateKeyboardShortcutTests: argv['tests-e2e']
          },
          coverage: argv['tests-coverage']
        },
        generateCICD: argv.ci,
        cicdOptions: {
          platforms: argv['ci-platforms'] as string[],
          nodeVersions: argv['ci-node-versions'] as string[],
          publishTargets: [
            ...(argv['ci-publish-npm'] ? ['npm' as const] : []),
            ...(argv['ci-publish-ovsx'] ? ['ovsx' as const] : [])
          ],
          containerSupport: argv['ci-docker']
        },
        templateOptions: {
          templatesPath: argv['templates-path'],
          templatesPackage: argv['templates-package'],
          templatesRepo: argv['templates-repo']
        }
      });
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
            await generator.generateExtension(grammarPath, outputPath, {
              generateDocs: argv.docs,
              docsOptions: {
                theme: argv['docs-theme'] as 'light' | 'dark'
              },
              generateTypeSafety: argv.types || argv['types-all'],
              typeSafetyOptions: argv['types-all'] ? {} : {
                declarations: argv['types-declarations'],
                validation: argv['types-validation'],
                guards: argv['types-guards'],
                zodSchemas: argv['types-zod'],
                utilities: argv['types-utilities']
              },
              generateTests: argv.tests,
              testOptions: {
                unitTests: {
                  generateModelTests: argv['tests-unit'],
                  generateValidationTests: argv['tests-unit'],
                  generateTypeGuardTests: argv['tests-unit'],
                  coverage: argv['tests-coverage']
                },
                integrationTests: {
                  generateServerTests: argv['tests-integration'],
                  generateHandlerTests: argv['tests-integration'],
                  generateClientTests: argv['tests-integration'],
                  generateCommunicationTests: argv['tests-integration']
                },
                e2eTests: {
                  generateBasicTests: argv['tests-e2e'],
                  generateDiagramTests: argv['tests-e2e'],
                  generateModelPersistenceTests: argv['tests-e2e'],
                  generateKeyboardShortcutTests: argv['tests-e2e']
                },
                coverage: argv['tests-coverage']
              },
              generateCICD: argv.ci,
              cicdOptions: {
                platforms: argv['ci-platforms'] as string[],
                nodeVersions: argv['ci-node-versions'] as string[],
                publishTargets: [
                  ...(argv['ci-publish-npm'] ? ['npm' as const] : []),
                  ...(argv['ci-publish-ovsx'] ? ['ovsx' as const] : [])
                ],
                containerSupport: argv['ci-docker'],
                workflows: {
                  generateBuildWorkflow: true,
                  generateReleaseWorkflow: true,
                  generateSecurityWorkflow: true,
                  generateDependencyUpdateWorkflow: true,
                  generateNightlyWorkflow: true
                }
              }
            });
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

// Type safety command
cli.command(
  ['types <grammar> [output]', 'type', 't'],
  'Generate type safety features from Langium grammar',
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
        default: '.',
        normalize: true
      })
      .option('declarations', {
        describe: 'Generate TypeScript declarations',
        type: 'boolean',
        default: true
      })
      .option('validation', {
        describe: 'Generate runtime validation',
        type: 'boolean',
        default: true
      })
      .option('guards', {
        describe: 'Generate type guards',
        type: 'boolean',
        default: true
      })
      .option('zod', {
        describe: 'Generate Zod schemas',
        type: 'boolean',
        default: true
      })
      .option('utilities', {
        describe: 'Generate type utilities',
        type: 'boolean',
        default: true
      })
      .option('all', {
        describe: 'Generate all type safety features',
        type: 'boolean',
        default: false
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .example('$0 types grammar.langium', 'Generate all type safety features')
      .example('$0 types grammar.langium --no-zod', 'Skip Zod schema generation')
      .example('$0 types grammar.langium --guards --validation', 'Only guards and validation');
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold('🔒 Generating Type Safety Features'));
      
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
      
      const typeSafetyOptions = argv.all ? {} : {
        declarations: argv.declarations,
        validation: argv.validation,
        guards: argv.guards,
        zodSchemas: argv.zod,
        utilities: argv.utilities
      };

      await generator.generateTypeSafety(grammarFile, argv.output!, typeSafetyOptions);
      
    } catch (error) {
      console.error(chalk.red(`❌ Type safety generation failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// Test generation command
cli.command(
  ['test <grammar> [output]', 'tests'],
  'Generate test infrastructure from Langium grammar',
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
        default: '.',
        normalize: true
      })
      .option('unit', {
        describe: 'Generate unit tests',
        type: 'boolean',
        default: true
      })
      .option('integration', {
        describe: 'Generate integration tests',
        type: 'boolean',
        default: true
      })
      .option('e2e', {
        describe: 'Generate E2E tests',
        type: 'boolean',
        default: true
      })
      .option('factories', {
        describe: 'Generate test data factories',
        type: 'boolean',
        default: true
      })
      .option('config', {
        describe: 'Generate test configurations',
        type: 'boolean',
        default: true
      })
      .option('coverage', {
        describe: 'Target code coverage percentage',
        type: 'number',
        default: 80
      })
      .option('no-install', {
        describe: 'Skip installing test dependencies',
        type: 'boolean',
        default: false
      })
      .example('$0 test grammar.langium', 'Generate all test infrastructure')
      .example('$0 test grammar.langium --unit --coverage 90', 'Unit tests with 90% coverage')
      .example('$0 test grammar.langium --e2e --no-install', 'E2E tests without installing deps');
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold('🧪 Generating Test Infrastructure'));
      
      const grammarFile = argv.grammar;
      if (!grammarFile || !await fs.pathExists(grammarFile)) {
        console.error(chalk.red(`❌ Grammar file not found: ${grammarFile || 'undefined'}`));
        process.exit(1);
      }

      const generator = new GLSPGenerator();
      
      const testOptions = {
        unitTests: {
          generateModelTests: argv.unit,
          generateValidationTests: argv.unit,
          generateTypeGuardTests: argv.unit,
          generateFactoryTests: argv.factories,
          coverage: argv.coverage
        },
        integrationTests: {
          generateServerTests: argv.integration,
          generateHandlerTests: argv.integration,
          generateClientTests: argv.integration,
          generateCommunicationTests: argv.integration
        },
        e2eTests: {
          generateBasicTests: argv.e2e,
          generateDiagramTests: argv.e2e,
          generateModelPersistenceTests: argv.e2e,
          generateKeyboardShortcutTests: argv.e2e
        },
        testData: {
          generateModelFactories: argv.factories,
          generateBuilders: argv.factories,
          generateMothers: argv.factories
        },
        testConfig: {
          generateJestConfig: argv.config,
          generatePlaywrightConfig: argv.config && argv.e2e,
          generateCoverageConfig: argv.config,
          generateGithubActions: argv.config
        },
        coverage: argv.coverage
      };

      await generator.generateTests(grammarFile, argv.output!, testOptions);
      
      if (!argv['no-install']) {
        console.log(chalk.blue('\n📦 Installing test dependencies...'));
        const { execSync } = await import('child_process');
        
        try {
          execSync('npm install --save-dev jest @jest/globals ts-jest @types/jest @faker-js/faker uuid @types/uuid', {
            cwd: argv.output,
            stdio: 'inherit'
          });
          
          if (argv.e2e) {
            execSync('npm install --save-dev @playwright/test playwright', {
              cwd: argv.output,
              stdio: 'inherit'
            });
            execSync('npx playwright install', {
              cwd: argv.output,
              stdio: 'inherit'
            });
          }
          
          console.log(chalk.green('✅ Test dependencies installed'));
        } catch (error) {
          console.warn(chalk.yellow('⚠️  Failed to install dependencies - run npm install manually'));
        }
      }
      
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray(`  cd ${argv.output}`));
      if (argv['no-install']) {
        console.log(chalk.gray('  npm install'));
      }
      console.log(chalk.gray('  npm test'));
      
    } catch (error) {
      console.error(chalk.red(`❌ Test generation failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);

// CI/CD command
cli.command(
  ['cicd <grammar> [output]', 'ci'],
  'Generate CI/CD configuration from Langium grammar',
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
        default: '.',
        normalize: true
      })
      .option('workflows', {
        describe: 'Generate GitHub Actions workflows',
        type: 'boolean',
        default: true
      })
      .option('scripts', {
        describe: 'Generate release scripts',
        type: 'boolean',
        default: true
      })
      .option('platforms', {
        describe: 'CI platforms to target',
        type: 'array',
        choices: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
        default: ['ubuntu-latest', 'windows-latest']
      })
      .option('node-versions', {
        describe: 'Node.js versions for CI',
        type: 'array',
        default: ['16.x', '18.x', '20.x']
      })
      .option('publish-npm', {
        describe: 'Include npm publishing',
        type: 'boolean',
        default: true
      })
      .option('publish-ovsx', {
        describe: 'Include Open VSX publishing',
        type: 'boolean',
        default: true
      })
      .option('docker', {
        describe: 'Include Docker support',
        type: 'boolean',
        default: true
      })
      .option('semantic-release', {
        describe: 'Use semantic-release',
        type: 'boolean',
        default: false
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .example('$0 cicd grammar.langium', 'Generate all CI/CD files')
      .example('$0 cicd grammar.langium --platforms ubuntu-latest', 'Ubuntu only')
      .example('$0 cicd grammar.langium --semantic-release', 'Use semantic-release');
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold('🚀 Generating CI/CD Configuration'));
      
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
      
      const cicdOptions = {
        platforms: argv.platforms as string[],
        nodeVersions: argv['node-versions'] as string[],
        publishTargets: [
          ...(argv['publish-npm'] ? ['npm' as const] : []),
          ...(argv['publish-ovsx'] ? ['ovsx' as const] : [])
        ],
        containerSupport: argv.docker,
        workflows: {
          generateBuildWorkflow: argv.workflows,
          generateReleaseWorkflow: argv.workflows,
          generateSecurityWorkflow: argv.workflows,
          generateDependencyUpdateWorkflow: argv.workflows,
          generateNightlyWorkflow: argv.workflows
        },
        releaseScripts: {
          generateVersionScripts: argv.scripts,
          generateChangelogScripts: argv.scripts,
          generatePublishScripts: argv.scripts,
          generateReleaseScript: argv.scripts,
          semanticRelease: argv['semantic-release']
        }
      };

      await generator.generateCICD(grammarFile, argv.output!, cicdOptions);
      
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Add secrets to your GitHub repository:'));
      console.log(chalk.gray('   - NPM_TOKEN (for npm publishing)'));
      console.log(chalk.gray('   - OVSX_TOKEN (for Open VSX publishing)'));
      console.log(chalk.gray('   - CODECOV_TOKEN (for coverage reports)'));
      console.log(chalk.gray('2. Enable branch protection rules'));
      console.log(chalk.gray('3. Configure Dependabot/Renovate'));
      
    } catch (error) {
      console.error(chalk.red(`❌ CI/CD generation failed: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
);



// Documentation command
cli.command(
  ['docs <grammar> [output]', 'doc', 'd'],
  'Generate documentation from Langium grammar',
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
        default: '.',
        normalize: true
      })
      .option('readme', {
        describe: 'Generate README.md',
        type: 'boolean',
        default: true
      })
      .option('api', {
        describe: 'Generate API documentation',
        type: 'boolean',
        default: true
      })
      .option('diagrams', {
        describe: 'Generate railroad diagrams',
        type: 'boolean',
        default: true
      })
      .option('examples', {
        describe: 'Generate example model files',
        type: 'boolean',
        default: true
      })
      .option('theme', {
        describe: 'Theme for diagrams',
        choices: ['light', 'dark'],
        default: 'light'
      })
      .option('no-screenshots', {
        describe: 'Skip screenshot placeholders',
        type: 'boolean',
        default: false
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
      })
      .example('$0 docs grammar.langium', 'Generate all documentation')
      .example('$0 docs grammar.langium ./docs', 'Custom output directory')
      .example('$0 docs grammar.langium --no-diagrams', 'Skip railroad diagrams')
      .example('$0 docs grammar.langium --theme dark', 'Use dark theme');
  },
  async (argv) => {
    try {
      console.log(chalk.blue.bold('📚 Generating Documentation'));
      
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
      
      const docsOptions = {
        readme: argv.readme,
        api: argv.api,
        diagrams: argv.diagrams,
        examples: argv.examples,
        theme: argv.theme as 'light' | 'dark',
        screenshots: !argv['no-screenshots']
      };

      await generator.generateDocumentation(grammarFile, argv.output!, docsOptions);
      
    } catch (error) {
      console.error(chalk.red(`❌ Documentation generation failed: ${error instanceof Error ? error.message : error}`));
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

// Template management commands
cli.command(
  'templates <command>',
  'Manage template packages',
  (yargs) => {
    return yargs
      .command(
        'list',
        'List installed template packages',
        {},
        async () => {
          try {
            const { TemplateSystem } = await import('./templates/index.js');
            const templateSystem = new TemplateSystem();
            const packages = await templateSystem.listPackages();
            
            if (packages.length === 0) {
              console.log(chalk.yellow('No template packages installed'));
              return;
            }
            
            console.log(chalk.blue('📦 Installed template packages:'));
            packages.forEach(pkg => {
              console.log(chalk.green(`  ✓ ${pkg.name}@${pkg.version}`));
              if (pkg.description) {
                console.log(chalk.gray(`    ${pkg.description}`));
              }
            });
          } catch (error) {
            console.error(chalk.red(`❌ Failed to list packages: ${error}`));
          }
        }
      )
      .command(
        'search <query>',
        'Search for template packages',
        (yargs) => {
          return yargs
            .positional('query', {
              describe: 'Search query',
              type: 'string'
            });
        },
        async (argv) => {
          try {
            if (!argv.query) {
              console.error(chalk.red('❌ Search query is required'));
              process.exit(1);
            }
            
            const { TemplateSystem } = await import('./templates/index.js');
            const templateSystem = new TemplateSystem();
            const packages = await templateSystem.searchPackages(argv.query);
            
            if (packages.length === 0) {
              console.log(chalk.yellow(`No packages found for "${argv.query}"`));
              return;
            }
            
            console.log(chalk.blue(`🔍 Found ${packages.length} package(s):`));
            packages.forEach(pkg => {
              const status = pkg.installed ? chalk.green('✓ installed') : chalk.gray('not installed');
              console.log(chalk.white(`  ${pkg.name}@${pkg.version} (${status})`));
              if (pkg.description) {
                console.log(chalk.gray(`    ${pkg.description}`));
              }
            });
          } catch (error) {
            console.error(chalk.red(`❌ Search failed: ${error}`));
          }
        }
      )
      .command(
        'install <package>',
        'Install a template package',
        (yargs) => {
          return yargs
            .positional('package', {
              describe: 'Package name',
              type: 'string'
            })
            .option('version', {
              describe: 'Package version',
              type: 'string'
            })
            .option('global', {
              alias: 'g',
              describe: 'Install globally',
              type: 'boolean',
              default: false
            });
        },
        async (argv) => {
          try {
            if (!argv.package) {
              console.error(chalk.red('❌ Package name is required'));
              process.exit(1);
            }
            
            const { TemplateSystem } = await import('./templates/index.js');
            const templateSystem = new TemplateSystem();
            
            const spinner = ora(`Installing ${argv.package}...`).start();
            await templateSystem.installPackage(argv.package, {
              version: argv.version,
              global: argv.global
            });
            spinner.succeed(`Successfully installed ${argv.package}`);
          } catch (error) {
            console.error(chalk.red(`❌ Installation failed: ${error}`));
          }
        }
      )
      .command(
        'validate <package>',
        'Validate a template package',
        (yargs) => {
          return yargs
            .positional('package', {
              describe: 'Package name or path',
              type: 'string'
            });
        },
        async (argv) => {
          try {
            if (!argv.package) {
              console.error(chalk.red('❌ Package name is required'));
              process.exit(1);
            }
            
            const { TemplateSystem } = await import('./templates/index.js');
            const templateSystem = new TemplateSystem();
            
            const result = await templateSystem.validatePackage(argv.package);
            
            if (result.valid) {
              console.log(chalk.green(`✅ ${argv.package} is valid`));
            } else {
              console.log(chalk.red(`❌ ${argv.package} is invalid:`));
              result.errors.forEach(error => {
                console.log(chalk.red(`  • ${error}`));
              });
              process.exit(1);
            }
          } catch (error) {
            console.error(chalk.red(`❌ Validation failed: ${error}`));
          }
        }
      )
      .demandCommand(1, 'You must specify a template command')
      .example('$0 templates list', 'List installed template packages')
      .example('$0 templates search glsp', 'Search for GLSP templates')
      .example('$0 templates install my-template', 'Install a template package')
      .example('$0 templates validate ./my-template', 'Validate a template package');
  }
);

// Performance commands
cli.command(
  'benchmark',
  'Run performance benchmarks',
  (yargs) => {
    return yargs
      .option('output', {
        alias: 'o',
        describe: 'Output directory for benchmark results',
        type: 'string',
        default: './benchmark-results'
      })
      .option('iterations', {
        alias: 'i',
        describe: 'Number of benchmark iterations',
        type: 'number',
        default: 1
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Verbose output',
        type: 'boolean',
        default: false
      })
      .example('$0 benchmark', 'Run all benchmarks')
      .example('$0 benchmark -o ./results', 'Save results to custom directory');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('🏃 Running performance benchmarks...'));
      
      const { BenchmarkSuite } = await import('../scripts/benchmark.js');
      const suite = new BenchmarkSuite();
      
      await suite.runAll();
      
      console.log(chalk.green('✅ Benchmarks completed'));
      console.log(chalk.gray(`Results saved to: ${argv.output}`));
    } catch (error) {
      console.error(chalk.red(`❌ Benchmark failed: ${error}`));
    }
  }
);

cli.command(
  'profile <grammar> [output]',
  'Profile grammar generation performance',
  (yargs) => {
    return yargs
      .positional('grammar', {
        describe: 'Langium grammar file',
        type: 'string'
      })
      .positional('output', {
        describe: 'Output directory',
        type: 'string',
        default: './profile-output'
      })
      .option('report', {
        alias: 'r',
        describe: 'Generate performance report',
        type: 'string',
        default: './performance-report.json'
      })
      .option('format', {
        alias: 'f',
        describe: 'Report format',
        choices: ['json', 'html', 'text'],
        default: 'json'
      })
      .example('$0 profile grammar.langium', 'Profile grammar generation')
      .example('$0 profile grammar.langium -r report.html -f html', 'Generate HTML report');
  },
  async (argv) => {
    try {
      console.log(chalk.blue('📊 Profiling grammar generation...'));
      
      const { GLSPGenerator } = await import('./generator.js');
      const { PerformanceOptimizer } = await import('./performance/index.js');
      
      // Create generator with profiling enabled
      const perfConfig = {
        enableCaching: true,
        enableParallelProcessing: true,
        enableStreaming: true,
        enableProgressIndicators: true,
        enableMemoryMonitoring: true,
        profileMode: true
      };
      
      const optimizer = new PerformanceOptimizer(perfConfig);
      const generator = new GLSPGenerator();
      
      if (!argv.grammar) {
        console.error(chalk.red('❌ Grammar parameter is required'));
        process.exit(1);
      }

      // Generate with profiling
      await generator.generateExtension(argv.grammar, argv.output, {
        performanceOptions: perfConfig
      });
      
      // Save performance report
      const monitor = optimizer.getMonitor();
      const validFormats = ['json', 'html', 'text'] as const;
      type ReportFormat = typeof validFormats[number];
      const format = (validFormats.includes(argv.format as ReportFormat)) ? argv.format as ReportFormat : 'json';
      
      await monitor.saveReport(argv.report, format);
      
      console.log(chalk.green('✅ Profiling completed'));
      console.log(chalk.gray(`Report saved to: ${argv.report}`));
    } catch (error) {
      console.error(chalk.red(`❌ Profiling failed: ${error}`));
    }
  }
);

cli.command(
  'cache',
  'Manage performance cache',
  (yargs) => {
    return yargs
      .command(
        'clear',
        'Clear all caches',
        {},
        async () => {
          try {
            const { AdvancedCacheManager } = await import('./performance/cache-manager.js');
            const cacheManager = new AdvancedCacheManager();
            
            cacheManager.invalidateAll();
            console.log(chalk.green('✅ Cache cleared'));
          } catch (error) {
            console.error(chalk.red(`❌ Failed to clear cache: ${error}`));
          }
        }
      )
      .command(
        'stats',
        'Show cache statistics',
        {},
        async () => {
          try {
            const { AdvancedCacheManager } = await import('./performance/cache-manager.js');
            const cacheManager = new AdvancedCacheManager();
            
            const stats = cacheManager.getStats();
            
            console.log(chalk.blue('📊 Cache Statistics:'));
            console.log(`  Hits: ${stats.hits}`);
            console.log(`  Misses: ${stats.misses}`);
            console.log(`  Hit Rate: ${stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) : 0}%`);
            console.log(`  Entries: ${stats.entryCount}`);
            console.log(`  Total Size: ${formatBytes(stats.totalSize)}`);
            console.log(`  Evictions: ${stats.evictions}`);
          } catch (error) {
            console.error(chalk.red(`❌ Failed to get cache stats: ${error}`));
          }
        }
      )
      .demandCommand(1, 'You must specify a cache command')
      .example('$0 cache clear', 'Clear all caches')
      .example('$0 cache stats', 'Show cache statistics');
  }
);

// Helper function for formatting bytes
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)}${units[unitIndex]}`;
}

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
    } else if (response.command === 'test') {
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

      if (inputs.grammar) {
        const args = ['test', inputs.grammar, inputs.output];
        if (!inputs.testTypes.includes('unit')) args.push('--no-unit');
        if (!inputs.testTypes.includes('integration')) args.push('--no-integration');
        if (!inputs.testTypes.includes('e2e')) args.push('--no-e2e');
        if (!inputs.testTypes.includes('factories')) args.push('--no-factories');
        args.push('--coverage', inputs.coverage.toString());
        cli.parse(args);
      }
    } else if (response.command === 'cicd') {
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

      if (inputs.grammar) {
        const args = ['cicd', inputs.grammar, inputs.output];
        if (!inputs.features.includes('workflows')) args.push('--no-workflows');
        if (!inputs.features.includes('scripts')) args.push('--no-scripts');
        if (!inputs.features.includes('docker')) args.push('--no-docker');
        if (inputs.features.includes('semantic')) args.push('--semantic-release');
        args.push('--platforms', ...inputs.platforms);
        cli.parse(args);
      }
    } else if (response.command === 'docs' || response.command === 'types') {
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
          initial: '.'
        }
      ]);

      if (inputs.grammar) {
        cli.parse([response.command, inputs.grammar, inputs.output]);
      }
    } else if (response.command === 'templates') {
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

      if (templateAction.action === 'search') {
        const query = await prompts({
          type: 'text',
          name: 'query',
          message: 'Enter search query:'
        });
        if (query.query) {
          cli.parse(['templates', 'search', query.query]);
        }
      } else if (templateAction.action === 'install') {
        const packageInput = await prompts({
          type: 'text',
          name: 'package',
          message: 'Enter package name:'
        });
        if (packageInput.package) {
          cli.parse(['templates', 'install', packageInput.package]);
        }
      } else if (templateAction.action === 'validate') {
        const packageInput = await prompts({
          type: 'text',
          name: 'package',
          message: 'Enter package name or path:'
        });
        if (packageInput.package) {
          cli.parse(['templates', 'validate', packageInput.package]);
        }
      } else {
        cli.parse(['templates', templateAction.action]);
      }
    } else if (response.command === 'profile') {
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
          initial: './profile-output'
        }
      ]);

      if (inputs.grammar) {
        cli.parse(['profile', inputs.grammar, inputs.output]);
      }
    } else if (response.command === 'cache') {
      const cacheAction = await prompts({
        type: 'select',
        name: 'action',
        message: 'What would you like to do with cache?',
        choices: [
          { title: 'Show statistics', value: 'stats' },
          { title: 'Clear cache', value: 'clear' }
        ]
      });

      cli.parse(['cache', cacheAction.action]);
    } else {
      cli.parse([response.command]);
    }
  })();
} else {
  // Parse command line arguments
  cli.parse();
}