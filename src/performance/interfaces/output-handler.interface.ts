import { ProcessingResult } from '../parallel-processor.js';

/**
 * Interface for output handling operations
 */
export interface IOutputHandler {
    /**
     * Handle a single processing result
     */
    handleResult(result: ProcessingResult): Promise<void>;

    /**
     * Handle multiple processing results
     */
    handleResults(results: ProcessingResult[]): Promise<void>;

    /**
     * Validate output before writing
     */
    validateOutput(result: ProcessingResult): Promise<boolean>;

    /**
     * Get output statistics
     */
    getOutputStats(): {
        totalFiles: number;
        totalSize: number;
        successCount: number;
        errorCount: number;
    };

    /**
     * Cleanup output resources
     */
    cleanup(): Promise<void>;
}