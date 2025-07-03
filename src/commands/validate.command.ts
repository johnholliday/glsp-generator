import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getUserProjectRoot } from '../utils/paths.js';
import ora from 'ora';

interface ValidateArgs {
  grammar?: string;
  debug?: boolean;
  report?: string;
  format?: 'markdown' | 'html';
  config?: string;
}

@injectable()
export class ValidateCommand extends BaseCommand<ValidateArgs> {
  readonly command = ['validate <grammar>', 'val', 'v'];
  readonly describe = 'Validate Langium grammar';
  readonly aliases = ['val', 'v'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<ValidateArgs> {
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
        choices: ['markdown', 'html'] as const,
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
      .example('$0 val grammar.langium -r report.html -f html', 'Generate HTML report') as Argv<ValidateArgs>;
  }

  async handler(args: ValidateArgs): Promise<void> {
    try {
      this.logger.info('Starting grammar validation');

      const grammarFile = args.grammar;
      if (!grammarFile) {
        throw new Error('Grammar file is required');
      }

      await this.checkFileExists(grammarFile, 'Grammar');

      // Load configuration if specified
      if (args.config) {
        await this.configLoader.loadConfig(getUserProjectRoot(), args.config);
      }

      const spinner = ora('Running validation...').start();

      const options = {
        generateReport: !!args.report,
        reportPath: args.report,
        reportFormat: args.format
      };

      const isValid = await this.generator.validateGrammar(grammarFile, options);

      if (isValid) {
        spinner.succeed('Grammar is valid');
        this.logger.info('No errors found');
      } else {
        spinner.fail('Grammar validation failed');
        this.logger.error('Please fix the errors above');
        process.exit(1);
      }
    } catch (error) {
      this.handleError(error, args.debug);
    }
  }
}