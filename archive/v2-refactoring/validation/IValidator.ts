/**
 * Validation interfaces following Interface Segregation Principle
 * @module validation/interfaces
 */

import { ValidationResult, ValidationContext, ValidationRule } from '../../core/models';
import { Grammar } from 'langium';

/**
 * Main validator interface for grammar validation
 * @interface IValidator
 * @public
 */
export interface IValidator {
  /**
   * Validates a grammar
   * @param grammar - The grammar to validate
   * @param context - Optional validation context
   * @returns Validation result with errors and warnings
   */
  validate(grammar: Grammar, context?: ValidationContext): Promise<ValidationResult>;
}

/**
 * Rule-based validator interface
 * @interface IRuleValidator
 * @public
 */
export interface IRuleValidator {
  /**
   * Adds a validation rule
   * @param rule - The validation rule to add
   */
  addRule(rule: ValidationRule): void;

  /**
   * Removes a validation rule
   * @param ruleName - The name of the rule to remove
   */
  removeRule(ruleName: string): void;

  /**
   * Gets all validation rules
   * @returns Array of validation rules
   */
  getRules(): ValidationRule[];
}

/**
 * Error collector interface
 * @interface IErrorCollector
 * @public
 */
export interface IErrorCollector {
  /**
   * Adds an error
   * @param error - The error to add
   */
  addError(error: any): void;

  /**
   * Adds a warning
   * @param warning - The warning to add
   */
  addWarning(warning: any): void;

  /**
   * Adds info
   * @param info - The info to add
   */
  addInfo(info: any): void;

  /**
   * Gets all errors
   * @returns Array of errors
   */
  getErrors(): any[];

  /**
   * Gets all warnings
   * @returns Array of warnings
   */
  getWarnings(): any[];

  /**
   * Gets all info messages
   * @returns Array of info messages
   */
  getInfo(): any[];

  /**
   * Clears all collected items
   */
  clear(): void;
}