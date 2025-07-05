/**
 * Simple console logger implementation
 * @module infrastructure/logging
 */

import { injectable } from 'inversify';
import { IStructuredLogger, IPerformanceLogger, LogLevel, LogEntry } from './ILogger';

/**
 * Console-based logger implementation
 * Implements both IStructuredLogger and IPerformanceLogger
 */
@injectable()
export class ConsoleLogger implements IStructuredLogger, IPerformanceLogger {
  private correlationId?: string;
  private context: Record<string, any> = {};
  private readonly timers = new Map<string, number>();
  private logLevel: LogLevel = LogLevel.INFO;

  /**
   * IStructuredLogger implementation
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: { ...this.context, ...context },
      error
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: { ...this.context, ...context }
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: { ...this.context, ...context }
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: { ...this.context, ...context }
    });
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.TRACE,
      message,
      timestamp: new Date(),
      correlationId: this.correlationId,
      context: { ...this.context, ...context }
    });
  }

  log(entry: LogEntry): void {
    // Check if we should log this level
    if (entry.level > this.logLevel) {
      return;
    }

    const level = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = Object.keys(entry.context || {}).length > 0 
      ? ` ${JSON.stringify(entry.context)}` 
      : '';
    
    const message = `[${timestamp}] [${level}]${entry.correlationId ? ` [${entry.correlationId}]` : ''} ${entry.message}${contextStr}`;
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(message);
        break;
    }
  }

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  child(context: Record<string, any>): IStructuredLogger {
    const child = new ConsoleLogger();
    child.correlationId = this.correlationId;
    child.context = { ...this.context, ...context };
    child.logLevel = this.logLevel;
    return child;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * IPerformanceLogger implementation
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    this.timers.set(operation, startTime);
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.timers.delete(operation);
      
      this.logMetrics(operation, { duration });
    };
  }

  logMetrics(operation: string, metrics: any): void {
    this.info(`Performance: ${operation}`, { metrics });
  }
}