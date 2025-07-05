/**
 * Error handler service
 * @module infrastructure/errors
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../di/symbols';
import { IStructuredLogger } from '../logging/ILogger';
import { GLSPGeneratorError } from './ErrorHierarchy';

/**
 * Error handler interface
 */
export interface IErrorHandler {
  handle(error: Error): void;
  handleAsync(error: Error): Promise<void>;
  isRecoverable(error: Error): boolean;
  getErrorCode(error: Error): string;
  formatError(error: Error): string;
}

/**
 * Central error handler implementation
 */
@injectable()
export class ErrorHandler implements IErrorHandler {
  constructor(
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger
  ) {}

  /**
   * Handles an error synchronously
   */
  handle(error: Error): void {
    this.logger.error('Error occurred', error, {
      errorType: error.constructor.name,
      code: this.getErrorCode(error),
      recoverable: this.isRecoverable(error)
    });

    // Re-throw if not recoverable
    if (!this.isRecoverable(error)) {
      throw error;
    }
  }

  /**
   * Handles an error asynchronously
   */
  async handleAsync(error: Error): Promise<void> {
    this.handle(error);
  }

  /**
   * Determines if an error is recoverable
   */
  isRecoverable(error: Error): boolean {
    // GLSP Generator errors are generally recoverable
    if (error instanceof GLSPGeneratorError) {
      // Except for critical errors
      return error.code !== 'CRITICAL_ERROR';
    }

    // System errors are not recoverable
    if (error.name === 'SystemError') {
      return false;
    }

    // Default to recoverable
    return true;
  }

  /**
   * Gets the error code
   */
  getErrorCode(error: Error): string {
    if (error instanceof GLSPGeneratorError) {
      return error.code;
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Formats an error for display
   */
  formatError(error: Error): string {
    if (error instanceof GLSPGeneratorError) {
      const context = error.context 
        ? `\nContext: ${JSON.stringify(error.context, null, 2)}`
        : '';
      
      return `${error.name} [${error.code}]: ${error.message}${context}`;
    }
    
    return `${error.name}: ${error.message}`;
  }
}