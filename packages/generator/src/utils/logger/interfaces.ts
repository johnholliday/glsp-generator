export interface ILogger {
  trace(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
  info(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  error(msg: string, error?: Error | unknown, meta?: any): void;
  child(meta: any): ILogger;
}

export interface ILoggerFactory {
  createLogger(component: string): ILogger;
}