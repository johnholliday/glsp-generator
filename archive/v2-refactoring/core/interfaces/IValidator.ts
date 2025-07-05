/**
 * Validator interfaces following Interface Segregation Principle
 * @module core/interfaces
 */

import { Grammar, LangiumDocument, ValidationAcceptor } from 'langium';
import { ValidationResult, ValidationRule, ValidationContext } from '../models';

/**
 * Core validator interface
 * @interface IValidator
 */
export interface IValidator {
  /**
   * Validates a Langium Grammar
   * @param {Grammar} grammar - Grammar to validate
   * @param {ValidationContext} context - Validation context
   * @returns {Promise<ValidationResult>} Validation result
   * @example
   * ```typescript
   * const result = await validator.validate(grammar, {
   *   strict: true,
   *   customRules: [myCustomRule]
   * });
   * ```
   */
  validate(grammar: Grammar, context?: ValidationContext): Promise<ValidationResult>;

  /**
   * Validates a Langium document
   * @param {LangiumDocument} document - Document to validate
   * @param {ValidationContext} context - Validation context
   * @returns {Promise<ValidationResult>} Validation result
   */
  validateDocument(document: LangiumDocument, context?: ValidationContext): Promise<ValidationResult>;
}

/**
 * Schema validator for structural validation
 * @interface ISchemaValidator
 */
export interface ISchemaValidator {
  /**
   * Validates against a schema
   * @param {any} data - Data to validate
   * @param {any} schema - Schema definition
   * @returns {ValidationResult} Validation result
   */
  validateSchema(data: any, schema: any): ValidationResult;
}

/**
 * Rule-based validator for business logic validation
 * @interface IRuleValidator
 */
export interface IRuleValidator {
  /**
   * Validates using a set of rules
   * @param {Grammar} grammar - Grammar to validate
   * @param {ValidationRule[]} rules - Validation rules
   * @returns {Promise<ValidationResult>} Validation result
   */
  validateRules(grammar: Grammar, rules: ValidationRule[]): Promise<ValidationResult>;
}

/**
 * Validation rule interface for Langium
 * @interface IValidationRule
 */
export interface IValidationRule {
  /**
   * Rule name
   */
  readonly name: string;

  /**
   * Rule severity
   */
  readonly severity: 'error' | 'warning' | 'info';

  /**
   * Validates the Grammar against this rule
   * @param {Grammar} grammar - Grammar to validate
   * @param {ValidationAcceptor} acceptor - Langium validation acceptor
   * @param {ValidationContext} context - Validation context
   * @returns {Promise<void>}
   */
  validate(grammar: Grammar, acceptor: ValidationAcceptor, context: ValidationContext): Promise<void>;
}

/**
 * Validation rule factory
 * @interface IValidationRuleFactory
 */
export interface IValidationRuleFactory {
  /**
   * Creates a validation rule
   * @param {string} type - Rule type
   * @param {any} config - Rule configuration
   * @returns {IValidationRule} Created rule
   */
  createRule(type: string, config: any): IValidationRule;
}

/**
 * Error collector for aggregating validation errors
 * @interface IErrorCollector
 */
export interface IErrorCollector {
  /**
   * Adds an error
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {any} location - Error location
   * @returns {void}
   */
  addError(code: string, message: string, location?: any): void;

  /**
   * Adds a warning
   * @param {string} code - Warning code
   * @param {string} message - Warning message
   * @param {any} location - Warning location
   * @returns {void}
   */
  addWarning(code: string, message: string, location?: any): void;

  /**
   * Adds an info message
   * @param {string} code - Info code
   * @param {string} message - Info message
   * @param {any} location - Info location
   * @returns {void}
   */
  addInfo(code: string, message: string, location?: any): void;

  /**
   * Gets collected errors
   * @returns {any[]} Collected errors
   */
  getErrors(): any[];

  /**
   * Gets collected warnings
   * @returns {any[]} Collected warnings
   */
  getWarnings(): any[];

  /**
   * Checks if errors exist
   * @returns {boolean} True if errors exist
   */
  hasErrors(): boolean;

  /**
   * Converts to validation result
   * @returns {ValidationResult} Validation result
   */
  toValidationResult(): ValidationResult;
}

/**
 * Async validator for complex validation logic
 * @interface IAsyncValidator
 */
export interface IAsyncValidator {
  /**
   * Performs async validation
   * @param {Grammar} grammar - Grammar to validate
   * @returns {AsyncIterable<ValidationResult>} Stream of validation results
   */
  validateAsync(grammar: Grammar): AsyncIterable<ValidationResult>;
}