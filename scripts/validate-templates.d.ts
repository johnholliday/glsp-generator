export interface ValidationError {
  file: string;
  line: number;
  pattern: string;
  message: string;
  context?: string;
}

export interface ValidationWarning {
  file: string;
  line: number | 0;
  pattern: string;
  message: string;
  context?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ProhibitedPattern {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

export interface PackageJsonCheck {
  check: (content: string) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

export function scanFile(filePath: string): Promise<ValidationResult>;
export function findTemplateFiles(dir: string): Promise<string[]>;
export declare const prohibitedPatterns: ProhibitedPattern[];
export declare const packageJsonChecks: PackageJsonCheck[];