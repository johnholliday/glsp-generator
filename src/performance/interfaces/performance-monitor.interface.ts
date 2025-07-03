import { MemoryUsage } from '../types.js';

/**
 * Interface for performance monitoring operations
 */
export interface IPerformanceMonitor {
    /**
     * Get current memory usage
     */
    getMemoryUsage(): MemoryUsage;

    /**
     * Check if memory usage is approaching limits
     */
    isMemoryPressure(): boolean;

    /**
     * Force garbage collection if available
     */
    forceGC(): boolean;

    /**
     * Start timing an operation
     */
    startOperation(name: string): () => void;

    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, unit?: string): void;

    /**
     * Print performance summary to console
     */
    printSummary(): void;

    /**
     * Reset all metrics and profile data
     */
    reset(): void;
}