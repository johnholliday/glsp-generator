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

    // Console stream - disable JSON logging for CLI usage
    if (process.env.NODE_ENV !== 'test') {
      // For now, we'll suppress pino's JSON output in favor of the spinner/progress output
      // The CLI uses ora spinners and custom console output for user interaction
      // TODO: Implement proper pretty printing with pino-pretty
      if (process.env.LOG_FORMAT === 'json') {
        streams.push({ stream: process.stdout });
      }
    }

    // Default to silent for CLI usage unless explicitly set
    const defaultLevel = process.env.NODE_ENV === 'test' ? 'silent' : 
                        process.env.LOG_FORMAT === 'json' ? 'info' : 'silent';
    
    this.rootLogger = pino({
      level: process.env.LOG_LEVEL || defaultLevel,
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

// Standalone createLogger function for convenience
export function createLogger(component: string): ILogger {
  const factory = new LoggerFactory();
  return factory.createLogger(component);
}