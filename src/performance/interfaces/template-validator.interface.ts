import { Template } from '../parallel-processor.js';

/**
 * Validation result for templates
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: {
        complexity: number;
        estimatedProcessingTime: number;
        memoryRequirement: number;
    };
}

/**
 * Interface for template validation operations
 */
export interface ITemplateValidator {
    /**
     * Validate a single template
     */
    validateTemplate(template: Template): Promise<ValidationResult>;

    /**
     * Validate multiple templates and check dependencies
     */
    validateTemplates(templates: Template[]): Promise<Map<string, ValidationResult>>;

    /**
     * Check template dependencies
     */
    validateDependencies(templates: Template[]): Promise<{
        circularDependencies: string[][];
        missingDependencies: string[];
        validationErrors: string[];
    }>;

    /**
     * Get validation rules
     */
    getValidationRules(): string[];
}