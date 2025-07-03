import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { PerformanceMonitor } from '../monitor.js';
import { IPerformanceMonitor } from '../interfaces/performance-monitor.interface.js';
import { MemoryUsage, PerformanceConfig } from '../types.js';

/**
 * Adapter to make PerformanceMonitor injectable and implement IPerformanceMonitor interface
 */
@injectable()
export class PerformanceMonitorAdapter implements IPerformanceMonitor {
    private monitor: PerformanceMonitor;

    constructor(
        @inject(TYPES.PerformanceConfig) config: PerformanceConfig
    ) {
        this.monitor = new PerformanceMonitor(config);
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage(): MemoryUsage {
        return this.monitor.getMemoryUsage();
    }

    /**
     * Check if memory usage is approaching limits
     */
    isMemoryPressure(): boolean {
        return this.monitor.isMemoryPressure();
    }

    /**
     * Force garbage collection if available
     */
    forceGC(): boolean {
        return this.monitor.forceGC();
    }

    /**
     * Start timing an operation
     */
    startOperation(name: string): () => void {
        return this.monitor.startOperation(name);
    }

    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, unit = 'ms'): void {
        this.monitor.recordMetric(name, value, unit);
    }

    /**
     * Print performance summary to console
     */
    printSummary(): void {
        this.monitor.printSummary();
    }

    /**
     * Reset all metrics and profile data
     */
    reset(): void {
        this.monitor.reset();
    }

    /**
     * Get the underlying PerformanceMonitor instance for advanced operations
     */
    getMonitor(): PerformanceMonitor {
        return this.monitor;
    }
}