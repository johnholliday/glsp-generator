import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { GLSPGenerator } from '../generator.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getUserProjectRoot } from '../utils/paths.js';

interface TypesArgs {
  grammar?: string;
  output?: string;
  declarations?: boolean;
  validation?: boolean;
  guards?: boolean;
  zod?: boolean;
  utilities?: boolean;
  all?: boolean;
  config?: string;
}

@injectable()
export class TypesCommand extends BaseCommand<TypesArgs> {
  readonly command = ['types <grammar> [output]', 'type', 't'];
  readonly describe = 'Generate type safety features from Langium grammar';
  readonly aliases = ['type', 't'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.GLSPGenerator) private readonly generator: GLSPGenerator,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<TypesArgs> {
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
      .example('$0 types grammar.langium --guards --validation', 'Only guards and validation') as Argv<TypesArgs>;
  }

  async handler(args: TypesArgs): Promise<void> {
    try {
      this.logger.info('Starting type safety generation');

      const grammarFile = args.grammar;
      if (!grammarFile) {
        throw new Error('Grammar file is required');
      }

      await this.checkFileExists(grammarFile, 'Grammar');

      // Load configuration if specified
      if (args.config) {
        await this.configLoader.loadConfig(getUserProjectRoot(), args.config);
      }

      const typeSafetyOptions = args.all ? {} : {
        declarations: args.declarations,
        validation: args.validation,
        guards: args.guards,
        zodSchemas: args.zod,
        utilities: args.utilities
      };

      await this.generator.generateTypeSafety(grammarFile, args.output!, typeSafetyOptions);

      this.logger.info('Type safety generation completed successfully');

    } catch (error) {
      this.handleError(error);
    }
  }
}