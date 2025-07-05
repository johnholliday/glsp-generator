import { injectable } from 'inversify';
import pino from 'pino';
import { ILogger, ILoggerFactory } from './interfaces.js';
import { PinoLogger } from './pino-logger.js';

@injectable()
export class LoggerFactory implements ILoggerFactory {
  private rootLogger: pino.Logger;

  constructor() {
    const streams: pino.StreamEntry[] = [];

    // SEQ stream - disable for now due to module loading issues
    // TODO: Fix pino-seq import issue
    if (false && process.env.SEQ_ENABLED !== 'false' && process.env.NODE_ENV !== 'test') {
      // const seqStream = pinoSeq.createStream({
      //   serverUrl: process.env.SEQ_URL || 'http://localhost:5341',
      //   apiKey: process.env.SEQ_API_KEY || '',
      //   logOtherAs: 'Verbose'
      // });
      // streams.push({ stream: seqStream });
    }

    // Console stream - simple stdout for now
    if (process.env.NODE_ENV !== 'test') {
      streams.push({ stream: process.stdout });
    }

    this.rootLogger = pino({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'trace'),
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        app: 'glsp-generator',
        version: process.env.npm_package_version || '2.1.8',
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'localhost'
      }
    }, streams.length > 0 ? pino.multistream(streams) : process.stdout);
  }

  createLogger(component: string): ILogger {
    return new PinoLogger(this.rootLogger.child({ component }));
  }
}