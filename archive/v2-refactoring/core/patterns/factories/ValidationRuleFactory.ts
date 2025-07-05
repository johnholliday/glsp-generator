/**
 * Factory for creating validation rules
 * @module core/patterns/factories
 */

import { injectable } from 'inversify';
import { 
  IValidationRule, 
  ValidationContext, 
  ValidationResult,
  ValidationSeverity 
} from '../../../validation/interfaces/IValidator';

/**
 * Factory for creating various validation rules
 */
@injectable()
export class ValidationRuleFactory {
  /**
   * Create a rule that checks for required entry rules
   */
  createEntryRuleValidator(): IValidationRule {
    return {
      name: 'entry-rule-required',
      description: 'Ensures grammar has at least one entry rule',
      severity: ValidationSeverity.ERROR,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const grammar = context.grammar;
        const hasEntry = grammar.rules?.some(rule => rule.entry) ?? false;
        
        if (!hasEntry) {
          return {
            valid: false,
            errors: [{
              severity: 'error',
              message: 'Grammar must have at least one entry rule',
              code: 'NO_ENTRY_RULE',
            }],
            warnings: [],
          };
        }
        
        return { valid: true, errors: [], warnings: [] };
      },
    };
  }

  /**
   * Create a rule that checks for circular dependencies
   */
  createCircularDependencyValidator(): IValidationRule {
    return {
      name: 'no-circular-dependencies',
      description: 'Detects circular dependencies in grammar rules',
      severity: ValidationSeverity.ERROR,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const errors: any[] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        
        // Check each rule for circular dependencies
        for (const rule of context.grammar.rules || []) {
          if (!visited.has(rule.name)) {
            const cycle = this.detectCycle(
              rule.name, 
              context.grammar, 
              visited, 
              recursionStack
            );
            
            if (cycle) {
              errors.push({
                severity: 'error',
                message: `Circular dependency detected: ${cycle.join(' -> ')}`,
                code: 'CIRCULAR_DEPENDENCY',
                location: this.getRuleLocation(rule),
              });
            }
          }
        }
        
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
        };
      },
    };
  }

  /**
   * Create a rule that validates naming conventions
   */
  createNamingConventionValidator(options: NamingConventionOptions = {}): IValidationRule {
    const {
      rulePattern = /^[A-Z][a-zA-Z0-9]*$/,
      interfacePattern = /^[A-Z][a-zA-Z0-9]*$/,
      propertyPattern = /^[a-z][a-zA-Z0-9]*$/,
    } = options;

    return {
      name: 'naming-conventions',
      description: 'Validates naming conventions for rules, interfaces, and properties',
      severity: ValidationSeverity.WARNING,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const warnings: any[] = [];
        
        // Check rule names
        for (const rule of context.grammar.rules || []) {
          if (!rulePattern.test(rule.name)) {
            warnings.push({
              severity: 'warning',
              message: `Rule name '${rule.name}' does not follow naming convention (expected: ${rulePattern})`,
              code: 'NAMING_CONVENTION_RULE',
              location: this.getRuleLocation(rule),
            });
          }
        }
        
        // Check interface names
        for (const intf of context.grammar.interfaces || []) {
          if (!interfacePattern.test(intf.name)) {
            warnings.push({
              severity: 'warning',
              message: `Interface name '${intf.name}' does not follow naming convention`,
              code: 'NAMING_CONVENTION_INTERFACE',
            });
          }
        }
        
        return {
          valid: true,
          errors: [],
          warnings,
        };
      },
    };
  }

  /**
   * Create a rule that checks for unused rules
   */
  createUnusedRuleValidator(): IValidationRule {
    return {
      name: 'no-unused-rules',
      description: 'Detects rules that are never referenced',
      severity: ValidationSeverity.WARNING,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const warnings: any[] = [];
        const usedRules = new Set<string>();
        
        // Find all rule references
        this.findRuleReferences(context.grammar, usedRules);
        
        // Check for unused rules
        for (const rule of context.grammar.rules || []) {
          if (!rule.entry && !usedRules.has(rule.name)) {
            warnings.push({
              severity: 'warning',
              message: `Rule '${rule.name}' is never used`,
              code: 'UNUSED_RULE',
              location: this.getRuleLocation(rule),
            });
          }
        }
        
        return {
          valid: true,
          errors: [],
          warnings,
        };
      },
    };
  }

  /**
   * Create a rule that validates property types
   */
  createPropertyTypeValidator(): IValidationRule {
    return {
      name: 'valid-property-types',
      description: 'Ensures all property types are valid',
      severity: ValidationSeverity.ERROR,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const errors: any[] = [];
        const validTypes = new Set([
          'string', 'number', 'boolean', 'Date', 'any',
          ...context.grammar.interfaces?.map(i => i.name) || [],
          ...context.grammar.types?.map(t => t.name) || [],
        ]);
        
        // Check property types in interfaces
        for (const intf of context.grammar.interfaces || []) {
          for (const prop of intf.attributes || []) {
            const type = this.extractPropertyType(prop);
            if (type && !validTypes.has(type)) {
              errors.push({
                severity: 'error',
                message: `Unknown type '${type}' in property '${prop.name}'`,
                code: 'UNKNOWN_TYPE',
              });
            }
          }
        }
        
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
        };
      },
    };
  }

  /**
   * Create a composite rule that runs multiple validators
   */
  createCompositeRule(...rules: IValidationRule[]): IValidationRule {
    return {
      name: 'composite-rule',
      description: 'Runs multiple validation rules',
      severity: ValidationSeverity.ERROR,
      
      validate: async (context: ValidationContext): Promise<ValidationResult> => {
        const allErrors: any[] = [];
        const allWarnings: any[] = [];
        let isValid = true;
        
        for (const rule of rules) {
          const result = await rule.validate(context);
          
          if (!result.valid) {
            isValid = false;
          }
          
          allErrors.push(...result.errors);
          allWarnings.push(...result.warnings);
        }
        
        return {
          valid: isValid,
          errors: allErrors,
          warnings: allWarnings,
        };
      },
    };
  }

  /**
   * Create custom rule with provided validation function
   */
  createCustomRule(
    name: string,
    description: string,
    validateFn: (context: ValidationContext) => Promise<ValidationResult>,
    severity: ValidationSeverity = ValidationSeverity.ERROR
  ): IValidationRule {
    return {
      name,
      description,
      severity,
      validate: validateFn,
    };
  }

  /**
   * Helper to detect cycles in rule dependencies
   */
  private detectCycle(
    ruleName: string,
    grammar: any,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[] = []
  ): string[] | null {
    visited.add(ruleName);
    recursionStack.add(ruleName);
    path.push(ruleName);
    
    // Get rule dependencies
    const dependencies = this.getRuleDependencies(ruleName, grammar);
    
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        const cycle = this.detectCycle(dep, grammar, visited, recursionStack, [...path]);
        if (cycle) return cycle;
      } else if (recursionStack.has(dep)) {
        // Found cycle
        const cycleStart = path.indexOf(dep);
        return [...path.slice(cycleStart), dep];
      }
    }
    
    recursionStack.delete(ruleName);
    return null;
  }

  /**
   * Get dependencies of a rule
   */
  private getRuleDependencies(ruleName: string, grammar: any): string[] {
    // This would analyze the rule definition to find references
    // Simplified implementation
    return [];
  }

  /**
   * Find all rule references in the grammar
   */
  private findRuleReferences(grammar: any, usedRules: Set<string>): void {
    // This would traverse the AST to find all rule references
    // Simplified implementation
  }

  /**
   * Get rule location for error reporting
   */
  private getRuleLocation(rule: any): any {
    return {
      start: { line: 1, character: 0 },
      end: { line: 1, character: rule.name.length },
    };
  }

  /**
   * Extract property type from AST
   */
  private extractPropertyType(property: any): string | null {
    if (property.type?.primitiveType) {
      return property.type.primitiveType;
    }
    if (property.type?.reference) {
      return property.type.reference;
    }
    return null;
  }
}

/**
 * Options for naming convention validator
 */
export interface NamingConventionOptions {
  rulePattern?: RegExp;
  interfacePattern?: RegExp;
  propertyPattern?: RegExp;
}

/**
 * Preset validation rule sets
 */
export class ValidationRulePresets {
  constructor(private factory: ValidationRuleFactory) {}

  /**
   * Get basic validation rules
   */
  getBasicRules(): IValidationRule[] {
    return [
      this.factory.createEntryRuleValidator(),
      this.factory.createPropertyTypeValidator(),
    ];
  }

  /**
   * Get strict validation rules
   */
  getStrictRules(): IValidationRule[] {
    return [
      ...this.getBasicRules(),
      this.factory.createCircularDependencyValidator(),
      this.factory.createNamingConventionValidator(),
      this.factory.createUnusedRuleValidator(),
    ];
  }

  /**
   * Get rules for production
   */
  getProductionRules(): IValidationRule[] {
    return [
      this.factory.createEntryRuleValidator(),
      this.factory.createCircularDependencyValidator(),
      this.factory.createPropertyTypeValidator(),
      this.factory.createNamingConventionValidator({
        rulePattern: /^[A-Z][a-zA-Z0-9]*$/,
        interfacePattern: /^I[A-Z][a-zA-Z0-9]*$/, // Require 'I' prefix
      }),
    ];
  }
}