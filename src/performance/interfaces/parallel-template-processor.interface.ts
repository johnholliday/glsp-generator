import { Template, GeneratorContext, ProcessingResult } from '../parallel-processor.js';
import { ParallelProcessingOptions } from '../types.js';

/**
 * Interface for parallel template processing operations
 */
export interface IParallelTemplateProcessor {
    /**
     * Process templates in parallel
     */
    processTemplates(
        templates: Template[],
        context: GeneratorContext,
        options?: ParallelProcessingOptions
    ): Promise<ProcessingResult[]>;

    /**
     * Get processing statistics
     */
    getStats(): {
        maxWorkers: number;
        poolSize: number;
        availableWorkers: number;
        memoryUsage: NodeJS.MemoryUsage;
    };

    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;

    /**
     * Health check for the processor
     */
    healthCheck(): Promise<boolean>;
}