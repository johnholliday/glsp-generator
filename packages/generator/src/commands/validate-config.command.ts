import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import path from 'path';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getUserProjectRoot } from '../utils/paths.js';
import fs from 'fs-extra';

interface ValidateConfigArgs {
  config?: string;
  verbose?: boolean;
}

@injectable()
export class ValidateConfigCommand extends BaseCommand<ValidateConfigArgs> {
  readonly command = 'validate-config [config]';
  readonly describe = 'Validate GLSP configuration file';

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.ConfigLoader) private readonly configLoader: ConfigLoader
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<ValidateConfigArgs> {
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
      .example('$0 validate-config ./config/.glsprc.json', 'Validate specific config file') as Argv<ValidateConfigArgs>;
  }

  async handler(args: ValidateConfigArgs): Promise<void> {
    try {
      this.logger.info('Validating configuration file');

      const configPath = path.resolve(args.config || '.glsprc.json');
      if (!await fs.pathExists(configPath)) {
        this.logger.error('Configuration file not found', { path: configPath });
        process.exit(1);
      }

      const result = await this.configLoader.validateConfigFile(configPath);

      if (result.valid) {
        this.logger.info('Configuration is valid');

        if (args.verbose) {
          const config = await this.configLoader.loadConfig(getUserProjectRoot(), configPath);
          this.logger.debug('Loaded configuration:', { config });
        }
      } else {
        this.logger.error('Configuration validation failed:');
        result.errors?.forEach(error => {
          this.logger.error(`  ${error}`);
        });
        process.exit(1);
      }

    } catch (error) {
      this.handleError(error);
    }
  }
}