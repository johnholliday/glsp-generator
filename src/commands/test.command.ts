import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';

interface TestArgs {
  grammar?: string;
  output?: string;
  unit?: boolean;
  integration?: boolean;
  e2e?: boolean;
  factories?: boolean;
  config?: boolean;
  coverage?: number;
  'no-install'?: boolean;
}

@injectable()
export class TestCommand extends BaseCommand<TestArgs> {
  readonly command = ['test <grammar> [output]', 'tests'];
  readonly describe = 'Generate test infrastructure from Langium grammar';
  readonly aliases = ['tests'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<TestArgs> {
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
      .example('$0 test grammar.langium --e2e --no-install', 'E2E tests without installing deps') as Argv<TestArgs>;
  }

  async handler(args: TestArgs): Promise<void> {
    try {
      this.logger.info('Starting test infrastructure generation');

      const grammarFile = args.grammar;
      if (!grammarFile) {
        throw new Error('Grammar file is required');
      }

      await this.checkFileExists(grammarFile, 'Grammar');

      const testOptions = {
        unitTests: {
          generateModelTests: args.unit,
          generateValidationTests: args.unit,
          generateTypeGuardTests: args.unit,
          generateFactoryTests: args.factories,
          coverage: args.coverage
        },
        integrationTests: {
          generateServerTests: args.integration,
          generateHandlerTests: args.integration,
          generateClientTests: args.integration,
          generateCommunicationTests: args.integration
        },
        e2eTests: {
          generateBasicTests: args.e2e,
          generateDiagramTests: args.e2e,
          generateModelPersistenceTests: args.e2e,
          generateKeyboardShortcutTests: args.e2e
        },
        testData: {
          generateModelFactories: args.factories,
          generateBuilders: args.factories,
          generateMothers: args.factories
        },
        testConfig: {
          generateJestConfig: args.config,
          generatePlaywrightConfig: args.config && args.e2e,
          generateCoverageConfig: args.config,
          generateGithubActions: args.config
        },
        coverage: args.coverage
      };

      await this.generator.generateTests(grammarFile, args.output!, testOptions);

      if (!args['no-install']) {
        this.logger.info('Installing test dependencies...');
        const { execSync } = await import('child_process');

        try {
          execSync('npm install --save-dev jest @jest/globals ts-jest @types/jest @faker-js/faker uuid @types/uuid', {
            cwd: args.output,
            stdio: 'inherit'
          });

          if (args.e2e) {
            execSync('npm install --save-dev @playwright/test playwright', {
              cwd: args.output,
              stdio: 'inherit'
            });
            execSync('npx playwright install', {
              cwd: args.output,
              stdio: 'inherit'
            });
          }

          this.logger.info('Test dependencies installed successfully');
        } catch (error) {
          this.logger.warn('Failed to install dependencies - run npm install manually');
        }
      }

      this.logger.info('Test infrastructure generated successfully');
      this.logger.info('Next steps:');
      this.logger.info(`  cd ${args.output}`);
      if (args['no-install']) {
        this.logger.info('  npm install');
      }
      this.logger.info('  npm test');

    } catch (error) {
      this.handleError(error);
    }
  }
}