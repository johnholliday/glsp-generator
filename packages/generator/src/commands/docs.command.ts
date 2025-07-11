import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getUserProjectRoot } from '../utils/paths.js';

interface DocsArgs {
  grammar?: string;
  output?: string;
  readme?: boolean;
  api?: boolean;
  diagrams?: boolean;
  examples?: boolean;
  theme?: 'light' | 'dark';
  'no-screenshots'?: boolean;
  config?: string;
}

@injectable()
export class DocsCommand extends BaseCommand<DocsArgs> {
  readonly command = ['docs <grammar> [output]', 'doc', 'd'];
  readonly describe = 'Generate documentation from Langium grammar';
  readonly aliases = ['doc', 'd'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<DocsArgs> {
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
        choices: ['light', 'dark'] as const,
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
      .example('$0 docs grammar.langium --theme dark', 'Use dark theme') as Argv<DocsArgs>;
  }

  async handler(args: DocsArgs): Promise<void> {
    try {
      this.logger.info('Starting documentation generation');

      const grammarFile = args.grammar;
      if (!grammarFile) {
        throw new Error('Grammar file is required');
      }

      await this.checkFileExists(grammarFile, 'Grammar');

      // Load configuration if specified
      if (args.config) {
        await this.configLoader.loadConfig(getUserProjectRoot(), args.config);
      }

      const docsOptions = {
        readme: args.readme,
        api: args.api,
        diagrams: args.diagrams,
        examples: args.examples,
        theme: args.theme,
        screenshots: !args['no-screenshots']
      };

      await this.generator.generateDocumentation(grammarFile, args.output!, docsOptions);

      this.logger.info('Documentation generation completed successfully');

    } catch (error) {
      this.handleError(error);
    }
  }
}