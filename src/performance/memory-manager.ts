import { EventEmitter } from 'events';
import os from 'os';
import { PerformanceMonitor } from './monitor.js';
import { PerformanceConfig, MemoryUsage } from './types';

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
 * Advanced memory management with monitoring and cleanup
 */
export class MemoryManager extends EventEmitter {
    private monitor: PerformanceMonitor;
    private thresholds: MemoryThresholds;
    private peakMemory: MemoryUsage;
    private gcCount = 0;
    private lastGC = 0;
    private monitoringInterval?: NodeJS.Timeout;
    private isMonitoring = false;
    private eventHandlers?: { warningHandler: (warning: Error) => void; exceptionHandler: (error: Error) => void; };

    constructor(
        private config: PerformanceConfig = {},
        monitor?: PerformanceMonitor
    ) {
        super();
        this.monitor = monitor || new PerformanceMonitor();

        // Default thresholds (adjust based on system memory)
        const totalMemory = this.getTotalSystemMemory();
        this.thresholds = {
            warning: totalMemory * 0.7, // 70% of total memory
            critical: totalMemory * 0.85, // 85% of total memory
            cleanup: totalMemory * 0.6 // 60% of total memory
        };

        this.peakMemory = this.getCurrentMemoryUsage();
        this.setupMemoryMonitoring();
    }

    /**
     * Start memory monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        const interval = this.config.maxMemoryUsage ? 1000 : 5000; // Check every 1-5 seconds

        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, interval);

        console.log('🧠 Memory monitoring started');
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.isMonitoring = false;
        
        // Remove event handlers to prevent keeping process alive
        if (this.eventHandlers) {
            process.removeListener('warning', this.eventHandlers.warningHandler);
            process.removeListener('uncaughtException', this.eventHandlers.exceptionHandler);
            this.eventHandlers = undefined;
        }
        
        console.log('🧠 Memory monitoring stopped');
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage(): MemoryUsage {
        return this.getCurrentMemoryUsage();
    }

    /**
     * Check if system is under memory pressure
     */
    isMemoryPressure(): boolean {
        const current = this.getCurrentMemoryUsage();
        return current.heapUsed > this.thresholds.warning;
    }

    /**
     * Force garbage collection if available
     */
    forceGC(): boolean {
        if (global.gc) {
            const before = this.getCurrentMemoryUsage();
            global.gc();
            const after = this.getCurrentMemoryUsage();

            this.gcCount++;
            this.lastGC = Date.now();

            const freed = before.heapUsed - after.heapUsed;
            console.log(`🗑️  GC freed ${this.formatBytes(freed)}`);

            this.emit('gc', { before, after, freed });
            return true;
        }
        return false;
    }

    /**
     * Emergency cleanup when memory is critical
     */
    emergencyCleanup(): void {
        console.warn('🚨 Emergency memory cleanup initiated');

        // Force GC multiple times
        for (let i = 0; i < 3; i++) {
            if (this.forceGC()) {
                // Small delay between GC calls
                setTimeout(() => { }, 10);
            }
        }

        // Clear any large caches or buffers
        this.emit('emergency-cleanup');

        // Check if cleanup was effective
        const current = this.getCurrentMemoryUsage();
        if (current.heapUsed > this.thresholds.critical) {
            console.error('❌ Emergency cleanup failed to reduce memory usage');
            this.emit('cleanup-failed', current);
        } else {
            console.log('✅ Emergency cleanup successful');
            this.emit('cleanup-success', current);
        }
    }

    /**
     * Get memory statistics
     */
    getStats(): MemoryStats {
        return {
            current: this.getCurrentMemoryUsage(),
            peak: this.peakMemory,
            thresholds: this.thresholds,
            gcCount: this.gcCount,
            lastGC: this.lastGC
        };
    }

    /**
     * Set custom memory thresholds
     */
    setThresholds(thresholds: Partial<MemoryThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    /**
     * Get memory recommendations
     */
    getRecommendations(): string[] {
        const current = this.getCurrentMemoryUsage();
        const recommendations: string[] = [];

        if (current.heapUsed > this.thresholds.warning) {
            recommendations.push('Memory usage is high. Consider enabling streaming or reducing batch sizes.');
        }

        if (current.external > 50 * 1024 * 1024) { // 50MB
            recommendations.push('High external memory usage detected. Check for memory leaks in native modules.');
        }

        if (this.gcCount === 0 && this.isMonitoring) {
            recommendations.push('No garbage collection detected. Consider running with --expose-gc flag.');
        }

        const heapUtilization = (current.heapUsed / current.heapTotal) * 100;
        if (heapUtilization > 90) {
            recommendations.push('Heap utilization is very high. Consider increasing heap size or optimizing memory usage.');
        }

        return recommendations;
    }

    /**
     * Setup memory monitoring and event handlers
     */
    private setupMemoryMonitoring(): void {
        // Handle process warnings
        const warningHandler = (warning: Error) => {
            if (warning.name === 'MaxListenersExceededWarning') {
                console.warn('⚠️  Memory: Max listeners exceeded warning');
            }
        };
        process.on('warning', warningHandler);

        // Handle uncaught exceptions that might indicate memory issues
        const exceptionHandler = (error: Error) => {
            if (error.message.includes('out of memory') || error.message.includes('heap')) {
                console.error('💥 Memory: Out of memory error detected');
                this.emergencyCleanup();
            }
        };
        process.on('uncaughtException', exceptionHandler);

        // Store handlers for cleanup
        this.eventHandlers = { warningHandler, exceptionHandler };
    }

    /**
     * Check current memory usage and emit events
     */
    private checkMemoryUsage(): void {
        const current = this.getCurrentMemoryUsage();

        // Update peak memory
        if (current.heapUsed > this.peakMemory.heapUsed) {
            this.peakMemory = current;
        }

        // Check thresholds and emit events
        if (current.heapUsed > this.thresholds.critical) {
            this.emit('critical', current);
        } else if (current.heapUsed > this.thresholds.warning) {
            this.emit('warning', current);
        }

        // Auto-cleanup if enabled
        if (this.config.gcHints && current.heapUsed > this.thresholds.cleanup) {
            this.forceGC();
        }
    }

    /**
     * Get current memory usage from Node.js
     */
    private getCurrentMemoryUsage(): MemoryUsage {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss,
            arrayBuffers: usage.arrayBuffers || 0
        };
    }

    /**
     * Get total system memory
     */
    private getTotalSystemMemory(): number {
        return os.totalmem();
    }

    /**
     * Format bytes in human-readable format
     */
    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(1)}${units[unitIndex]}`;
    }

    /**
     * Get memory pressure level
     */
    getMemoryPressureLevel(): 'low' | 'medium' | 'high' | 'critical' {
        const current = this.getCurrentMemoryUsage();

        if (current.heapUsed > this.thresholds.critical) {
            return 'critical';
        } else if (current.heapUsed > this.thresholds.warning) {
            return 'high';
        } else if (current.heapUsed > this.thresholds.cleanup) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Create memory snapshot for debugging
     */
    createSnapshot(): any {
        const current = this.getCurrentMemoryUsage();
        const systemInfo = {
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length
        };

        return {
            timestamp: new Date().toISOString(),
            memory: current,
            peak: this.peakMemory,
            thresholds: this.thresholds,
            gcStats: {
                count: this.gcCount,
                lastGC: this.lastGC
            },
            system: systemInfo,
            pressureLevel: this.getMemoryPressureLevel(),
            recommendations: this.getRecommendations()
        };
    }
}