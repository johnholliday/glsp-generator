/**
 * Error handler interface for centralized error management
 * @module infrastructure/errors
 */

/**
 * Error handler interface
 * @interface IErrorHandler
 * @public
 */
export interface IErrorHandler {
  /**
   * Handles an error
   * @param error - The error to handle
   * @param context - Optional error context
   */
  handle(error: Error, context?: ErrorContext): void;

  /**
   * Handles an error asynchronously
   * @param error - The error to handle
   * @param context - Optional error context
   */
  handleAsync(error: Error, context?: ErrorContext): Promise<void>;

  /**
   * Registers an error handler
   * @param type - Error type to handle
   * @param handler - Error handler function
   */
  register(type: string, handler: ErrorHandlerFunction): void;

  /**
   * Wraps a function with error handling
   * @param fn - Function to wrap
   * @param context - Optional error context
   * @returns Wrapped function
   */
  wrap<T extends (...args: any[]) => any>(fn: T, context?: ErrorContext): T;

  /**
   * Wraps an async function with error handling
   * @param fn - Async function to wrap
   * @param context - Optional error context
   * @returns Wrapped async function
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: ErrorContext): T;
}

/**
 * Error context
 */
export interface ErrorContext {
  /** Operation being performed */
  operation?: string;
  /** Additional context data */
  data?: Record<string, any>;
  /** User-friendly message */
  userMessage?: string;
  /** Correlation ID */
  correlationId?: string;
}

/**
 * Error handler function type
 */
export type ErrorHandlerFunction = (error: Error, context?: ErrorContext) => void | Promise<void>;