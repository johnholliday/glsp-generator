/**
 * Langium-based validator implementation
 * @module validation/services
 */

import { injectable, inject } from 'inversify';
import { 
  Grammar, 
  LangiumDocument, 
  ValidationAcceptor,
  ValidationChecks
} from 'langium';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { TYPES } from '../../infrastructure/di/symbols';
import { IValidator } from '../../core/interfaces';
import { ValidationResult, ValidationContext } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';
import { IErrorCollector } from '../../core/interfaces/IValidator';

/**
 * Main validator implementation using Langium's validation API
 * Implements Single Responsibility: Validates grammars using Langium
 */
@injectable()
export class LangiumValidator implements IValidator {
  private readonly customChecks: ValidationChecks = {
    // Grammar is the root AST node type
    Grammar: [
      this.checkGrammarName.bind(this),
      this.checkDuplicateRules.bind(this),
      this.checkUnusedRules.bind(this)
    ]
  };

  constructor(
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(TYPES.IErrorCollector) private readonly errorCollector: IErrorCollector
  ) {
    this.logger.info('LangiumValidator initialized');
  }

  /**
   * Validates a Langium Grammar
   */
  async validate(grammar: Grammar, context?: ValidationContext): Promise<ValidationResult> {
    this.logger.debug('Validating grammar', { 
      name: grammar.name,
      rules: grammar.rules.length,
      strict: context?.strict 
    });

    // Clear previous errors
    this.errorCollector.clear();

    // Create validation acceptor that collects errors
    const acceptor = this.createValidationAcceptor();

    // Run built-in Langium validations
    await this.runBuiltInValidations(grammar, acceptor);

    // Run custom validations
    await this.runCustomValidations(grammar, acceptor, context);

    // Run user-provided custom rules
    if (context?.customRules) {
      await this.runUserRules(grammar, acceptor, context);
    }

    // Convert collected errors to validation result
    const result = this.errorCollector.toValidationResult();

    this.logger.info('Validation completed', {
      isValid: result.isValid,
      errors: result.errors.length,
      warnings: result.warnings.length
    });

    return result;
  }

  /**
   * Validates a Langium document
   */
  async validateDocument(document: LangiumDocument, context?: ValidationContext): Promise<ValidationResult> {
    const grammar = document.parseResult.value as Grammar;
    
    if (!grammar) {
      this.errorCollector.addError(
        'INVALID_DOCUMENT',
        'Document does not contain a valid Grammar',
        { file: document.uri.fsPath }
      );
      return this.errorCollector.toValidationResult();
    }

    // Validate the grammar with document context
    const result = await this.validate(grammar, context);

    // Add document-specific diagnostics
    if (document.diagnostics && document.diagnostics.length > 0) {
      for (const diagnostic of document.diagnostics) {
        this.addDiagnostic(diagnostic, document.uri.fsPath);
      }
    }

    return this.errorCollector.toValidationResult();
  }

  /**
   * Grammar validation checks
   */
  private checkGrammarName(grammar: Grammar, acceptor: ValidationAcceptor): void {
    if (!grammar.name) {
      acceptor('error', 'Grammar must have a name', { node: grammar });
      return;
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(grammar.name)) {
      acceptor(
        'warning', 
        `Grammar name '${grammar.name}' should start with uppercase and be in PascalCase`,
        { node: grammar, property: 'name' }
      );
    }
  }

  private checkDuplicateRules(grammar: Grammar, acceptor: ValidationAcceptor): void {
    const ruleNames = new Map<string, number>();
    
    for (const rule of grammar.rules) {
      const count = ruleNames.get(rule.name) || 0;
      if (count > 0) {
        acceptor(
          'error',
          `Duplicate rule name '${rule.name}'`,
          { node: rule, property: 'name' }
        );
      }
      ruleNames.set(rule.name, count + 1);
    }
  }

  private checkUnusedRules(grammar: Grammar, acceptor: ValidationAcceptor): void {
    // Skip if grammar has entry rules (they're always considered used)
    const entryRules = grammar.rules.filter(r => r.$type === 'ParserRule' && (r as any).entry);
    if (entryRules.length === 0 && grammar.rules.length > 0) {
      acceptor(
        'warning',
        'Grammar has no entry rules defined',
        { node: grammar }
      );
    }

    // Additional unused rule checking would require analyzing rule references
  }

  /**
   * Interface validation checks
   */
  private checkInterfaceName(iface: any, acceptor: ValidationAcceptor): void {
    if (!iface.name) return;

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(iface.name)) {
      acceptor(
        'warning',
        `Interface name '${iface.name}' should be in PascalCase`,
        { node: iface, property: 'name' }
      );
    }
  }

  private checkCircularInheritance(iface: any, acceptor: ValidationAcceptor): void {
    const visited = new Set<string>();
    const checkCircular = (current: any): boolean => {
      if (visited.has(current.name)) {
        return true;
      }
      visited.add(current.name);
      
      if (current.superTypes) {
        for (const superType of current.superTypes) {
          if (superType.ref && checkCircular(superType.ref)) {
            return true;
          }
        }
      }
      
      visited.delete(current.name);
      return false;
    };

    if (checkCircular(iface)) {
      acceptor(
        'error',
        `Circular inheritance detected for interface '${iface.name}'`,
        { node: iface, property: 'superTypes' }
      );
    }
  }

  private checkPropertyNames(iface: any, acceptor: ValidationAcceptor): void {
    const propertyNames = new Set<string>();
    
    if (iface.features) {
      for (const feature of iface.features) {
        if (propertyNames.has(feature.name)) {
          acceptor(
            'error',
            `Duplicate property name '${feature.name}' in interface '${iface.name}'`,
            { node: feature, property: 'name' }
          );
        }
        propertyNames.add(feature.name);

        // Check property naming convention
        if (!/^[a-z][a-zA-Z0-9]*$/.test(feature.name)) {
          acceptor(
            'warning',
            `Property name '${feature.name}' should be in camelCase`,
            { node: feature, property: 'name' }
          );
        }
      }
    }
  }

  /**
   * Type validation checks
   */
  private checkTypeName(type: any, acceptor: ValidationAcceptor): void {
    if (!type.name) return;

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(type.name)) {
      acceptor(
        'warning',
        `Type name '${type.name}' should be in PascalCase`,
        { node: type, property: 'name' }
      );
    }
  }

  private checkTypeReferences(type: any, acceptor: ValidationAcceptor): void {
    // Check that type references are valid
    // This would require analyzing the type's definition
  }

  /**
   * Private helper methods
   */
  private createValidationAcceptor(): ValidationAcceptor {
    return (severity, message, info) => {
      const level = typeof severity === 'string' ? severity : 'error';
      const location = info ? this.extractLocation(info) : undefined;

      switch (level) {
        case 'error':
          this.errorCollector.addError(`VALIDATION_${info?.code || 'ERROR'}`, message, location);
          break;
        case 'warning':
          this.errorCollector.addWarning(`VALIDATION_${info?.code || 'WARNING'}`, message, location);
          break;
        case 'info':
        case 'hint':
          this.errorCollector.addInfo(`VALIDATION_${info?.code || 'INFO'}`, message, location);
          break;
      }
    };
  }

  private async runBuiltInValidations(grammar: Grammar, acceptor: ValidationAcceptor): Promise<void> {
    // Grammar-level validations
    for (const check of this.customChecks.Grammar || []) {
      check(grammar, acceptor);
    }

    // Interface validations
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        for (const check of this.customChecks.Interface || []) {
          check(iface, acceptor);
        }
      }
    }

    // Type validations
    if (grammar.types) {
      for (const type of grammar.types) {
        for (const check of this.customChecks.Type || []) {
          check(type, acceptor);
        }
      }
    }
  }

  private async runCustomValidations(
    grammar: Grammar, 
    acceptor: ValidationAcceptor,
    context?: ValidationContext
  ): Promise<void> {
    // Strict mode validations
    if (context?.strict) {
      this.runStrictValidations(grammar, acceptor);
    }

    // GLSP-specific validations
    this.validateGLSPCompatibility(grammar, acceptor);
  }

  private runStrictValidations(grammar: Grammar, acceptor: ValidationAcceptor): void {
    // All rules must have explicit types
    for (const rule of grammar.rules) {
      if (!rule.returnType && !rule.infers) {
        acceptor(
          'warning',
          `Rule '${rule.name}' should have an explicit return type in strict mode`,
          { node: rule, property: 'returnType' }
        );
      }
    }

    // All properties must have explicit types
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        if (iface.features) {
          for (const feature of iface.features) {
            if (!feature.type) {
              acceptor(
                'warning',
                `Property '${feature.name}' should have an explicit type in strict mode`,
                { node: feature, property: 'type' }
              );
            }
          }
        }
      }
    }
  }

  private validateGLSPCompatibility(grammar: Grammar, acceptor: ValidationAcceptor): void {
    // Check for at least one interface (needed for GLSP nodes)
    if (!grammar.interfaces || grammar.interfaces.length === 0) {
      acceptor(
        'warning',
        'Grammar should define at least one interface for GLSP node types',
        { node: grammar }
      );
    }

    // Check for common GLSP patterns
    const hasNodeInterface = grammar.interfaces?.some(i => 
      i.name.toLowerCase().includes('node') || 
      i.name.toLowerCase().includes('element')
    );

    if (!hasNodeInterface) {
      acceptor(
        'info',
        'Consider defining a base Node or Element interface for GLSP compatibility',
        { node: grammar }
      );
    }
  }

  private async runUserRules(
    grammar: Grammar,
    acceptor: ValidationAcceptor,
    context: ValidationContext
  ): Promise<void> {
    if (!context.customRules) return;

    for (const rule of context.customRules) {
      try {
        const ruleImpl = this.createRuleImplementation(rule);
        await ruleImpl.validate(grammar, acceptor, context);
      } catch (error) {
        this.logger.error(`Error running custom rule '${rule.name}'`, error as Error);
        acceptor(
          'error',
          `Custom rule '${rule.name}' failed: ${(error as Error).message}`,
          { node: grammar }
        );
      }
    }
  }

  private createRuleImplementation(rule: any): any {
    // This would create rule implementations based on rule configuration
    // For now, returning a no-op implementation
    return {
      validate: async () => {}
    };
  }

  private extractLocation(info: any): any {
    if (!info.node) return undefined;

    const node = info.node;
    const property = info.property;
    
    // Extract location from AST node
    // This would use Langium's AstNode utilities
    return {
      file: node.$document?.uri?.fsPath,
      property
    };
  }

  private addDiagnostic(diagnostic: Diagnostic, filePath: string): void {
    const location = {
      file: filePath,
      startLine: diagnostic.range.start.line + 1,
      startColumn: diagnostic.range.start.character + 1,
      endLine: diagnostic.range.end.line + 1,
      endColumn: diagnostic.range.end.character + 1
    };

    const message = typeof diagnostic.message === 'string' 
      ? diagnostic.message 
      : diagnostic.message.value;

    switch (diagnostic.severity) {
      case DiagnosticSeverity.Error:
        this.errorCollector.addError(diagnostic.code?.toString() || 'DIAGNOSTIC_ERROR', message, location);
        break;
      case DiagnosticSeverity.Warning:
        this.errorCollector.addWarning(diagnostic.code?.toString() || 'DIAGNOSTIC_WARNING', message, location);
        break;
      case DiagnosticSeverity.Information:
      case DiagnosticSeverity.Hint:
        this.errorCollector.addInfo(diagnostic.code?.toString() || 'DIAGNOSTIC_INFO', message, location);
        break;
    }
  }
}