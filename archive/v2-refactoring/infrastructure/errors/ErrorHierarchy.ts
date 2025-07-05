/**
 * Error hierarchy for GLSP Generator
 * @module infrastructure/errors
 */

import { SourceLocation } from '../../core/models';

/**
 * Base error class for all GLSP Generator errors
 */
export abstract class GLSPGeneratorError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;
  /** Error timestamp */
  public readonly timestamp: Date;
  /** Correlation ID for tracing */
  public readonly correlationId?: string;
  /** Additional error context */
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends GLSPGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', context);
  }
}

/**
 * File system operation errors
 */
export class FileSystemError extends GLSPGeneratorError {
  public readonly path: string;
  public readonly operation: 'read' | 'write' | 'delete' | 'mkdir';

  constructor(
    message: string,
    path: string,
    operation: 'read' | 'write' | 'delete' | 'mkdir',
    context?: Record<string, any>
  ) {
    super(message, 'FS_ERROR', { ...context, path, operation });
    this.path = path;
    this.operation = operation;
  }
}

/**
 * Grammar parsing errors
 */
export class GrammarParseError extends GLSPGeneratorError {
  public readonly location?: SourceLocation;
  public readonly grammarFile: string;

  constructor(
    message: string,
    grammarFile: string,
    location?: SourceLocation,
    context?: Record<string, any>
  ) {
    super(message, 'PARSE_ERROR', { ...context, grammarFile, location });
    this.grammarFile = grammarFile;
    this.location = location;
  }
}

/**
 * Grammar validation errors
 */
export class GrammarValidationError extends GLSPGeneratorError {
  public readonly violations: ValidationViolation[];

  constructor(
    message: string,
    violations: ValidationViolation[],
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, violations });
    this.violations = violations;
  }
}

/**
 * Template rendering errors
 */
export class TemplateError extends GLSPGeneratorError {
  public readonly templateName: string;
  public readonly templateError?: Error;

  constructor(
    message: string,
    templateName: string,
    templateError?: Error,
    context?: Record<string, any>
  ) {
    super(message, 'TEMPLATE_ERROR', { ...context, templateName });
    this.templateName = templateName;
    this.templateError = templateError;
  }
}

/**
 * Plugin-related errors
 */
export class PluginError extends GLSPGeneratorError {
  public readonly pluginName: string;
  public readonly pluginError?: Error;

  constructor(
    message: string,
    pluginName: string,
    pluginError?: Error,
    context?: Record<string, any>
  ) {
    super(message, 'PLUGIN_ERROR', { ...context, pluginName });
    this.pluginName = pluginName;
    this.pluginError = pluginError;
  }
}

/**
 * Type resolution errors
 */
export class TypeResolutionError extends GLSPGeneratorError {
  public readonly typeName: string;
  public readonly location?: SourceLocation;

  constructor(
    message: string,
    typeName: string,
    location?: SourceLocation,
    context?: Record<string, any>
  ) {
    super(message, 'TYPE_ERROR', { ...context, typeName, location });
    this.typeName = typeName;
    this.location = location;
  }
}

/**
 * Import resolution errors
 */
export class ImportResolutionError extends GLSPGeneratorError {
  public readonly importPath: string;
  public readonly fromFile: string;

  constructor(
    message: string,
    importPath: string,
    fromFile: string,
    context?: Record<string, any>
  ) {
    super(message, 'IMPORT_ERROR', { ...context, importPath, fromFile });
    this.importPath = importPath;
    this.fromFile = fromFile;
  }
}

/**
 * Generation process errors
 */
export class GenerationError extends GLSPGeneratorError {
  public readonly phase: 'parse' | 'validate' | 'render' | 'write';
  public readonly causeError?: Error;

  constructor(
    message: string,
    phase: 'parse' | 'validate' | 'render' | 'write',
    causeError?: Error,
    context?: Record<string, any>
  ) {
    super(message, 'GENERATION_ERROR', { ...context, phase });
    this.phase = phase;
    this.causeError = causeError;
  }
}

/**
 * CLI-specific errors
 */
export class CLIError extends GLSPGeneratorError {
  public readonly command: string;
  public readonly args: string[];

  constructor(
    message: string,
    command: string,
    args: string[],
    context?: Record<string, any>
  ) {
    super(message, 'CLI_ERROR', { ...context, command, args });
    this.command = command;
    this.args = args;
  }
}

/**
 * Validation violation details
 */
export interface ValidationViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: SourceLocation;
}

/**
 * Error codes enumeration
 */
export enum ErrorCode {
  // Configuration errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  
  // File system errors
  FS_READ_ERROR = 'FS_READ_ERROR',
  FS_WRITE_ERROR = 'FS_WRITE_ERROR',
  FS_PERMISSION_ERROR = 'FS_PERMISSION_ERROR',
  
  // Grammar errors
  GRAMMAR_PARSE_ERROR = 'GRAMMAR_PARSE_ERROR',
  GRAMMAR_SYNTAX_ERROR = 'GRAMMAR_SYNTAX_ERROR',
  GRAMMAR_VALIDATION_ERROR = 'GRAMMAR_VALIDATION_ERROR',
  
  // Type errors
  TYPE_NOT_FOUND = 'TYPE_NOT_FOUND',
  TYPE_CIRCULAR_REF = 'TYPE_CIRCULAR_REF',
  
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_COMPILE_ERROR = 'TEMPLATE_COMPILE_ERROR',
  TEMPLATE_RENDER_ERROR = 'TEMPLATE_RENDER_ERROR',
  
  // Plugin errors
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  PLUGIN_INIT_ERROR = 'PLUGIN_INIT_ERROR',
  
  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_ABORTED = 'GENERATION_ABORTED',
}