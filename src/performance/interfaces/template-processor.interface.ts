import { Template, GeneratorContext, ProcessingResult } from '../parallel-processor.js';

/**
 * Interface for template processing operations
 */
export interface ITemplateProcessor {
    /**
     * Process a single template
     */
    processTemplate(template: Template, context: GeneratorContext): Promise<ProcessingResult>;

    /**
     * Validate template before processing
     */
    validateTemplate(template: Template): Promise<boolean>;

    /**
     * Get processing capabilities
     */
    getCapabilities(): {
        supportsParallel: boolean;
        maxConcurrency: number;
        supportedFormats: string[];
    };
}