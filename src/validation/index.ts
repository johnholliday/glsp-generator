/**
 * Validation module barrel export
 * @module validation
 */

export * from './linter';
export * from './diagnostics';
export * from './reporter';
export { 
  ValidationError, 
  ValidationWarning,
  ValidationResult as TemplateValidationResult,
  ProhibitedPattern,
  PackageJsonCheck,
  prohibitedPatterns
} from './template-validator';
export { 
  DiagnosticSeverity,
  Location,
  TextEdit,
  Fix,
  Diagnostic,
  ValidationResult,
  LinterRule,
  LinterContext,
  ValidationOptions
} from './types';