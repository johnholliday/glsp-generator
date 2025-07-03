import { EventEmitter } from 'events';
import { MemoryUsage } from '../types.js';

export interface MemoryThresholds {
    warning: number;    // bytes
    critical: number;   // bytes
    cleanup: number;    // bytes
}

export interface MemoryStats {
    current: MemoryUsage;
    peak: MemoryUsage;
    thresholds: MemoryThresholds;
    gcCount: number;
    lastGC: number;
}

/**
 * Interface for memory management operations
 */
export interface IMemoryManager extends EventEmitter {
    /**
     * Start memory monitoring
     */
    startMonitoring(): void;

    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void;

    /**
     * Get current memory usage
     */
    getMemoryUsage(): MemoryUsage;

    /**
     * Check if system is under memory pressure
     */
    isMemoryPressure(): boolean;

    /**
     * Force garbage collection if available
     */
    forceGC(): boolean;

    /**
     * Emergency cleanup when memory is critical
     */
    emergencyCleanup(): void;

    /**
     * Get memory statistics
     */
    getStats(): MemoryStats;

    /**
     * Set custom memory thresholds
     */
    setThresholds(thresholds: Partial<MemoryThresholds>): void;

    /**
     * Get memory recommendations
     */
    getRecommendations(): string[];

    /**
     * Get memory pressure level
     */
    getMemoryPressureLevel(): 'low' | 'medium' | 'high' | 'critical';

    /**
     * Create memory snapshot for debugging
     */
    createSnapshot(): any;
}