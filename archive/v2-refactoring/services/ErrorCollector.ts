/**
 * Error collector implementation
 * @module validation/services
 */

import { injectable } from 'inversify';
import { IErrorCollector } from '../../core/interfaces/IValidator';
import { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  ValidationInfo,
  SourceLocation 
} from '../../core/models';

/**
 * Collects and aggregates validation errors, warnings, and info messages
 * Implements Single Responsibility: Error collection and aggregation
 */
@injectable()
export class ErrorCollector implements IErrorCollector {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private info: ValidationInfo[] = [];

  /**
   * Adds an error
   */
  addError(code: string, message: string, location?: any): void {
    this.errors.push({
      rule: code,
      message,
      location: this.normalizeLocation(location)
    });
  }

  /**
   * Adds a warning
   */
  addWarning(code: string, message: string, location?: any): void {
    this.warnings.push({
      rule: code,
      message,
      location: this.normalizeLocation(location)
    });
  }

  /**
   * Adds an info message
   */
  addInfo(code: string, message: string, location?: any): void {
    this.info.push({
      rule: code,
      message,
      location: this.normalizeLocation(location)
    });
  }

  /**
   * Gets collected errors
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Gets collected warnings
   */
  getWarnings(): ValidationWarning[] {
    return [...this.warnings];
  }

  /**
   * Gets collected info messages
   */
  getInfo(): ValidationInfo[] {
    return [...this.info];
  }

  /**
   * Checks if errors exist
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Converts to validation result
   */
  toValidationResult(): ValidationResult {
    return {
      isValid: !this.hasErrors(),
      errors: this.getErrors(),
      warnings: this.getWarnings(),
      info: this.getInfo()
    };
  }

  /**
   * Clears all collected items
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Merges another error collector into this one
   */
  merge(other: IErrorCollector): void {
    this.errors.push(...other.getErrors());
    this.warnings.push(...other.getWarnings());
    this.info.push(...(other as ErrorCollector).getInfo());
  }

  /**
   * Groups errors by file
   */
  groupByFile(): Map<string, ValidationResult> {
    const fileMap = new Map<string, {
      errors: ValidationError[];
      warnings: ValidationWarning[];
      info: ValidationInfo[];
    }>();

    // Group errors
    for (const error of this.errors) {
      const file = error.location?.file || '<unknown>';
      if (!fileMap.has(file)) {
        fileMap.set(file, { errors: [], warnings: [], info: [] });
      }
      fileMap.get(file)!.errors.push(error);
    }

    // Group warnings
    for (const warning of this.warnings) {
      const file = warning.location?.file || '<unknown>';
      if (!fileMap.has(file)) {
        fileMap.set(file, { errors: [], warnings: [], info: [] });
      }
      fileMap.get(file)!.warnings.push(warning);
    }

    // Group info
    for (const infoItem of this.info) {
      const file = infoItem.location?.file || '<unknown>';
      if (!fileMap.has(file)) {
        fileMap.set(file, { errors: [], warnings: [], info: [] });
      }
      fileMap.get(file)!.info.push(infoItem);
    }

    // Convert to validation results
    const results = new Map<string, ValidationResult>();
    for (const [file, items] of fileMap) {
      results.set(file, {
        isValid: items.errors.length === 0,
        errors: items.errors,
        warnings: items.warnings,
        info: items.info
      });
    }

    return results;
  }

  /**
   * Gets a summary of collected items
   */
  getSummary(): string {
    const parts: string[] = [];
    
    if (this.errors.length > 0) {
      parts.push(`${this.errors.length} error${this.errors.length === 1 ? '' : 's'}`);
    }
    
    if (this.warnings.length > 0) {
      parts.push(`${this.warnings.length} warning${this.warnings.length === 1 ? '' : 's'}`);
    }
    
    if (this.info.length > 0) {
      parts.push(`${this.info.length} info message${this.info.length === 1 ? '' : 's'}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No issues found';
  }

  /**
   * Formats all collected items as a string
   */
  format(verbose: boolean = false): string {
    const lines: string[] = [];
    
    // Format errors
    if (this.errors.length > 0) {
      lines.push('Errors:');
      for (const error of this.errors) {
        lines.push(this.formatItem('ERROR', error, verbose));
      }
      lines.push('');
    }
    
    // Format warnings
    if (this.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warning of this.warnings) {
        lines.push(this.formatItem('WARNING', warning, verbose));
      }
      lines.push('');
    }
    
    // Format info (only in verbose mode)
    if (verbose && this.info.length > 0) {
      lines.push('Information:');
      for (const infoItem of this.info) {
        lines.push(this.formatItem('INFO', infoItem, verbose));
      }
      lines.push('');
    }
    
    // Add summary
    lines.push(this.getSummary());
    
    return lines.join('\n');
  }

  /**
   * Private helper methods
   */
  private normalizeLocation(location: any): SourceLocation | undefined {
    if (!location) return undefined;
    
    // Already a proper SourceLocation
    if (location.file && location.startLine) {
      return location as SourceLocation;
    }
    
    // Convert from various formats
    return {
      file: location.file || location.path || '<unknown>',
      startLine: location.startLine || location.line || 1,
      startColumn: location.startColumn || location.column || 1,
      endLine: location.endLine || location.startLine || location.line || 1,
      endColumn: location.endColumn || location.startColumn || location.column || 1
    };
  }

  private formatItem(
    type: string, 
    item: ValidationError | ValidationWarning | ValidationInfo,
    verbose: boolean
  ): string {
    const location = item.location;
    const prefix = location 
      ? `  ${location.file}:${location.startLine}:${location.startColumn}`
      : '  <unknown location>';
    
    const message = `${prefix} - ${type}: ${item.message}`;
    
    if (verbose && item.rule) {
      return `${message} [${item.rule}]`;
    }
    
    return message;
  }
}