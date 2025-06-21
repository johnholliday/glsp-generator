import chalk from 'chalk';
import {
    Phase,
    ProgressOptions,
    MemoryUsage,
    PerformanceConfig
} from './types';

export interface ProgressBar {
    start(total: number): void;
    update(current: number, message?: string): void;
    increment(amount?: number, message?: string): void;
    complete(message?: string): void;
    fail(message?: string): void;
    stop(): void;
}

export interface ETACalculator {
    update(current: number, total: number): void;
    getETA(): number; // seconds
    getSpeed(): number; // items per second
    getRemainingTime(): string;
}

/**
 * Advanced progress indicator with ETA, memory monitoring, and phase tracking
 */
export class GenerationProgress {
    private progressBar?: ProgressBar;
    private currentPhase?: Phase;
    private phaseStartTime = 0;
    private totalStartTime = 0;
    private phaseProgress = new Map<string, number>();
    private etaCalculator: ETACalculator;
    private memoryMonitor?: NodeJS.Timeout;
    private verbose = false;

    constructor(
        private phases: Phase[] = [],
        private options: ProgressOptions = {},
        private config: PerformanceConfig = {}
    ) {
        this.etaCalculator = new SimpleETACalculator();
        this.verbose = config.profileMode || false;

        // Default phases if none provided
        if (this.phases.length === 0) {
            this.phases = [
                { name: 'Parsing', weight: 0.2, description: 'Parsing grammar file' },
                { name: 'Validation', weight: 0.1, description: 'Validating grammar structure' },
                { name: 'Generation', weight: 0.6, description: 'Generating templates' },
                { name: 'Writing', weight: 0.1, description: 'Writing output files' }
            ];
        }
    }

    /**
     * Start the overall generation process
     */
    start(): void {
        this.totalStartTime = Date.now();
        console.log(chalk.blue.bold('🚀 Starting GLSP Generation'));
        console.log(chalk.gray(`Phases: ${this.phases.map(p => p.name).join(' → ')}\n`));

        if (this.options.showMemory) {
            this.startMemoryMonitoring();
        }
    }

    /**
     * Start a specific phase
     */
    startPhase(phaseName: string, total?: number): void {
        this.currentPhase = this.phases.find(p => p.name === phaseName);
        this.phaseStartTime = Date.now();

        if (!this.currentPhase) {
            console.warn(`Unknown phase: ${phaseName}`);
            return;
        }

        console.log(chalk.cyan(`\n📋 ${this.currentPhase.name}`));
        if (this.currentPhase.description) {
            console.log(chalk.gray(`   ${this.currentPhase.description}`));
        }

        if (total && total > 0) {
            this.progressBar = new AdvancedProgressBar(this.options);
            this.progressBar.start(total);
            this.etaCalculator = new SimpleETACalculator();
        }

        this.phaseProgress.set(phaseName, 0);
    }

    /**
     * Update progress within current phase
     */
    updateProgress(current: number, total: number, message?: string): void {
        if (!this.currentPhase) return;

        const percent = Math.min((current / total) * 100, 100);
        this.phaseProgress.set(this.currentPhase.name, percent);

        if (this.progressBar) {
            this.progressBar.update(current, message);
        }

        if (this.options.showETA && total > 0) {
            this.etaCalculator.update(current, total);
        }

        if (this.verbose) {
            this.logVerboseProgress(current, total, message);
        }
    }

    /**
     * Increment progress by specified amount
     */
    incrementProgress(amount = 1, message?: string): void {
        if (this.progressBar) {
            this.progressBar.increment(amount, message);
        }
    }

    /**
     * Complete current phase
     */
    completePhase(message?: string): void {
        if (!this.currentPhase) return;

        const duration = Date.now() - this.phaseStartTime;
        this.phaseProgress.set(this.currentPhase.name, 100);

        if (this.progressBar) {
            this.progressBar.complete(message);
            this.progressBar = undefined;
        }

        console.log(chalk.green(`✓ ${this.currentPhase.name} completed`) +
            chalk.gray(` (${this.formatDuration(duration)})`));

        if (message) {
            console.log(chalk.gray(`  ${message}`));
        }
    }

    /**
     * Mark phase as failed
     */
    failPhase(error: string): void {
        if (!this.currentPhase) return;

        const duration = Date.now() - this.phaseStartTime;

        if (this.progressBar) {
            this.progressBar.fail(error);
            this.progressBar = undefined;
        }

        console.log(chalk.red(`✗ ${this.currentPhase.name} failed`) +
            chalk.gray(` (${this.formatDuration(duration)})`));
        console.log(chalk.red(`  ${error}`));
    }

    /**
     * Complete the entire generation process
     */
    complete(): void {
        const totalDuration = Date.now() - this.totalStartTime;

        this.stopMemoryMonitoring();

        console.log(chalk.green.bold('\n🎉 Generation Complete!'));
        console.log(chalk.gray(`Total time: ${this.formatDuration(totalDuration)}`));

        // Show phase summary
        this.showPhaseSummary();

        // Show final memory usage
        if (this.options.showMemory) {
            this.showMemoryUsage();
        }
    }

    /**
     * Abort the generation process
     */
    abort(error: string): void {
        const totalDuration = Date.now() - this.totalStartTime;

        this.stopMemoryMonitoring();

        if (this.progressBar) {
            this.progressBar.fail(error);
        }

        console.log(chalk.red.bold('\n❌ Generation Failed'));
        console.log(chalk.red(`Error: ${error}`));
        console.log(chalk.gray(`Time elapsed: ${this.formatDuration(totalDuration)}`));
    }

    /**
     * Get overall progress percentage
     */
    getOverallProgress(): number {
        let totalWeight = 0;
        let completedWeight = 0;

        for (const phase of this.phases) {
            totalWeight += phase.weight;
            const phaseProgress = this.phaseProgress.get(phase.name) || 0;
            completedWeight += (phaseProgress / 100) * phase.weight;
        }

        return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    }

    /**
     * Start memory monitoring
     */
    private startMemoryMonitoring(): void {
        const interval = this.options.updateInterval || 1000;

        this.memoryMonitor = setInterval(() => {
            if (this.verbose) {
                this.showMemoryUsage();
            }
        }, interval);
    }

    /**
     * Stop memory monitoring
     */
    private stopMemoryMonitoring(): void {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = undefined;
        }
    }

    /**
     * Show current memory usage
     */
    private showMemoryUsage(): void {
        const memory = process.memoryUsage();
        const heapUsed = this.formatBytes(memory.heapUsed);
        const heapTotal = this.formatBytes(memory.heapTotal);
        const rss = this.formatBytes(memory.rss);

        console.log(chalk.gray(`💾 Memory: ${heapUsed}/${heapTotal} heap, ${rss} resident`));
    }

    /**
     * Log verbose progress information
     */
    private logVerboseProgress(current: number, total: number, message?: string): void {
        const percent = ((current / total) * 100).toFixed(1);
        const eta = this.options.showETA ? this.etaCalculator.getRemainingTime() : '';
        const speed = this.options.showSpeed ? this.etaCalculator.getSpeed().toFixed(1) : '';

        let logMessage = `[${percent}%]`;
        if (message) logMessage += ` ${message}`;
        if (eta) logMessage += ` (ETA: ${eta})`;
        if (speed) logMessage += ` (${speed}/s)`;

        console.log(chalk.gray(`  ${logMessage}`));
    }

    /**
     * Show phase summary
     */
    private showPhaseSummary(): void {
        console.log(chalk.cyan('\n📊 Phase Summary:'));

        for (const phase of this.phases) {
            const progress = this.phaseProgress.get(phase.name) || 0;
            const status = progress === 100 ? chalk.green('✓') : chalk.yellow('◐');
            console.log(`  ${status} ${phase.name}: ${progress.toFixed(1)}%`);
        }
    }

    /**
     * Format duration in human-readable format
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;

        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
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

/**
 * Advanced progress bar with Unicode characters
 */
export class AdvancedProgressBar implements ProgressBar {
    private current = 0;
    private total = 0;
    private startTime = 0;
    private lastUpdate = 0;
    private isActive = false;

    constructor(private options: ProgressOptions = {}) { }

    start(total: number): void {
        this.total = total;
        this.current = 0;
        this.startTime = Date.now();
        this.lastUpdate = this.startTime;
        this.isActive = true;
        this.render();
    }

    update(current: number, message?: string): void {
        if (!this.isActive) return;

        this.current = Math.min(current, this.total);
        this.render(message);
    }

    increment(amount = 1, message?: string): void {
        this.update(this.current + amount, message);
    }

    complete(message?: string): void {
        if (!this.isActive) return;

        this.current = this.total;
        this.render(message);
        this.isActive = false;
        console.log(); // New line after completion
    }

    fail(message?: string): void {
        if (!this.isActive) return;

        this.isActive = false;
        process.stdout.write('\r' + ' '.repeat(80) + '\r'); // Clear line
        console.log(chalk.red(`❌ ${message || 'Failed'}`));
    }

    stop(): void {
        this.isActive = false;
    }

    private render(message?: string): void {
        if (!this.isActive || this.total === 0) return;

        const now = Date.now();
        const updateInterval = this.options.updateInterval || 100;

        // Throttle updates
        if (now - this.lastUpdate < updateInterval && this.current < this.total) {
            return;
        }
        this.lastUpdate = now;

        const percent = (this.current / this.total) * 100;
        const barWidth = 30;
        const filled = Math.round((this.current / this.total) * barWidth);

        // Create progress bar
        const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

        // Format status
        let status = `[${bar}] ${percent.toFixed(1)}% (${this.current}/${this.total})`;

        // Add ETA if enabled
        if (this.options.showETA && this.current > 0) {
            const elapsed = now - this.startTime;
            const rate = this.current / (elapsed / 1000);
            const remaining = (this.total - this.current) / rate;
            status += ` ETA: ${this.formatTime(remaining)}`;
        }

        // Add speed if enabled
        if (this.options.showSpeed && this.current > 0) {
            const elapsed = (now - this.startTime) / 1000;
            const speed = this.current / elapsed;
            status += ` (${speed.toFixed(1)}/s)`;
        }

        // Add message
        if (message) {
            status += ` - ${message}`;
        }

        // Render
        process.stdout.write(`\r${status.slice(0, 120)}`); // Limit to 120 chars
    }

    private formatTime(seconds: number): string {
        if (!isFinite(seconds) || seconds < 0) return '--:--';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Simple ETA calculator using moving average
 */
export class SimpleETACalculator implements ETACalculator {
    private samples: Array<{ time: number; progress: number }> = [];
    private maxSamples = 10;

    update(current: number, total: number): void {
        const now = Date.now();
        this.samples.push({ time: now, progress: current });

        // Keep only recent samples
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    getETA(): number {
        if (this.samples.length < 2) return 0;

        const speed = this.getSpeed();
        if (speed === 0) return 0;

        const current = this.samples[this.samples.length - 1].progress;
        const total = current; // This should be passed separately in real implementation

        return (total - current) / speed;
    }

    getSpeed(): number {
        if (this.samples.length < 2) return 0;

        const first = this.samples[0];
        const last = this.samples[this.samples.length - 1];

        const timeDiff = (last.time - first.time) / 1000; // seconds
        const progressDiff = last.progress - first.progress;

        return timeDiff > 0 ? progressDiff / timeDiff : 0;
    }

    getRemainingTime(): string {
        const eta = this.getETA();

        if (!isFinite(eta) || eta <= 0) return '--:--';

        const minutes = Math.floor(eta / 60);
        const seconds = Math.floor(eta % 60);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}