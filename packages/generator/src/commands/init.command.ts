import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import path from 'path';
import { BaseCommand } from './base/base.command.js';
import { InteractiveHelper } from './base/interactive.helper.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { ConfigLoader } from '../config/config-loader.js';
import fs from 'fs-extra';

interface InitArgs {
  force?: boolean;
  path?: string;
}

@injectable()
export class InitCommand extends BaseCommand<InitArgs> {
  readonly command = ['init', 'config'];
  readonly describe = 'Create default .glsprc.json configuration file';
  readonly aliases = ['config'];

  private readonly interactive: InteractiveHelper;

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
    this.interactive = new InteractiveHelper(logger);
  }

  builder(yargs: Argv): Argv<InitArgs> {
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
      .example('$0 init -p ./config', 'Create in specific directory') as Argv<InitArgs>;
  }

  async handler(args: InitArgs): Promise<void> {
    try {
      this.logger.info('Creating GLSP configuration file');

      const outputPath = path.resolve(args.path || '.');
      const configPath = path.join(outputPath, '.glsprc.json');

      // Check if config already exists
      if (await fs.pathExists(configPath) && !args.force) {
        const overwrite = await this.interactive.confirm(
          'Configuration file already exists. Overwrite?',
          false
        );

        if (!overwrite) {
          this.logger.warn('Configuration creation cancelled');
          return;
        }

        await fs.remove(configPath);
      }

      await this.configLoader.createDefaultConfig(outputPath);
      this.logger.info('Configuration file created successfully', { path: configPath });
      this.logger.info(`Edit ${path.relative(process.cwd(), configPath)} to customize your extension`);

    } catch (error) {
      this.handleError(error);
    }
  }
}