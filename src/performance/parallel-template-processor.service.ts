import os from 'os';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import { IParallelTemplateProcessor } from './interfaces/parallel-template-processor.interface.js';
import { ITemplateLoader } from './interfaces/template-loader.interface.js';
import { ITemplateValidator } from './interfaces/template-validator.interface.js';
import { IOutputHandler } from './interfaces/output-handler.interface.js';
import { IWorkerPool } from './interfaces/worker-pool.interface.js';
import { IPerformanceMonitor } from './interfaces/performance-monitor.interface.js';
import { IMemoryManager } from './interfaces/memory-manager.interface.js';
import { Template, GeneratorContext, ProcessingResult } from './parallel-processor.js';
import { ParallelProcessingOptions, WorkerTask, PerformanceConfig } from './types.js';
import { Worker } from 'worker_threads';

/**
 * Refactored parallel template processor with comprehensive dependency injection
 * Implements proper separation of concerns and thread-safe operations
 */
@injectable()
export class ParallelTemplateProcessorService implements IParallelTemplateProcessor {
    private maxWorkers: number;

    constructor(
        @inject(TYPES.Logger) private logger: ILogger,
        @inject(TYPES.ITemplateLoader) private _templateLoader: ITemplateLoader, // eslint-disable-line @typescript-eslint/no-unused-vars
        @inject(TYPES.ITemplateValidator) private templateValidator: ITemplateValidator,
        @inject(TYPES.IOutputHandler) private outputHandler: IOutputHandler,
        @inject(TYPES.IWorkerPool) private workerPool: IWorkerPool<Worker>,
        @inject(TYPES.IPerformanceMonitor) private performanceMonitor: IPerformanceMonitor,
        @inject(TYPES.IMemoryManager) private memoryManager: IMemoryManager,
        @inject(TYPES.PerformanceConfig) private config: PerformanceConfig
    ) {
        this.maxWorkers = Math.min(os.cpus().length, 8);
        this.logger.info(`ParallelTemplateProcessor initialized with ${this.maxWorkers} max workers`);
    }

    /**
     * Process templates in parallel with comprehensive error handling and monitoring
     */
    async processTemplates(
        templates: Template[],
        context: GeneratorContext,
        options: ParallelProcessingOptions = {}
    ): Promise<ProcessingResult[]> {
        const endTimer = this.performanceMonitor.startOperation('parallel-processing');
        this.logger.info(`Starting parallel processing of ${templates.length} templates`);

        try {
            // Start memory monitoring
            this.memoryManager.startMonitoring();

            // Validate all templates before processing
            await this.validateTemplatesBeforeProcessing(templates);

            // Group templates by dependency order
            const templateGroups = await this.groupByDependency(templates);
            this.logger.debug(`Templates grouped into ${templateGroups.length} dependency groups`);

            const results: ProcessingResult[] = [];

            // Process each group in parallel
            for (let i = 0; i < templateGroups.length; i++) {
                const group = templateGroups[i];
                this.logger.debug(`Processing group ${i + 1}/${templateGroups.length} with ${group.length} templates`);

                const groupResults = await this.processTemplateGroup(group, context, options);
                results.push(...groupResults);

                // Handle outputs for this group
                await this.outputHandler.handleResults(groupResults);

                // Memory management between groups
                await this.performMemoryManagement();
            }

            this.logger.info(`Parallel processing completed successfully: ${results.length} templates processed`);
            return results;

        } catch (error) {
            this.logger.error('Parallel processing failed', error);
            throw new Error(`Parallel processing failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.memoryManager.stopMonitoring();
            endTimer();
        }
    }

    /**
     * Get processing statistics
     */
    getStats(): {
        maxWorkers: number;
        poolSize: number;
        availableWorkers: number;
        memoryUsage: NodeJS.MemoryUsage;
    } {
        const workerStats = this.workerPool.getStats();
        return {
            maxWorkers: this.maxWorkers,
            poolSize: workerStats.totalWorkers,
            availableWorkers: workerStats.totalWorkers - workerStats.activeWorkers,
            memoryUsage: this.memoryManager.getMemoryUsage()
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        this.logger.info('Cleaning up ParallelTemplateProcessor resources');

        try {
            await Promise.all([
                this.workerPool.destroy(),
                this.outputHandler.cleanup()
            ]);

            this.memoryManager.stopMonitoring();
            this.logger.info('ParallelTemplateProcessor cleanup completed');
        } catch (error) {
            this.logger.error('Error during cleanup', error);
            throw error;
        }
    }

    /**
     * Health check for the processor
     */
    async healthCheck(): Promise<boolean> {
        try {
            const checks = await Promise.all([
                this.workerPool.healthCheck(),
                this.checkMemoryHealth(),
                this.checkSystemHealth()
            ]);

            const isHealthy = checks.every(check => check);
            this.logger.debug(`Health check completed: ${isHealthy ? 'healthy' : 'unhealthy'}`);
            return isHealthy;
        } catch (error) {
            this.logger.error('Health check failed', error);
            return false;
        }
    }

    /**
     * Validate templates before processing
     */
    private async validateTemplatesBeforeProcessing(templates: Template[]): Promise<void> {
        this.logger.debug('Validating templates before processing');

        const validationResults = await this.templateValidator.validateTemplates(templates);
        const errors: string[] = [];

        for (const [templateName, result] of validationResults) {
            if (!result.isValid) {
                errors.push(`Template ${templateName}: ${result.errors.join(', ')}`);
            }
        }

        if (errors.length > 0) {
            throw new Error(`Template validation failed:\n${errors.join('\n')}`);
        }

        // Check dependencies
        const dependencyValidation = await this.templateValidator.validateDependencies(templates);
        if (dependencyValidation.circularDependencies.length > 0) {
            throw new Error(`Circular dependencies detected: ${dependencyValidation.circularDependencies.map(cycle => cycle.join(' -> ')).join(', ')}`);
        }

        if (dependencyValidation.missingDependencies.length > 0) {
            throw new Error(`Missing dependencies: ${dependencyValidation.missingDependencies.join(', ')}`);
        }

        this.logger.debug('Template validation completed successfully');
    }

    /**
     * Process a group of templates in parallel
     */
    private async processTemplateGroup(
        templates: Template[],
        context: GeneratorContext,
        options: ParallelProcessingOptions
    ): Promise<ProcessingResult[]> {
        const endTimer = this.performanceMonitor.startOperation(`group-processing-${templates.length}`);
        this.logger.debug(`Processing template group with ${templates.length} templates`);

        try {
            const tasks: WorkerTask<any, ProcessingResult>[] = templates.map(template => ({
                id: `template-${template.name}`,
                data: { template, context },
                timeout: options.timeout || 30000,
                retries: options.retries || 2,
                priority: template.priority || 0
            }));

            // Execute tasks using the worker pool
            const workerResults = await this.workerPool.executeTasks(tasks);

            // Process results and handle errors
            const results: ProcessingResult[] = [];
            const errors: string[] = [];

            for (const workerResult of workerResults) {
                if (workerResult.error) {
                    errors.push(`Task ${workerResult.id} failed: ${workerResult.error.message}`);
                } else if (workerResult.result) {
                    results.push(workerResult.result);
                }
            }

            if (errors.length > 0) {
                this.logger.warn(`Some tasks failed: ${errors.join(', ')}`);
            }

            this.logger.debug(`Group processing completed: ${results.length}/${templates.length} successful`);
            return results;

        } finally {
            endTimer();
        }
    }

    /**
     * Group templates by dependency order using topological sorting
     */
    private async groupByDependency(templates: Template[]): Promise<Template[][]> {
        this.logger.debug('Grouping templates by dependency order');

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
                    this.logger.warn(`Breaking potential circular dependency by processing: ${remaining[0].name}`);
                    currentGroup.push(remaining[0]);
                    processed.add(remaining[0].name);
                }
            }

            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
        }

        this.logger.debug(`Templates grouped into ${groups.length} dependency groups`);
        return groups;
    }

    /**
     * Perform memory management between processing groups
     */
    private async performMemoryManagement(): Promise<void> {
        if (this.config.gcHints && this.memoryManager.isMemoryPressure()) {
            this.logger.debug('Memory pressure detected, performing garbage collection');
            this.memoryManager.forceGC();
        }

        // Check for critical memory usage
        const pressureLevel = this.memoryManager.getMemoryPressureLevel();
        if (pressureLevel === 'critical') {
            this.logger.warn('Critical memory pressure detected, performing emergency cleanup');
            this.memoryManager.emergencyCleanup();
        }
    }

    /**
     * Check memory health
     */
    private async checkMemoryHealth(): Promise<boolean> {
        const pressureLevel = this.memoryManager.getMemoryPressureLevel();
        return pressureLevel !== 'critical';
    }

    /**
     * Check system health
     */
    private async checkSystemHealth(): Promise<boolean> {
        try {
            // Basic system health checks
            const memoryUsage = this.memoryManager.getMemoryUsage();
            const maxMemory = this.config.maxMemoryUsage || (1024 * 1024 * 1024); // 1GB default

            if (memoryUsage.heapUsed > maxMemory) {
                this.logger.warn('System memory usage exceeds configured limit');
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('System health check failed', error);
            return false;
        }
    }
}