import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import {
    ParallelProcessingOptions,
    WorkerTask,
    WorkerResult,
    ResourcePool,
    WorkerPool,
    PerformanceConfig
} from './types';
import { PerformanceMonitor } from './monitor.js';

// Use __dirname for finding worker file
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Template {
    name: string;
    path: string;
    content: string;
    dependencies: string[];
    priority: number;
}

export interface GeneratorContext {
    projectName: string;
    grammar: any;
    config: any;
    outputDir: string;
    [key: string]: any;
}

export interface ProcessingResult {
    templateName: string;
    outputPath: string;
    content: string;
    size: number;
    duration: number;
}

/**
 * Parallel template processor using worker threads
 */
export class ParallelTemplateProcessor {
    private workerPool: WorkerPool<Worker>;
    private monitor: PerformanceMonitor;
    private maxWorkers: number;

    constructor(
        private config: PerformanceConfig = {},
        options: ParallelProcessingOptions = {},
        monitor?: PerformanceMonitor
    ) {
        this.monitor = monitor || new PerformanceMonitor();
        this.maxWorkers = options.maxWorkers || Math.min(os.cpus().length, 8);
        this.workerPool = new WorkerThreadPool(this.maxWorkers, options);
    }

    /**
     * Process templates in parallel
     */
    async processTemplates(
        templates: Template[],
        context: GeneratorContext,
        options: ParallelProcessingOptions = {}
    ): Promise<ProcessingResult[]> {
        const endTimer = this.monitor.startOperation('parallel-processing');

        try {
            // Group templates by dependency order
            const templateGroups = this.groupByDependency(templates);
            const results: ProcessingResult[] = [];

            // Process each group in parallel
            for (const group of templateGroups) {
                const groupResults = await this.processTemplateGroup(group, context, options);
                results.push(...groupResults);

                // Optional GC hint between groups
                if (this.config.gcHints && global.gc) {
                    global.gc();
                }
            }

            return results;
        } finally {
            endTimer();
        }
    }

    /**
     * Process a group of templates in parallel
     */
    private async processTemplateGroup(
        templates: Template[],
        context: GeneratorContext,
        options: ParallelProcessingOptions
    ): Promise<ProcessingResult[]> {
        const endTimer = this.monitor.startOperation(`group-processing-${templates.length}`);

        try {
            const tasks: WorkerTask<any, ProcessingResult>[] = templates.map(template => ({
                id: `template-${template.name}`,
                data: { template, context },
                timeout: options.timeout || 30000,
                retries: options.retries || 2,
                priority: template.priority || 0
            }));

            // Process tasks in parallel
            const results = await Promise.all(
                tasks.map(task => this.processTask(task))
            );

            return results.filter(result => result.result !== undefined).map(result => result.result!);
        } finally {
            endTimer();
        }
    }

    /**
     * Process a single task using worker pool
     */
    private async processTask(task: WorkerTask<any, ProcessingResult>): Promise<WorkerResult<ProcessingResult>> {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        try {
            const worker = await this.workerPool.acquire();

            try {
                const result = await this.executeWorkerTask(worker, task);
                return {
                    id: task.id,
                    result,
                    duration: Date.now() - startTime,
                    memoryUsage: process.memoryUsage()
                };
            } finally {
                this.workerPool.release(worker);
            }
        } catch (error) {
            return {
                id: task.id,
                error: error instanceof Error ? error : new Error(String(error)),
                duration: Date.now() - startTime,
                memoryUsage: process.memoryUsage()
            };
        }
    }

    /**
     * Execute task in worker thread
     */
    private async executeWorkerTask(
        worker: Worker,
        task: WorkerTask<any, ProcessingResult>
    ): Promise<ProcessingResult> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Task ${task.id} timed out`));
            }, task.timeout || 30000);

            worker.once('message', (result) => {
                clearTimeout(timeout);
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result.data);
                }
            });

            worker.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            worker.postMessage(task);
        });
    }

    /**
     * Group templates by dependency order
     */
    private groupByDependency(templates: Template[]): Template[][] {
        const groups: Template[][] = [];
        const processed = new Set<string>();
        const templateMap = new Map(templates.map(t => [t.name, t]));

        // Sort by priority first
        const sortedTemplates = [...templates].sort((a, b) => b.priority - a.priority);

        while (processed.size < templates.length) {
            const currentGroup: Template[] = [];

            for (const template of sortedTemplates) {
                if (processed.has(template.name)) continue;

                // Check if all dependencies are satisfied
                const dependenciesSatisfied = template.dependencies.every(dep =>
                    processed.has(dep) || !templateMap.has(dep)
                );

                if (dependenciesSatisfied) {
                    currentGroup.push(template);
                    processed.add(template.name);
                }
            }

            if (currentGroup.length === 0) {
                // Handle circular dependencies by processing remaining templates
                const remaining = sortedTemplates.filter(t => !processed.has(t.name));
                if (remaining.length > 0) {
                    currentGroup.push(remaining[0]);
                    processed.add(remaining[0].name);
                }
            }

            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
        }

        return groups;
    }

    /**
     * Get processing statistics
     */
    getStats() {
        return {
            maxWorkers: this.maxWorkers,
            poolSize: this.workerPool.size(),
            availableWorkers: this.workerPool.available(),
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        await this.workerPool.destroy();
    }
}

/**
 * Worker thread pool implementation
 */
export class WorkerThreadPool implements WorkerPool<Worker> {
    private workers: Worker[] = [];
    private _available: Worker[] = [];
    private waitingQueue: Array<(worker: Worker) => void> = [];

    constructor(
        private maxSize: number,
        private options: ParallelProcessingOptions = {}
    ) {
        this.initialize();
    }

    private initialize(): void {
        for (let i = 0; i < this.maxSize; i++) {
            const worker = this.createWorker();
            this.workers.push(worker);
            this._available.push(worker);
        }
    }

    private createWorker(): Worker {
        const workerPath = path.join(__dirname, 'template-worker.js');
        const worker = new Worker(workerPath);

        worker.on('error', (error) => {
            console.error('Worker error:', error);
            this.replaceWorker(worker);
        });

        return worker;
    }

    private replaceWorker(oldWorker: Worker): void {
        const index = this.workers.indexOf(oldWorker);
        if (index !== -1) {
            this.workers[index] = this.createWorker();
        }

        const availableIndex = this._available.indexOf(oldWorker);
        if (availableIndex !== -1) {
            this._available[availableIndex] = this.workers[index];
        }

        oldWorker.terminate();
    }

    async acquire(): Promise<Worker> {
        if (this._available.length > 0) {
            return this._available.pop()!;
        }

        return new Promise((resolve) => {
            this.waitingQueue.push(resolve);
        });
    }

    release(worker: Worker): void {
        if (this.waitingQueue.length > 0) {
            const resolve = this.waitingQueue.shift()!;
            resolve(worker);
        } else {
            this._available.push(worker);
        }
    }

    size(): number {
        return this.workers.length;
    }

    available(): number {
        return this._available.length;
    }

    async destroy(): Promise<void> {
        await Promise.all(this.workers.map(worker => worker.terminate()));
        this.workers = [];
        this._available = [];
        this.waitingQueue = [];
    }
}

// Worker thread code is now in a separate file: template-worker.js