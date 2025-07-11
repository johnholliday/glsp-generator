# Prompt 018: Better Error Messages & Recovery

## Goal
Create a comprehensive error handling system that provides clear, actionable error messages with automatic recovery suggestions and mechanisms, transforming cryptic errors into helpful guidance.

## Why
- Current error messages are often cryptic and unhelpful
- Stack traces don't provide context or solutions
- No automatic recovery mechanisms
- Developers waste time debugging common issues
- Same errors occur repeatedly without documentation
- No central error catalog or knowledge base

## What
A structured error handling system with custom error classes, contextual messages, automatic recovery suggestions, and a central error catalog that learns from common issues.

### Success Criteria
- [ ] All errors have unique codes and clear messages
- [ ] Each error includes context and suggested fixes
- [ ] Automatic recovery for common scenarios
- [ ] Error messages link to documentation
- [ ] Stack traces are cleaned and relevant
- [ ] Errors are logged for pattern analysis
- [ ] Recovery suggestions are actionable
- [ ] Works across CLI, API, and library usage

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/packages/generator/src/cli.ts
  why: Current error handling in CLI to improve
  
- file: /home/john/projects/utils/glsp-generator/packages/generator/src/generator.ts
  why: Main generator error handling patterns
  
- url: https://github.com/sindresorhus/chalk
  why: Colorful error output formatting

- url: https://github.com/sindresorhus/figures
  why: Unicode symbols for better visual hierarchy

- file: /home/john/projects/utils/glsp-generator/CLAUDE.md
  why: Project conventions and error handling guidelines
```

### Current Error Examples
```typescript
// Current: Unhelpful errors
throw new Error('Failed to parse grammar');
// No context, no solution, no error code

// Current: Raw stack traces
Error: Cannot find module './templates/model.hbs'
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:815:15)
    at Function.Module._load (internal/modules/cjs/loader.js:667:27)
    ... 20 more lines of noise
```

### Desired Error Experience
```typescript
// Desired: Helpful, actionable errors
GLSPError: Failed to parse grammar file [E001]

  ✗ Problem: Invalid syntax in grammar file
  📍 Location: /path/to/grammar.langium:15:8
  
  15 | interface Person {
  16 |   name: string
  17 |   age number  // ← Missing colon
       |     ^^^^^^
  18 | }
  
  💡 Suggestion: Add ':' between property name and type
  
  📚 Learn more: https://docs.glsp.dev/errors/E001
  🔧 Try: glsp validate /path/to/grammar.langium --fix
```

## Implementation Blueprint

### Phase 1: Error Class Hierarchy

CREATE packages/generator/src/errors/base.ts:
```typescript
import chalk from 'chalk';
import figures from 'figures';
import { codeFrameColumns } from '@babel/code-frame';

export interface ErrorContext {
  code: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  command?: string;
  link?: string;
  cause?: Error;
  metadata?: Record<string, any>;
}

export abstract class GLSPError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  
  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.code = context.code;
    this.context = context;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Format error for CLI display
   */
  format(): string {
    const parts: string[] = [];
    
    // Header
    parts.push(chalk.red.bold(`${this.name}: ${this.message} [${this.code}]`));
    parts.push('');
    
    // Problem description
    parts.push(`  ${chalk.red(figures.cross)} ${chalk.bold('Problem')}: ${this.message}`);
    
    // Location
    if (this.context.file) {
      const location = this.context.line 
        ? `${this.context.file}:${this.context.line}:${this.context.column || 0}`
        : this.context.file;
      parts.push(`  ${chalk.cyan(figures.pointer)} ${chalk.bold('Location')}: ${location}`);
    }
    
    // Code frame if available
    if (this.context.file && this.context.line && this.context.metadata?.source) {
      parts.push('');
      const frame = codeFrameColumns(
        this.context.metadata.source,
        {
          start: { line: this.context.line, column: this.context.column || 0 }
        },
        {
          highlightCode: true,
          message: this.context.metadata?.hint
        }
      );
      parts.push(frame.split('\n').map(line => '  ' + line).join('\n'));
    }
    
    // Suggestion
    if (this.context.suggestion) {
      parts.push('');
      parts.push(`  ${chalk.yellow(figures.lightbulb)} ${chalk.bold('Suggestion')}: ${this.context.suggestion}`);
    }
    
    // Command to try
    if (this.context.command) {
      parts.push(`  ${chalk.green(figures.play)} ${chalk.bold('Try')}: ${chalk.cyan(this.context.command)}`);
    }
    
    // Documentation link
    if (this.context.link) {
      parts.push(`  ${chalk.blue(figures.book)} ${chalk.bold('Learn more')}: ${chalk.underline.blue(this.context.link)}`);
    }
    
    // Cause
    if (this.context.cause) {
      parts.push('');
      parts.push(chalk.gray('Caused by:'));
      parts.push(chalk.gray(this.context.cause.message));
    }
    
    return parts.join('\n');
  }
  
  /**
   * Get clean stack trace
   */
  getCleanStack(): string {
    if (!this.stack) return '';
    
    const lines = this.stack.split('\n');
    const cleaned = lines.filter(line => {
      // Filter out node internals and common noise
      return !line.includes('node_modules/') &&
             !line.includes('internal/modules/') &&
             !line.includes('__awaiter') &&
             !line.includes('Generator.next');
    });
    
    return cleaned.slice(0, 5).join('\n');
  }
  
  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.getCleanStack(),
      timestamp: new Date().toISOString()
    };
  }
}
```

### Phase 2: Specific Error Classes

CREATE packages/generator/src/errors/index.ts:
```typescript
import { GLSPError, ErrorContext } from './base.js';
import { existsSync, readFileSync } from 'fs';
import { dirname, relative } from 'path';

export class GrammarParseError extends GLSPError {
  constructor(file: string, line: number, column: number, message: string) {
    const source = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
    
    super(`Invalid syntax in grammar file: ${message}`, {
      code: 'E001',
      file,
      line,
      column,
      suggestion: 'Check grammar syntax and ensure all rules are properly terminated',
      command: `glsp validate ${file} --fix`,
      link: 'https://docs.glsp.dev/errors/E001',
      metadata: { source }
    });
  }
}

export class TemplateNotFoundError extends GLSPError {
  constructor(template: string, searchPaths: string[]) {
    super(`Template not found: ${template}`, {
      code: 'E002',
      suggestion: 'Ensure templates are built by running: yarn build',
      command: 'yarn build',
      link: 'https://docs.glsp.dev/errors/E002',
      metadata: { template, searchPaths }
    });
  }
}

export class ConfigurationError extends GLSPError {
  constructor(field: string, value: any, reason: string) {
    super(`Invalid configuration: ${field} = ${value}`, {
      code: 'E003',
      suggestion: reason,
      command: 'cp .env.example .env',
      link: 'https://docs.glsp.dev/errors/E003',
      metadata: { field, value, reason }
    });
  }
}

export class DependencyError extends GLSPError {
  constructor(dependency: string, required: string, found?: string) {
    const message = found 
      ? `Incompatible version of ${dependency}: found ${found}, need ${required}`
      : `Missing dependency: ${dependency}`;
      
    super(message, {
      code: 'E004',
      suggestion: 'Run yarn install to fix dependencies',
      command: 'yarn install',
      link: 'https://docs.glsp.dev/errors/E004',
      metadata: { dependency, required, found }
    });
  }
}

export class FileSystemError extends GLSPError {
  constructor(operation: string, path: string, originalError: Error) {
    super(`File system error during ${operation}: ${path}`, {
      code: 'E005',
      file: path,
      suggestion: 'Check file permissions and disk space',
      link: 'https://docs.glsp.dev/errors/E005',
      cause: originalError,
      metadata: { operation, path }
    });
  }
}

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover(error: GLSPError): boolean;
  recover(error: GLSPError): Promise<boolean>;
  describe(): string;
}
```

### Phase 3: Error Recovery System

CREATE packages/generator/src/errors/recovery.ts:
```typescript
import { GLSPError, TemplateNotFoundError, DependencyError } from './index.js';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export class ErrorRecovery {
  private strategies: RecoveryStrategy[] = [];
  
  constructor() {
    this.registerDefaultStrategies();
  }
  
  private registerDefaultStrategies() {
    // Template rebuild strategy
    this.register({
      canRecover: (error) => error instanceof TemplateNotFoundError,
      recover: async (error) => {
        const spinner = ora('Rebuilding templates...').start();
        try {
          execSync('yarn build', { stdio: 'ignore' });
          spinner.succeed('Templates rebuilt');
          return true;
        } catch {
          spinner.fail('Failed to rebuild templates');
          return false;
        }
      },
      describe: () => 'Rebuild missing templates'
    });
    
    // Dependency install strategy
    this.register({
      canRecover: (error) => error instanceof DependencyError,
      recover: async (error) => {
        const spinner = ora('Installing dependencies...').start();
        try {
          execSync('yarn install', { stdio: 'ignore' });
          spinner.succeed('Dependencies installed');
          return true;
        } catch {
          spinner.fail('Failed to install dependencies');
          return false;
        }
      },
      describe: () => 'Install missing dependencies'
    });
  }
  
  register(strategy: RecoveryStrategy) {
    this.strategies.push(strategy);
  }
  
  async tryRecover(error: GLSPError): Promise<boolean> {
    const applicable = this.strategies.filter(s => s.canRecover(error));
    
    if (applicable.length === 0) {
      return false;
    }
    
    console.log(chalk.yellow('\n🔧 Attempting automatic recovery...\n'));
    
    for (const strategy of applicable) {
      console.log(chalk.gray(`  Trying: ${strategy.describe()}`));
      const success = await strategy.recover(error);
      
      if (success) {
        console.log(chalk.green('\n✅ Recovery successful! Please try again.\n'));
        return true;
      }
    }
    
    console.log(chalk.red('\n❌ Automatic recovery failed.\n'));
    return false;
  }
}
```

### Phase 4: Error Handler Integration

CREATE packages/generator/src/errors/handler.ts:
```typescript
import { GLSPError } from './base.js';
import { ErrorRecovery } from './recovery.js';
import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export class ErrorHandler {
  private recovery = new ErrorRecovery();
  private errorLog: string[] = [];
  
  async handle(error: unknown, options: { exit?: boolean } = {}): Promise<void> {
    // Convert to GLSPError if needed
    const glspError = this.normalize(error);
    
    // Display formatted error
    console.error('\n' + glspError.format() + '\n');
    
    // Log error
    this.logError(glspError);
    
    // Try recovery
    const recovered = await this.recovery.tryRecover(glspError);
    
    if (!recovered && options.exit !== false) {
      this.showErrorSummary();
      process.exit(1);
    }
  }
  
  private normalize(error: unknown): GLSPError {
    if (error instanceof GLSPError) {
      return error;
    }
    
    if (error instanceof Error) {
      // Try to identify common errors and convert them
      const message = error.message;
      
      // Module not found
      if (message.includes('Cannot find module')) {
        const match = message.match(/Cannot find module '(.+)'/);
        const module = match ? match[1] : 'unknown';
        return new DependencyError(module, '*');
      }
      
      // Grammar parse errors
      if (message.includes('Failed to parse grammar')) {
        return new GrammarParseError('unknown', 0, 0, message);
      }
      
      // Generic error
      return new GLSPError(message, {
        code: 'E999',
        suggestion: 'Check the error message for details',
        cause: error
      });
    }
    
    // Unknown error type
    return new GLSPError(String(error), {
      code: 'E999',
      suggestion: 'An unexpected error occurred'
    });
  }
  
  private logError(error: GLSPError) {
    const logDir = join(process.cwd(), '.glsp', 'logs');
    mkdirSync(logDir, { recursive: true });
    
    const logFile = join(logDir, 'errors.jsonl');
    const entry = JSON.stringify(error.toJSON()) + '\n';
    
    writeFileSync(logFile, entry, { flag: 'a' });
    this.errorLog.push(error.code);
  }
  
  private showErrorSummary() {
    if (this.errorLog.length > 1) {
      console.log(chalk.gray('Error summary:'));
      const counts = this.errorLog.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(counts).forEach(([code, count]) => {
        console.log(chalk.gray(`  ${code}: ${count} occurrence(s)`));
      });
    }
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();
```

### Phase 5: CLI Integration

UPDATE packages/generator/src/cli.ts:
```typescript
import { errorHandler } from './errors/handler.js';

// Wrap main CLI logic
async function main() {
  try {
    // ... existing CLI code
  } catch (error) {
    await errorHandler.handle(error, { exit: true });
  }
}

// Global unhandled rejection handler
process.on('unhandledRejection', async (error) => {
  console.error(chalk.red('\n⚠️  Unhandled Promise Rejection\n'));
  await errorHandler.handle(error, { exit: true });
});

// Global uncaught exception handler
process.on('uncaughtException', async (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception\n'));
  await errorHandler.handle(error, { exit: true });
});
```

### Integration Points

CREATE packages/generator/src/errors/catalog.ts:
```typescript
// Central error catalog with all error codes and documentation
export const ERROR_CATALOG = {
  E001: {
    name: 'Grammar Parse Error',
    description: 'The grammar file contains syntax errors',
    common_causes: [
      'Missing semicolons or commas',
      'Unclosed brackets or quotes',
      'Invalid rule syntax'
    ],
    examples: [
      {
        bad: 'interface Person { name string }',
        good: 'interface Person { name: string }'
      }
    ]
  },
  E002: {
    name: 'Template Not Found',
    description: 'A required template file is missing',
    common_causes: [
      'Templates not built after clone',
      'Missing yarn build step',
      'Corrupted installation'
    ]
  }
  // ... more error documentation
};
```

## Validation Loop

### Test Error Scenarios
```typescript
// Test grammar parse error
const error = new GrammarParseError(
  '/path/to/test.langium',
  15,
  8,
  'Expected ":" but found "number"'
);
console.log(error.format());

// Test recovery
const handler = new ErrorHandler();
await handler.handle(new TemplateNotFoundError('model.hbs', ['./templates']));
```

### Integration Tests
```bash
# Test CLI error handling
node dist/cli.js generate invalid-file.langium
# Should show formatted error with suggestions

# Test recovery
rm -rf dist/templates
node dist/cli.js generate test.langium
# Should detect missing templates and offer to rebuild
```

## Final Validation Checklist
- [ ] All errors have unique codes (E001-E999)
- [ ] Error messages are clear and actionable
- [ ] Stack traces are cleaned of noise
- [ ] Recovery mechanisms work automatically
- [ ] Errors are logged for analysis
- [ ] Documentation links work
- [ ] Colors and formatting aid readability
- [ ] Works in all contexts (CLI, API, library)

## Success Metrics
- Error resolution time: 75% reduction
- Automatic recovery success: 60% of common errors
- User satisfaction: No complaints about cryptic errors
- Error patterns: Identified and documented