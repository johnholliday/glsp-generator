// Performance optimization exports
export * from './types.js';
export * from './streaming-parser.js';
export * from './parallel-processor.js';
export * from './progress-indicator.js';
export * from './monitor.js';
export * from './memory-manager.js';
export * from './grammar-converter.js';

// Export new DI-enabled interfaces and services
export * from './interfaces/index.js';
export * from './services/index.js';
export * from './factories/memory-manager.factory.js';

import { StreamingGrammarParser } from './streaming-parser.js';
import { ParallelTemplateProcessor } from './parallel-processor.js';
import { GenerationProgress } from './progress-indicator.js';
import { PerformanceMonitor } from './monitor.js';
import { MemoryManager } from './memory-manager.js';
import { createMemoryManager } from './factories/memory-manager.factory.js';
import { PerformanceConfig } from './types.js';
import os from 'os';

/**
 * Main performance optimization orchestrator
 */
export class PerformanceOptimizer {
    private monitor: PerformanceMonitor;
    private memoryManager: MemoryManager;
    private progress: GenerationProgress;
    private streamingParser?: StreamingGrammarParser;
    private parallelProcessor?: ParallelTemplateProcessor;

    constructor(
        private config: PerformanceConfig = {},
        memoryManager?: MemoryManager
    ) {
        this.monitor = new PerformanceMonitor(config);
        this.memoryManager = memoryManager || createMemoryManager(config, this.monitor);
        this.progress = new GenerationProgress([], {}, config);

        if (config.enableStreaming) {
            this.streamingParser = new StreamingGrammarParser(config, this.monitor);
        }

        if (config.enableParallelProcessing) {
            this.parallelProcessor = new ParallelTemplateProcessor(config, {}, this.monitor);
        }

        this.setupOptimizations();
    }

    /**
     * Get streaming parser instance
     */
    getStreamingParser(): StreamingGrammarParser {
        if (!this.streamingParser) {
            this.streamingParser = new StreamingGrammarParser(this.config, this.monitor);
        }
        return this.streamingParser;
    }

    /**
     * Get parallel processor instance
     */
    getParallelProcessor(): ParallelTemplateProcessor {
        if (!this.parallelProcessor) {
            this.parallelProcessor = new ParallelTemplateProcessor(this.config, {}, this.monitor);
        }
        return this.parallelProcessor;
    }


    /**
     * Get progress indicator instance
     */
    getProgress(): GenerationProgress {
        return this.progress;
    }

    /**
     * Get performance monitor instance
     */
    getMonitor(): PerformanceMonitor {
        return this.monitor;
    }

    /**
     * Get memory manager instance
     */
    getMemoryManager(): MemoryManager {
        return this.memoryManager;
    }

    /**
     * Start performance monitoring
     */
    startMonitoring(): void {
        if (this.config.enableMemoryMonitoring) {
            this.memoryManager.startMonitoring();
        }

        if (this.config.enableProgressIndicators) {
            this.progress.start();
        }
    }

    /**
     * Stop performance monitoring and generate report
     */
    async stopMonitoring(): Promise<void> {
        this.memoryManager.stopMonitoring();

        if (this.config.profileMode) {
            this.monitor.printSummary();
        }

        // Save performance report only in profile mode
        if (this.config.profileMode) {
            await this.monitor.saveReport('./performance-report.json');
        }

        // Cleanup resources

        if (this.parallelProcessor) {
            await this.parallelProcessor.cleanup();
        }
    }

    /**
     * Check if optimizations should be enabled based on input size
     */
    shouldOptimize(inputSize: number): boolean {
        // Enable optimizations for files > 1MB or when explicitly configured
        return inputSize > 1024 * 1024 ||
            Boolean(this.config.enableParallelProcessing);
    }

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): string[] {
        const recommendations: string[] = [];
        const memoryUsage = this.memoryManager.getMemoryUsage();

        if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
            recommendations.push('Enable streaming processing for large files');
        }


        if (!this.config.enableParallelProcessing) {
            recommendations.push('Enable parallel processing to utilize multiple CPU cores');
        }

        if (this.memoryManager.isMemoryPressure()) {
            recommendations.push('Reduce memory usage or increase available memory');
        }

        return recommendations;
    }

    /**
     * Setup performance optimizations
     */
    private setupOptimizations(): void {
        // Setup memory pressure handling
        this.memoryManager.on('critical', () => {
            console.warn('🚨 Critical memory usage detected, forcing cleanup');
            this.memoryManager.emergencyCleanup();
        });


        // Only setup SIGINT handler in watch mode or when explicitly needed
        // This prevents the process from staying alive in non-watch generation mode
        if (this.config.profileMode) {
            process.once('SIGINT', async () => {
                console.log('\n🛑 Graceful shutdown initiated...');
                await this.stopMonitoring();
                process.exit(0);
            });
        }
    }
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
    /**
     * Measure execution time of an async function
     */
    static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        return { result, duration };
    }

    /**
     * Measure execution time of a sync function
     */
    static measure<T>(fn: () => T): { result: T; duration: number } {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        return { result, duration };
    }

    /**
     * Throttle function calls
     */
    static throttle<T extends (...args: any[]) => any>(
        fn: T,
        delay: number
    ): T {
        let lastCall = 0;
        return ((...args: any[]) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return fn(...args);
            }
        }) as T;
    }

    /**
     * Debounce function calls
     */
    static debounce<T extends (...args: any[]) => any>(
        fn: T,
        delay: number
    ): T {
        let timeoutId: NodeJS.Timeout;
        return ((...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        }) as T;
    }

    /**
     * Create a batch processor
     */
    static createBatchProcessor<T, R>(
        processor: (batch: T[]) => Promise<R[]>,
        batchSize = 10,
        delay = 100
    ) {
        const queue: T[] = [];
        const callbacks: Array<(results: R[]) => void> = [];
        let timeoutId: NodeJS.Timeout;

        const processBatch = async () => {
            if (queue.length === 0) return;

            const batch = queue.splice(0, batchSize);
            const batchCallbacks = callbacks.splice(0, batch.length);

            try {
                const results = await processor(batch);
                batchCallbacks.forEach((callback, index) => {
                    callback([results[index]]);
                });
            } catch (error) {
                console.error('Batch processing error:', error);
            }
        };

        return {
            add(item: T): Promise<R> {
                return new Promise((resolve) => {
                    queue.push(item);
                    callbacks.push((results) => resolve(results[0]));

                    if (queue.length >= batchSize) {
                        clearTimeout(timeoutId);
                        processBatch();
                    } else {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(processBatch, delay);
                    }
                });
            },

            flush(): Promise<void> {
                clearTimeout(timeoutId);
                return processBatch();
            }
        };
    }

    /**
     * Format bytes in human-readable format
     */
    static formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(1)}${units[unitIndex]}`;
    }

    /**
     * Format duration in human-readable format
     */
    static formatDuration(ms: number): string {
        if (ms < 1000) return `${ms.toFixed(1)}ms`;

        const seconds = ms / 1000;
        if (seconds < 60) return `${seconds.toFixed(1)}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
    }

    /**
     * Get system information
     */
    static getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpuCount: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            nodeVersion: process.version,
            uptime: os.uptime()
        };
    }
}