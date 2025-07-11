import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { ILogger } from '../../utils/logger/index.js';
import { ITemplateValidator, ValidationResult } from '../interfaces/template-validator.interface.js';
import { Template } from '../parallel-processor.js';

/**
 * Service for validating templates and their dependencies
 */
@injectable()
export class TemplateValidatorService implements ITemplateValidator {
    constructor(
        @inject(TYPES.Logger) private logger: ILogger
    ) { }

    /**
     * Validate a single template
     */
    async validateTemplate(template: Template): Promise<ValidationResult> {
        this.logger.debug(`Validating template: ${template.name}`);

        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Basic validation
            if (!template.name || template.name.trim() === '') {
                errors.push('Template name is required');
            }

            if (!template.path || template.path.trim() === '') {
                errors.push('Template path is required');
            }

            if (!template.content || template.content.trim() === '') {
                errors.push('Template content is required');
            }

            // Content validation
            if (template.content) {
                const contentValidation = this.validateTemplateContent(template.content);
                errors.push(...contentValidation.errors);
                warnings.push(...contentValidation.warnings);
            }

            // Priority validation
            if (template.priority < 0 || template.priority > 100) {
                warnings.push('Template priority should be between 0 and 100');
            }

            // Dependencies validation
            if (template.dependencies && template.dependencies.length > 0) {
                const depValidation = this.validateTemplateDependencies(template);
                errors.push(...depValidation.errors);
                warnings.push(...depValidation.warnings);
            }

            const isValid = errors.length === 0;
            const metadata = isValid ? this.calculateTemplateMetadata(template) : undefined;

            this.logger.debug(`Template validation completed: ${template.name}, valid: ${isValid}`);

            return {
                isValid,
                errors,
                warnings,
                metadata
            };
        } catch (error) {
            this.logger.error(`Template validation failed: ${template.name}`, error);
            return {
                isValid: false,
                errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
                warnings
            };
        }
    }

    /**
     * Validate multiple templates and check dependencies
     */
    async validateTemplates(templates: Template[]): Promise<Map<string, ValidationResult>> {
        this.logger.debug(`Validating ${templates.length} templates`);

        const results = new Map<string, ValidationResult>();

        // Validate each template individually
        for (const template of templates) {
            const result = await this.validateTemplate(template);
            results.set(template.name, result);
        }

        // Cross-template dependency validation
        const dependencyValidation = await this.validateDependencies(templates);

        // Add dependency errors to individual template results
        for (const [templateName, result] of results) {
            const template = templates.find(t => t.name === templateName);
            if (template && template.dependencies) {
                for (const dep of template.dependencies) {
                    if (dependencyValidation.missingDependencies.includes(dep)) {
                        result.errors.push(`Missing dependency: ${dep}`);
                        result.isValid = false;
                    }
                }
            }
        }

        this.logger.debug(`Template batch validation completed: ${results.size} templates processed`);
        return results;
    }

    /**
     * Check template dependencies
     */
    async validateDependencies(templates: Template[]): Promise<{
        circularDependencies: string[][];
        missingDependencies: string[];
        validationErrors: string[];
    }> {
        this.logger.debug('Validating template dependencies');

        const templateMap = new Map(templates.map(t => [t.name, t]));
        const circularDependencies: string[][] = [];
        const missingDependencies: string[] = [];
        const validationErrors: string[] = [];

        // Check for missing dependencies
        for (const template of templates) {
            for (const dep of template.dependencies) {
                if (!templateMap.has(dep)) {
                    if (!missingDependencies.includes(dep)) {
                        missingDependencies.push(dep);
                    }
                }
            }
        }

        // Check for circular dependencies using DFS
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const detectCycle = (templateName: string, path: string[]): void => {
            if (recursionStack.has(templateName)) {
                const cycleStart = path.indexOf(templateName);
                const cycle = path.slice(cycleStart).concat(templateName);
                circularDependencies.push(cycle);
                return;
            }

            if (visited.has(templateName)) {
                return;
            }

            visited.add(templateName);
            recursionStack.add(templateName);

            const template = templateMap.get(templateName);
            if (template) {
                for (const dep of template.dependencies) {
                    if (templateMap.has(dep)) {
                        detectCycle(dep, [...path, templateName]);
                    }
                }
            }

            recursionStack.delete(templateName);
        };

        for (const template of templates) {
            if (!visited.has(template.name)) {
                detectCycle(template.name, []);
            }
        }

        this.logger.debug(`Dependency validation completed: ${circularDependencies.length} circular dependencies, ${missingDependencies.length} missing dependencies`);

        return {
            circularDependencies,
            missingDependencies,
            validationErrors
        };
    }

    /**
     * Get validation rules
     */
    getValidationRules(): string[] {
        return [
            'Template name must not be empty',
            'Template path must not be empty',
            'Template content must not be empty',
            'Template priority should be between 0 and 100',
            'Template dependencies must exist',
            'No circular dependencies allowed',
            'Template content must be valid syntax',
            'Template variables must be properly formatted'
        ];
    }

    /**
     * Validate template content syntax
     */
    private validateTemplateContent(content: string): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for common template syntax issues
        const unclosedBraces = (content.match(/{{/g) || []).length - (content.match(/}}/g) || []).length;
        if (unclosedBraces !== 0) {
            errors.push('Unclosed template braces detected');
        }

        // Check for potentially problematic patterns
        if (content.includes('{{#each')) {
            const eachCount = (content.match(/{{#each/g) || []).length;
            const endEachCount = (content.match(/{{\/each}}/g) || []).length;
            if (eachCount !== endEachCount) {
                errors.push('Unmatched #each blocks');
            }
        }

        // Check for very large templates
        if (content.length > 100000) { // 100KB
            warnings.push('Template is very large and may impact performance');
        }

        // Check for potential security issues
        if (content.includes('eval(') || content.includes('Function(')) {
            warnings.push('Template contains potentially unsafe code execution');
        }

        return { errors, warnings };
    }

    /**
     * Validate template dependencies
     */
    private validateTemplateDependencies(template: Template): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for self-dependency
        if (template.dependencies.includes(template.name)) {
            errors.push('Template cannot depend on itself');
        }

        // Check for duplicate dependencies
        const uniqueDeps = new Set(template.dependencies);
        if (uniqueDeps.size !== template.dependencies.length) {
            warnings.push('Duplicate dependencies detected');
        }

        // Check for excessive dependencies
        if (template.dependencies.length > 10) {
            warnings.push('Template has many dependencies, consider refactoring');
        }

        return { errors, warnings };
    }

    /**
     * Calculate template metadata for performance estimation
     */
    private calculateTemplateMetadata(template: Template) {
        const contentLength = template.content.length;
        const dependencyCount = template.dependencies.length;

        // Simple complexity calculation based on content size and dependencies
        const complexity = Math.min(100, Math.floor(contentLength / 1000) + dependencyCount * 5);

        // Estimate processing time (in milliseconds)
        const estimatedProcessingTime = Math.max(10, complexity * 2 + dependencyCount * 10);

        // Estimate memory requirement (in bytes)
        const memoryRequirement = contentLength * 2 + dependencyCount * 1024;

        return {
            complexity,
            estimatedProcessingTime,
            memoryRequirement
        };
    }
}