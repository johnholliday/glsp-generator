import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';

interface CacheArgs {
    force?: boolean;
}

@injectable()
export class CacheCommand extends BaseCommand<CacheArgs> {

    readonly command = 'cache';
    readonly describe = 'Cache generated files';

    constructor(@inject(TYPES.Logger) logger: ILogger) {
        super(logger);
    }

    builder(yargs: Argv): Argv<CacheArgs> {
        return yargs
            .option('force', {
                alias: 'f',
                describe: 'Force cache',
                type: 'boolean',
                default: false
            })
    }

    async handler(_args: CacheArgs): Promise<void> {
        try {
            this.logger.info('Starting cache operation');

        } catch (error) {
            this.handleError(error);
        }
    }
}