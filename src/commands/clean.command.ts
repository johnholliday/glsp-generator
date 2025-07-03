import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { InteractiveHelper } from './base/interactive.helper.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import fs from 'fs-extra';
import ora from 'ora';

interface CleanArgs {
  force?: boolean;
}

@injectable()
export class CleanCommand extends BaseCommand<CleanArgs> {
  readonly command = 'clean';
  readonly describe = 'Clean all generated files';

  private readonly interactive: InteractiveHelper;

  constructor(@inject(TYPES.Logger) logger: ILogger) {
    super(logger);
    this.interactive = new InteractiveHelper(logger);
  }

  builder(yargs: Argv): Argv<CleanArgs> {
    return yargs
      .option('force', {
        alias: 'f',
        describe: 'Force clean without confirmation',
        type: 'boolean',
        default: false
      })
      .example('$0 clean', 'Clean generated files')
      .example('$0 clean -f', 'Force clean without confirmation') as Argv<CleanArgs>;
  }

  async handler(args: CleanArgs): Promise<void> {
    try {
      this.logger.info('Starting clean operation');

      const dirsToClean = ['dist', 'generated', 'output'];
      const existingDirs: string[] = [];

      for (const dir of dirsToClean) {
        if (await fs.pathExists(dir)) {
          existingDirs.push(dir);
        }
      }

      if (existingDirs.length === 0) {
        this.logger.warn('No generated files found');
        return;
      }

      this.logger.info('Directories to clean:', { directories: existingDirs });

      if (!args.force) {
        const confirm = await this.interactive.confirm('Delete these directories?', true);
        if (!confirm) {
          this.logger.warn('Clean cancelled');
          return;
        }
      }

      const spinner = ora('Cleaning...').start();

      for (const dir of existingDirs) {
        await fs.remove(dir);
        this.logger.debug(`Removed directory: ${dir}`);
      }

      spinner.succeed('Clean complete');
      this.logger.info('All generated files removed');

    } catch (error) {
      this.handleError(error);
    }
  }
}