import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
    Metric,
    PerformanceReport,
    MemoryUsage,
    PerformanceConfig
} from './types';

export interface OperationTimer {
    (): void;
}

export interface ProfileData {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    memoryBefore: MemoryUsage;
    memoryAfter: MemoryUsage;
    stackTrace?: string;
}

/**
 * Comprehensive performance monitoring system
 */
export class PerformanceMonitor {
    private metrics = new Map<string, Metric>();
    private activeOperations = new Map<string, { startTime: bigint; startMemory: MemoryUsage }>();
    private profileData: ProfileData[] = [];
    private startTime = Date.now();
    private warningThresholds = {
        duration: 5000, // 5 seconds
        memory: 100 * 1024 * 1024, // 100MB
    };

    constructor(private config: PerformanceConfig = {}) {
        if (config.profileMode) {
            this.enableProfiling();
        }
    }

    /**
     * Start timing an operation
     */
    startOperation(name: string): OperationTimer {
        const operationId = `${name}-${Date.now()}-${Math.random()}`;
        const startTime = process.hrtime.bigint();
        const startMemory = this.getMemoryUsage();

        this.activeOperations.set(operationId, { startTime, startMemory });

        if (this.config.profileMode) {
            this.profileData.push({
                operation: name,
                startTime: Number(startTime),
                endTime: 0,
                duration: 0,
                memoryBefore: startMemory,
                memoryAfter: startMemory,
                stackTrace: this.getStackTrace()
            });
        }

        return () => this.endOperation(operationId, name);
    }

    /**
     * End timing an operation
     */
    private endOperation(operationId: string, name: string): void {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        const endTime = process.hrtime.bigint();
        const endMemory = this.getMemoryUsage();
        const duration = Number(endTime - operation.startTime) / 1e6; // Convert to milliseconds

        const metric: Metric = {
            duration,
            memoryDelta: endMemory.heapUsed - operation.startMemory.heapUsed,
            peakMemory: endMemory.heapUsed,
            startTime: Number(operation.startTime),
            endTime: Number(endTime)
        };

        this.metrics.set(name, metric);
        this.activeOperations.delete(operationId);

        // Update profile data if profiling is enabled
        if (this.config.profileMode && this.profileData.length > 0) {
            const profileEntry = this.profileData[this.profileData.length - 1];
            if (profileEntry.operation === name) {
                profileEntry.endTime = Number(endTime);
                profileEntry.duration = duration;
                profileEntry.memoryAfter = endMemory;
            }
        }

        // Check for performance warnings
        this.checkWarnings(name, metric);
    }

    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, unit = 'ms'): void {
        const existing = this.metrics.get(name);
        if (existing) {
            // Update existing metric (average)
            existing.duration = (existing.duration + value) / 2;
        } else {
            this.metrics.set(name, {
                duration: value,
                memoryDelta: 0,
                peakMemory: process.memoryUsage().heapUsed
            });
        }
    }

    /**
     * Get metric by name
     */
    getMetric(name: string): Metric | undefined {
        return this.metrics.get(name);
    }

    /**
     * Get all metrics
     */
    getAllMetrics(): Map<string, Metric> {
        return new Map(this.metrics);
    }

    /**
     * Generate comprehensive performance report
     */
    generateReport(): PerformanceReport {
        const totalDuration = Date.now() - this.startTime;
        const phases = Array.from(this.metrics.entries());
        const memoryPeak = this.getPeakMemory();
        const recommendations = this.generateRecommendations();

        return {
            totalDuration,
            phases,
            memoryPeak,
            recommendations,
            cacheHitRate: this.calculateCacheHitRate(),
            parallelEfficiency: this.calculateParallelEfficiency()
        };
    }

    /**
     * Save performance report to file
     */
    async saveReport(outputPath: string, format: 'json' | 'html' | 'text' = 'json'): Promise<void> {
        const report = this.generateReport();

        switch (format) {
            case 'json':
                await fs.writeJson(outputPath, report, { spaces: 2 });
                break;
            case 'html':
                await this.saveHtmlReport(outputPath, report);
                break;
            case 'text':
                await this.saveTextReport(outputPath, report);
                break;
        }
    }

    /**
     * Print performance summary to console
     */
    printSummary(): void {
        const report = this.generateReport();

        console.log('\n📊 Performance Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total Duration: ${this.formatDuration(report.totalDuration)}`);
        console.log(`Peak Memory: ${this.formatBytes(report.memoryPeak)}`);

        if (report.cacheHitRate !== undefined) {
            console.log(`Cache Hit Rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);
        }

        if (report.parallelEfficiency !== undefined) {
            console.log(`Parallel Efficiency: ${(report.parallelEfficiency * 100).toFixed(1)}%`);
        }

        console.log('\n⏱️  Phase Breakdown:');
        for (const [name, metric] of report.phases) {
            const duration = this.formatDuration(metric.duration);
            const memory = this.formatBytes(Math.abs(metric.memoryDelta));
            const memoryDirection = metric.memoryDelta >= 0 ? '+' : '-';
            console.log(`  ${name}: ${duration} (${memoryDirection}${memory})`);
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`  • ${rec}`);
            });
        }

        // Show system info
        this.printSystemInfo();
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage(): MemoryUsage {
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
     * Check if memory usage is approaching limits
     */
    isMemoryPressure(): boolean {
        const usage = this.getMemoryUsage();
        const threshold = this.config.maxMemoryUsage || 512 * 1024 * 1024; // 512MB default
        return usage.heapUsed > threshold * 0.8; // 80% of threshold
    }

    /**
     * Force garbage collection if available
     */
    forceGC(): boolean {
        if (global.gc) {
            global.gc();
            return true;
        }
        return false;
    }

    /**
     * Get profile data (only available in profile mode)
     */
    getProfileData(): ProfileData[] {
        return this.config.profileMode ? [...this.profileData] : [];
    }

    /**
     * Clear all metrics and profile data
     */
    reset(): void {
        this.metrics.clear();
        this.activeOperations.clear();
        this.profileData = [];
        this.startTime = Date.now();
    }

    /**
     * Enable performance profiling
     */
    private enableProfiling(): void {
        // Hook into process events for additional profiling
        process.on('beforeExit', () => {
            if (this.config.profileMode) {
                console.log('\n🔍 Profiling Data Available');
                console.log(`Total operations recorded: ${this.profileData.length}`);
            }
        });
    }

    /**
     * Get stack trace for profiling
     */
    private getStackTrace(): string {
        const stack = new Error().stack;
        return stack ? stack.split('\n').slice(3, 8).join('\n') : '';
    }

    /**
     * Check for performance warnings
     */
    private checkWarnings(name: string, metric: Metric): void {
        if (metric.duration > this.warningThresholds.duration) {
            console.warn(`⚠️  Slow operation detected: ${name} took ${this.formatDuration(metric.duration)}`);
        }

        if (Math.abs(metric.memoryDelta) > this.warningThresholds.memory) {
            const direction = metric.memoryDelta > 0 ? 'increased' : 'decreased';
            console.warn(`⚠️  High memory impact: ${name} ${direction} memory by ${this.formatBytes(Math.abs(metric.memoryDelta))}`);
        }
    }

    /**
     * Calculate peak memory usage across all operations
     */
    private getPeakMemory(): number {
        let peak = process.memoryUsage().heapUsed;
        for (const metric of this.metrics.values()) {
            if (metric.peakMemory > peak) {
                peak = metric.peakMemory;
            }
        }
        return peak;
    }

    /**
     * Generate performance recommendations
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const phases = Array.from(this.metrics.entries());
        const memoryPeak = this.getPeakMemory();
        const cacheHitRate = this.calculateCacheHitRate();
        const parallelEfficiency = this.calculateParallelEfficiency();

        // Check for slow operations
        const slowOperations = phases.filter(([_, metric]) => metric.duration > 5000);
        if (slowOperations.length > 0) {
            recommendations.push(`Consider optimizing slow operations: ${slowOperations.map(([name]) => name).join(', ')}`);
        }

        // Check memory usage
        if (memoryPeak > 500 * 1024 * 1024) { // 500MB
            recommendations.push('High memory usage detected. Consider streaming or caching optimizations');
        }

        // Check cache efficiency
        if (cacheHitRate !== undefined && cacheHitRate < 0.5) {
            recommendations.push('Low cache hit rate. Review cache strategy and TTL settings');
        }

        // Check parallel efficiency
        if (parallelEfficiency !== undefined && parallelEfficiency < 0.7) {
            recommendations.push('Low parallel efficiency. Consider reducing worker overhead or increasing chunk sizes');
        }

        // General recommendations
        if (this.metrics.size > 50) {
            recommendations.push('Many operations detected. Consider batch processing or optimization');
        }

        return recommendations;
    }

    /**
     * Calculate cache hit rate (if cache metrics are available)
     */
    private calculateCacheHitRate(): number | undefined {
        const cacheHits = this.getMetric('cache-hits');
        const cacheMisses = this.getMetric('cache-misses');

        if (cacheHits && cacheMisses) {
            const total = cacheHits.duration + cacheMisses.duration;
            return total > 0 ? cacheHits.duration / total : 0;
        }

        return undefined;
    }

    /**
     * Calculate parallel processing efficiency
     */
    private calculateParallelEfficiency(): number | undefined {
        const serialTime = this.getMetric('serial-processing');
        const parallelTime = this.getMetric('parallel-processing');

        if (serialTime && parallelTime) {
            return parallelTime.duration > 0 ? serialTime.duration / parallelTime.duration : 0;
        }

        return undefined;
    }

    /**
     * Save HTML performance report
     */
    private async saveHtmlReport(outputPath: string, report: PerformanceReport): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GLSP Generator Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .recommendation { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        .duration { color: #007acc; }
        .memory { color: #d73527; }
    </style>
</head>
<body>
    <h1>GLSP Generator Performance Report</h1>
    <div class="metric">
        <h3>Summary</h3>
        <p><strong>Total Duration:</strong> <span class="duration">${this.formatDuration(report.totalDuration)}</span></p>
        <p><strong>Peak Memory:</strong> <span class="memory">${this.formatBytes(report.memoryPeak)}</span></p>
        ${report.cacheHitRate ? `<p><strong>Cache Hit Rate:</strong> ${(report.cacheHitRate * 100).toFixed(1)}%</p>` : ''}
        ${report.parallelEfficiency ? `<p><strong>Parallel Efficiency:</strong> ${(report.parallelEfficiency * 100).toFixed(1)}%</p>` : ''}
    </div>
    
    <h3>Phase Breakdown</h3>
    <table>
        <tr><th>Operation</th><th>Duration</th><th>Memory Impact</th></tr>
        ${report.phases.map(([name, metric]) => `
            <tr>
                <td>${name}</td>
                <td class="duration">${this.formatDuration(metric.duration)}</td>
                <td class="memory">${metric.memoryDelta >= 0 ? '+' : '-'}${this.formatBytes(Math.abs(metric.memoryDelta))}</td>
            </tr>
        `).join('')}
    </table>
    
    ${report.recommendations.length > 0 ? `
        <h3>Recommendations</h3>
        ${report.recommendations.map(rec => `<div class="recommendation">💡 ${rec}</div>`).join('')}
    ` : ''}
    
    <p><small>Generated on ${new Date().toISOString()}</small></p>
</body>
</html>`;

        await fs.writeFile(outputPath, html);
    }

    /**
     * Save text performance report
     */
    private async saveTextReport(outputPath: string, report: PerformanceReport): Promise<void> {
        let text = 'GLSP Generator Performance Report\n';
        text += '=====================================\n\n';
        text += `Total Duration: ${this.formatDuration(report.totalDuration)}\n`;
        text += `Peak Memory: ${this.formatBytes(report.memoryPeak)}\n`;

        if (report.cacheHitRate) {
            text += `Cache Hit Rate: ${(report.cacheHitRate * 100).toFixed(1)}%\n`;
        }

        if (report.parallelEfficiency) {
            text += `Parallel Efficiency: ${(report.parallelEfficiency * 100).toFixed(1)}%\n`;
        }

        text += '\nPhase Breakdown:\n';
        text += '----------------\n';

        for (const [name, metric] of report.phases) {
            text += `${name}: ${this.formatDuration(metric.duration)} `;
            text += `(${metric.memoryDelta >= 0 ? '+' : '-'}${this.formatBytes(Math.abs(metric.memoryDelta))})\n`;
        }

        if (report.recommendations.length > 0) {
            text += '\nRecommendations:\n';
            text += '---------------\n';
            report.recommendations.forEach(rec => {
                text += `• ${rec}\n`;
            });
        }

        text += `\nGenerated on ${new Date().toISOString()}\n`;

        await fs.writeFile(outputPath, text);
    }

    /**
     * Print system information
     */
    private printSystemInfo(): void {
        console.log('\n🖥️  System Information:');
        console.log(`Platform: ${os.platform()} ${os.arch()}`);
        console.log(`Node.js: ${process.version}`);
        console.log(`CPUs: ${os.cpus().length}`);
        console.log(`Total Memory: ${this.formatBytes(os.totalmem())}`);
        console.log(`Free Memory: ${this.formatBytes(os.freemem())}`);
    }

    /**
     * Format duration in human-readable format
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms.toFixed(1)}ms`;

        const seconds = ms / 1000;
        if (seconds < 60) return `${seconds.toFixed(1)}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
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
}