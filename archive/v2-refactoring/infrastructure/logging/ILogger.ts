/**
 * Logging interfaces following Interface Segregation Principle
 * @module infrastructure/logging
 */

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

/**
 * Log entry structure
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Additional context data */
  context?: Record<string, any>;
  /** Error object if applicable */
  error?: Error;
  /** Performance metrics */
  metrics?: LogMetrics;
}

/**
 * Performance metrics for logs
 */
export interface LogMetrics {
  /** Operation duration in ms */
  duration?: number;
  /** Memory usage in bytes */
  memoryUsage?: number;
  /** CPU usage percentage */
  cpuUsage?: number;
}

/**
 * Core logger interface
 * @interface ILogger
 */
export interface ILogger {
  /**
   * Logs an error message
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {Record<string, any>} context - Additional context
   */
  error(message: string, error?: Error, context?: Record<string, any>): void;

  /**
   * Logs a warning message
   * @param {string} message - Warning message
   * @param {Record<string, any>} context - Additional context
   */
  warn(message: string, context?: Record<string, any>): void;

  /**
   * Logs an info message
   * @param {string} message - Info message
   * @param {Record<string, any>} context - Additional context
   */
  info(message: string, context?: Record<string, any>): void;

  /**
   * Logs a debug message
   * @param {string} message - Debug message
   * @param {Record<string, any>} context - Additional context
   */
  debug(message: string, context?: Record<string, any>): void;

  /**
   * Logs a trace message
   * @param {string} message - Trace message
   * @param {Record<string, any>} context - Additional context
   */
  trace(message: string, context?: Record<string, any>): void;
}

/**
 * Structured logger interface
 * @interface IStructuredLogger
 */
export interface IStructuredLogger extends ILogger {
  /**
   * Logs a structured entry
   * @param {LogEntry} entry - Log entry
   */
  log(entry: LogEntry): void;

  /**
   * Sets correlation ID for all subsequent logs
   * @param {string} correlationId - Correlation ID
   */
  setCorrelationId(correlationId: string): void;

  /**
   * Creates a child logger with additional context
   * @param {Record<string, any>} context - Additional context
   * @returns {IStructuredLogger} Child logger
   */
  child(context: Record<string, any>): IStructuredLogger;

  /**
   * Sets the logging level
   * @param {LogLevel} level - The log level to set
   */
  setLevel(level: LogLevel): void;
}

/**
 * Performance logger interface
 * @interface IPerformanceLogger
 */
export interface IPerformanceLogger {
  /**
   * Starts a performance timer
   * @param {string} operation - Operation name
   * @returns {() => void} Stop function
   */
  startTimer(operation: string): () => void;

  /**
   * Logs performance metrics
   * @param {string} operation - Operation name
   * @param {LogMetrics} metrics - Performance metrics
   */
  logMetrics(operation: string, metrics: LogMetrics): void;
}

/**
 * Logger factory interface
 * @interface ILoggerFactory
 */
export interface ILoggerFactory {
  /**
   * Creates a logger instance
   * @param {string} name - Logger name
   * @param {LoggerConfig} config - Logger configuration
   * @returns {ILogger} Logger instance
   */
  createLogger(name: string, config?: LoggerConfig): ILogger;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level */
  level?: LogLevel;
  /** Output format */
  format?: 'json' | 'text' | 'pretty';
  /** Output targets */
  outputs?: LogOutput[];
  /** Include timestamp */
  timestamp?: boolean;
  /** Include correlation ID */
  correlationId?: boolean;
}

/**
 * Log output configuration
 */
export interface LogOutput {
  /** Output type */
  type: 'console' | 'file' | 'stream';
  /** Output level filter */
  level?: LogLevel;
  /** Output format override */
  format?: 'json' | 'text' | 'pretty';
  /** File path for file output */
  path?: string;
  /** Stream for stream output */
  stream?: NodeJS.WritableStream;
}

/**
 * Log formatter interface
 * @interface ILogFormatter
 */
export interface ILogFormatter {
  /**
   * Formats a log entry
   * @param {LogEntry} entry - Log entry
   * @returns {string} Formatted log string
   */
  format(entry: LogEntry): string;
}

/**
 * Log transport interface
 * @interface ILogTransport
 */
export interface ILogTransport {
  /**
   * Writes a log entry
   * @param {LogEntry} entry - Log entry
   * @returns {Promise<void>}
   */
  write(entry: LogEntry): Promise<void>;

  /**
   * Flushes pending logs
   * @returns {Promise<void>}
   */
  flush(): Promise<void>;

  /**
   * Closes the transport
   * @returns {Promise<void>}
   */
  close(): Promise<void>;
}