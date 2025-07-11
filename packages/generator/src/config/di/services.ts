/**
 * Core service implementations for dependency injection
 */

import fs from 'fs-extra';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import pino, { Logger } from 'pino';
import {
    IFileSystemService,
    ILoggerService,
    IProgressService,
    IProgressReporter,
    IConfigurationService,
    ICommandExecutorService,
    ITemplateService,
    IValidationService,
    IEventService,
    IMetricsService,
    IHealthCheckService
} from './interfaces.js';
import { Singleton } from './decorators.js';
import { ValidationResult } from '../../validation/types.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../types.js';

const execAsync = promisify(exec);

@Singleton()
export class FileSystemService implements IFileSystemService {
    async readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return fs.readFile(path, encoding);
    }

    async writeFile(path: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        return fs.writeFile(path, content, encoding);
    }

    async pathExists(path: string): Promise<boolean> {
        return fs.pathExists(path);
    }

    async ensureDir(path: string): Promise<void> {
        return fs.ensureDir(path);
    }

    async readJSON<T = any>(path: string): Promise<T> {
        return fs.readJSON(path);
    }

    async writeJSON(path: string, data: any, options: { spaces?: number } = {}): Promise<void> {
        return fs.writeJSON(path, data, options);
    }
}

@Singleton()
export class LoggerService implements ILoggerService {
    private logger: Logger;

    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            }
        });
    }

    trace(message: string, meta?: any): void {
        this.logger.trace(meta, message);
    }

    debug(message: string, meta?: any): void {
        this.logger.debug(meta, message);
    }

    info(message: string, meta?: any): void {
        this.logger.info(meta, message);
    }

    warn(message: string, meta?: any): void {
        this.logger.warn(meta, message);
    }

    error(message: string, error?: Error, meta?: any): void {
        this.logger.error({ err: error, ...meta }, message);
    }

    child(bindings: Record<string, any>): ILoggerService {
        const childLogger = new LoggerService();
        childLogger.logger = this.logger.child(bindings);
        return childLogger;
    }
}

@Singleton()
export class ProgressService implements IProgressService {
    createProgress(title: string, total?: number): IProgressReporter {
        return new ProgressReporter(title, total);
    }
}

class ProgressReporter implements IProgressReporter {
    private current = 0;
    private startTime = performance.now();

    constructor(
        private title: string,
        private total?: number
    ) {
        console.log(`🚀 ${this.title}`);
    }

    report(increment: number, message?: string): void {
        this.current += increment;
        const elapsed = performance.now() - this.startTime;

        if (this.total) {
            const percentage = Math.round((this.current / this.total) * 100);
            const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
            console.log(`   [${bar}] ${percentage}% ${message || ''} (${Math.round(elapsed)}ms)`);
        } else {
            console.log(`   ⏳ ${this.current} ${message || ''} (${Math.round(elapsed)}ms)`);
        }
    }

    complete(message?: string): void {
        const elapsed = performance.now() - this.startTime;
        console.log(`✅ ${this.title} completed ${message || ''} (${Math.round(elapsed)}ms)`);
    }

    fail(error: Error): void {
        const elapsed = performance.now() - this.startTime;
        console.log(`❌ ${this.title} failed: ${error.message} (${Math.round(elapsed)}ms)`);
    }
}

@Singleton()
export class ConfigurationService implements IConfigurationService {
    private config: Record<string, any> = {};

    constructor() {
        // Load default configuration
        this.loadDefaults();
    }

    get<T>(key: string, defaultValue?: T): T {
        const value = this.getNestedValue(this.config, key);
        return value !== undefined ? value : defaultValue!;
    }

    async set(key: string, value: any): Promise<void> {
        this.setNestedValue(this.config, key, value);
    }

    has(key: string): boolean {
        return this.getNestedValue(this.config, key) !== undefined;
    }

    getAll(): Record<string, any> {
        return { ...this.config };
    }

    private loadDefaults(): void {
        this.config = {
            logging: {
                level: 'info',
                format: 'pretty'
            },
            cache: {
                ttl: 3600000, // 1 hour
                maxSize: 1000
            },
            performance: {
                enableMetrics: true,
                enableTracing: false
            }
        };
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}


@Singleton()
export class CommandExecutorService implements ICommandExecutorService {
    async execute(command: string, options: { cwd?: string; timeout?: number } = {}): Promise<{ stdout: string; stderr: string }> {
        const { cwd, timeout = 30000 } = options;

        try {
            const result = await execAsync(command, { cwd, timeout });
            return {
                stdout: result.stdout,
                stderr: result.stderr
            };
        } catch (error: any) {
            throw new Error(`Command failed: ${command}\n${error.message}`);
        }
    }

    async spawn(command: string, args: string[], options: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, options);

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject(new Error(`Process exited with code ${code}\n${stderr}`));
                }
            });

            child.on('error', reject);
        });
    }
}

@Singleton()
export class TemplateService implements ITemplateService {
    private helpers = new Map<string, Function>();
    private partials = new Map<string, string>();

    async renderTemplate(templatePath: string, data: any): Promise<string> {
        const fs = new FileSystemService();
        const template = await fs.readFile(templatePath);
        return this.renderString(template, data);
    }

    renderString(template: string, data: any): string {
        // Simple template engine - replace {{variable}} with data values
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value !== undefined ? String(value) : match;
        });
    }

    registerHelper(name: string, helper: Function): void {
        this.helpers.set(name, helper);
    }

    registerPartial(name: string, partial: string): void {
        this.partials.set(name, partial);
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}

@Singleton()
export class ValidationService implements IValidationService {
    validateGrammar(grammar: ParsedGrammar): ValidationResult {
        const diagnostics: any[] = [];

        // Basic validation
        if (!grammar.projectName) {
            diagnostics.push({
                severity: 'error',
                code: 'GRAMMAR001',
                message: 'Grammar must have a project name',
                location: { file: '', line: 1, column: 1 }
            });
        }

        if (!grammar.interfaces || grammar.interfaces.length === 0) {
            diagnostics.push({
                severity: 'warning',
                code: 'GRAMMAR002',
                message: 'Grammar has no interfaces defined',
                location: { file: '', line: 1, column: 1 }
            });
        }

        return {
            diagnostics,
            valid: diagnostics.filter(d => d.severity === 'error').length === 0,
            errorCount: diagnostics.filter(d => d.severity === 'error').length,
            warningCount: diagnostics.filter(d => d.severity === 'warning').length,
            infoCount: diagnostics.filter(d => d.severity === 'info').length,
            hintCount: diagnostics.filter(d => d.severity === 'hint').length
        };
    }

    validateConfig(config: GLSPConfig): ValidationResult {
        const diagnostics: any[] = [];

        if (!config.extension?.name) {
            diagnostics.push({
                severity: 'error',
                code: 'CONFIG001',
                message: 'Extension must have a name',
                location: { file: '', line: 1, column: 1 }
            });
        }

        return {
            diagnostics,
            valid: diagnostics.filter(d => d.severity === 'error').length === 0,
            errorCount: diagnostics.filter(d => d.severity === 'error').length,
            warningCount: diagnostics.filter(d => d.severity === 'warning').length,
            infoCount: diagnostics.filter(d => d.severity === 'info').length,
            hintCount: diagnostics.filter(d => d.severity === 'hint').length
        };
    }

    validateOutputStructure(_outputDir: string): ValidationResult {
        const diagnostics: any[] = [];

        // Add validation logic for output structure

        return {
            diagnostics,
            valid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            hintCount: 0
        };
    }
}

@Singleton()
export class EventService implements IEventService {
    private emitter = new EventEmitter();

    emit(event: string, data?: any): void {
        this.emitter.emit(event, data);
    }

    on(event: string, handler: (data?: any) => void): void {
        this.emitter.on(event, handler);
    }

    off(event: string, handler: (data?: any) => void): void {
        this.emitter.off(event, handler);
    }

    once(event: string, handler: (data?: any) => void): void {
        this.emitter.once(event, handler);
    }
}

@Singleton()
export class MetricsService implements IMetricsService {
    private metrics = new Map<string, any[]>();

    recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        this.metrics.get(name)!.push({
            value,
            tags,
            timestamp: Date.now()
        });
    }

    incrementCounter(name: string, tags: Record<string, string> = {}): void {
        this.recordMetric(name, 1, tags);
    }

    recordDuration(name: string, duration: number, tags: Record<string, string> = {}): void {
        this.recordMetric(`${name}.duration`, duration, tags);
    }

    getMetrics(): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [name, values] of this.metrics.entries()) {
            result[name] = {
                count: values.length,
                sum: values.reduce((sum, v) => sum + v.value, 0),
                avg: values.length > 0 ? values.reduce((sum, v) => sum + v.value, 0) / values.length : 0,
                min: values.length > 0 ? Math.min(...values.map(v => v.value)) : 0,
                max: values.length > 0 ? Math.max(...values.map(v => v.value)) : 0
            };
        }

        return result;
    }
}

@Singleton()
export class HealthCheckService implements IHealthCheckService {
    private checks = new Map<string, () => Promise<boolean>>();

    registerCheck(name: string, check: () => Promise<boolean>): void {
        this.checks.set(name, check);
    }

    async runChecks(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        for (const [name, check] of this.checks.entries()) {
            try {
                results[name] = await check();
            } catch {
                results[name] = false;
            }
        }

        return results;
    }

    async getStatus(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
        const results = await this.runChecks();
        const values = Object.values(results);

        if (values.every(v => v)) return 'healthy';
        if (values.every(v => !v)) return 'unhealthy';
        return 'degraded';
    }
}