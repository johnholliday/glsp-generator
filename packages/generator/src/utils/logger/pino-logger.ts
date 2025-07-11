import { injectable } from 'inversify';
import type { Logger as PinoLoggerType } from 'pino';
import { ILogger } from './interfaces.js';

@injectable()
export class PinoLogger implements ILogger {
  constructor(private logger: PinoLoggerType) {}

  trace(msg: string, meta?: any): void {
    this.logger.trace(meta, msg);
  }

  debug(msg: string, meta?: any): void {
    this.logger.debug(meta, msg);
  }

  info(msg: string, meta?: any): void {
    this.logger.info(meta, msg);
  }

  warn(msg: string, meta?: any): void {
    this.logger.warn(meta, msg);
  }

  error(msg: string, error?: Error | unknown, meta?: any): void {
    if (error instanceof Error) {
      this.logger.error({ 
        ...meta, 
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }, msg);
    } else {
      this.logger.error({ ...meta, error }, msg);
    }
  }

  child(meta: any): ILogger {
    return new PinoLogger(this.logger.child(meta));
  }
}