/**
 * Core domain models for GLSP Generator
 * @module core/models
 */

/**
 * Generation configuration
 */
export interface GenerationConfig {
  /** Path to grammar file */
  grammarPath: string;
  /** Output directory */
  outputDir: string;
  /** Generation options */
  options?: GenerationOptions;
  /** Plugins to use */
  plugins?: string[];
}

/**
 * Generation options
 */
export interface GenerationOptions {
  /** Validate before generation */
  validate?: boolean;
  /** Validation only mode */
  validateOnly?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Target platform */
  target?: 'theia' | 'vscode' | 'both';
  /** Template set to use */
  templates?: string[];
  /** Custom template directory */
  templateDir?: string;
  /** Skip file writing */
  dryRun?: boolean;
  /** Strict mode (fail on warnings) */
  strict?: boolean;
  /** Package name for generated extension */
  packageName?: string;
  /** Version for generated extension */
  version?: string;
  /** Force overwrite existing files */
  force?: boolean;
  /** Plugins to load */
  plugins?: string[];
  /** Plugin directory */
  pluginDir?: string;
  /** Enable metrics */
  enableMetrics?: boolean;
  /** Timeout in ms */
  timeout?: number;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Validation options */
  validationOptions?: ValidationContext;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Success status */
  success: boolean;
  /** Generated files */
  files: GeneratedFile[];
  /** Errors encountered */
  errors: GenerationError[];
  /** Warnings encountered */
  warnings: GenerationWarning[];
  /** Generation metadata */
  metadata?: GenerationMetadata;
  /** Output directory path */
  outputDir?: string;
  /** Number of files generated (convenience property) */
  filesGenerated?: number;
}

/**
 * Generated file
 */
export interface GeneratedFile {
  /** File path relative to output directory */
  path: string;
  /** File content */
  content: string;
  /** File encoding */
  encoding?: BufferEncoding;
  /** File permissions */
  mode?: number;
}

/**
 * Generation error
 */
export class GenerationError extends Error {
  /** Error code */
  code: string;
  /** Error severity */
  severity: 'error' | 'fatal';
  /** Error location */
  location?: SourceLocation;

  constructor(
    message: string,
    code: string,
    severity: 'error' | 'fatal' = 'error',
    location?: SourceLocation
  ) {
    super(message);
    this.name = 'GenerationError';
    this.code = code;
    this.severity = severity;
    this.location = location;
  }
}

/**
 * Generation warning
 */
export interface GenerationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Warning severity */
  severity: 'warning' | 'info';
  /** Warning location */
  location?: SourceLocation;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Generation timestamp */
  timestamp: Date;
  /** Generator version */
  generatorVersion: string;
  /** Grammar file hash */
  grammarHash: string;
  /** Generation duration in ms */
  duration: number;
  /** Files generated count */
  filesGenerated: number;
  /** Grammar information */
  grammarInfo?: {
    name: string;
    interfaces: number;
    rules: number;
  };
}

// Note: We now use Langium's Grammar AST directly instead of custom types
// The Grammar type from Langium provides all necessary AST information

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  isValid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Validation info */
  info: ValidationInfo[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error rule */
  rule: string;
  /** Error message */
  message: string;
  /** Error location */
  location?: SourceLocation;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning rule */
  rule: string;
  /** Warning message */
  message: string;
  /** Warning location */
  location?: SourceLocation;
}

/**
 * Validation info
 */
export interface ValidationInfo {
  /** Info rule */
  rule: string;
  /** Info message */
  message: string;
  /** Info location */
  location?: SourceLocation;
}

/**
 * Source location
 */
export interface SourceLocation {
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** Start column */
  startColumn: number;
  /** End line */
  endLine: number;
  /** End column */
  endColumn: number;
}

/**
 * Parse options
 */
export interface ParseOptions {
  /** Resolve imports */
  resolveImports?: boolean;
  /** Validate references */
  validateReferences?: boolean;
  /** Include source locations */
  includeLocations?: boolean;
  /** Cache results */
  useCache?: boolean;
}

/**
 * Parse error
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly location?: SourceLocation,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Template context
 */
export interface TemplateContext {
  /** Target directory */
  targetDir: string;
  /** Template categories to render */
  templates?: string[];
  /** Additional context data */
  data?: Record<string, any>;
}

/**
 * Render options
 */
export interface RenderOptions {
  /** Pretty print output */
  prettyPrint?: boolean;
  /** Line ending style */
  lineEndings?: 'lf' | 'crlf' | 'auto';
  /** Indentation */
  indent?: string | number;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
  /** Rule description */
  description?: string;
}

/**
 * Validation context
 */
export interface ValidationContext {
  /** Strict mode */
  strict?: boolean;
  /** Custom rules */
  customRules?: ValidationRule[];
  /** Rule configuration */
  ruleConfig?: Record<string, any>;
}

