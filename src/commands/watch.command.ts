import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';

interface WatchArgs {
  grammar?: string;
  output?: string;
  serve?: boolean;
  port?: number;
  debounce?: number;
  config?: string;
  clear?: boolean;
  verbose?: boolean;
}

@injectable()
export class WatchCommand extends BaseCommand<WatchArgs> {
  readonly command = ['watch <grammar> [output]', 'w'];
  readonly describe = 'Watch grammar and regenerate on changes';
  readonly aliases = ['w'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.PackageInfo) private readonly packageInfo: { version: string }
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<WatchArgs> {
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
      .example('$0 w grammar.langium --clear', 'Clear console between generations') as Argv<WatchArgs>;
  }

  async handler(args: WatchArgs): Promise<void> {
    try {
      const { GrammarWatcher } = await import('../watch/watcher.js');

      this.logger.info('GLSP Generator starting in watch mode', { version: this.packageInfo.version });

      if (!args.grammar) {
        throw new Error('Grammar file is required');
      }

      const watcher = new GrammarWatcher(args.grammar, args.output!, {
        serve: args.serve,
        port: args.port,
        debounceMs: args.debounce,
        config: args.config,
        clearConsole: args.clear,
        verbose: args.verbose
      });

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        this.logger.info('Shutting down watch mode');
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
      this.logger.error('Watch mode failed', error);
      this.handleError(error);
    }
  }
}