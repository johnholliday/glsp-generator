import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { ILogger } from '../../utils/logger/index.js';
import { TYPES } from '../../config/di/types.js';
import { ICommand } from './command.interface.js';

@injectable()
export abstract class BaseCommand<T = any> implements ICommand<T> {
  abstract readonly command: string | string[];
  abstract readonly describe: string;
  readonly aliases?: string[];

  constructor(
    @inject(TYPES.Logger) protected readonly logger: ILogger
  ) { }

  abstract builder(yargs: Argv): Argv<T>;
  abstract handler(args: T): Promise<void>;

  protected handleError(error: unknown, showStack = false): never {
    this.logger.error('Command failed', error);

    if (showStack && error instanceof Error && error.stack) {
      this.logger.debug('Stack trace', { stack: error.stack });
    }

    process.exit(1);
  }

  protected async checkFileExists(filePath: string, fileType: string): Promise<void> {
    const fs = await import('fs-extra');
    if (!filePath || !await fs.pathExists(filePath)) {
      this.logger.error(`${fileType} file not found`, { path: filePath });
      throw new Error(`${fileType} file not found: ${filePath || 'undefined'}`);
    }
  }
}