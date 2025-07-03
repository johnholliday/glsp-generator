/**
 * Mock implementations for testing purposes
 */

import {
    IFileSystemService,
    ILoggerService,
    IProgressService,
    IProgressReporter,
    IConfigurationService,
    ICacheService,
    ICommandExecutorService,
    ITemplateService,
    IValidationService,
    IEventService,
    IMetricsService,
    IHealthCheckService,
    IGrammarParserService,
    ILinterService,
    ITypeSafetyGeneratorService,
    ITestGeneratorService,
    IPackageManagerService
} from './interfaces.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../types.js';
import { ValidationResult } from '../../validation/types.js';
import { LinterConfig } from '../types.js';

/**
 * Mock file system service for testing
 */
export class MockFileSystemService implements IFileSystemService {
    private files = new Map<string, string>();
    private directories = new Set<string>();

    async readFile(path: string, _encoding?: BufferEncoding): Promise<string> {
        const content = this.files.get(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        return content;
    }

    async writeFile(path: string, content: string, _encoding?: BufferEncoding): Promise<void> {
        this.files.set(path, content);
    }

    async pathExists(path: string): Promise<boolean> {
        return this.files.has(path) || this.directories.has(path);
    }

    async ensureDir(path: string): Promise<void> {
        this.directories.add(path);
    }

    async readJSON<T = any>(path: string): Promise<T> {
        const content = await this.readFile(path);
        return JSON.parse(content);
    }

    async writeJSON(path: string, data: any, options?: { spaces?: number }): Promise<void> {
        const content = JSON.stringify(data, null, options?.spaces || 2);
        await this.writeFile(path, content);
    }

    // Test utilities
    setFile(path: string, content: string): void {
        this.files.set(path, content);
    }

    setDirectory(path: string): void {
        this.directories.add(path);
    }

    clear(): void {
        this.files.clear();
        this.directories.clear();
    }
}

/**
 * Mock logger service for testing
 */
export class MockLoggerService implements ILoggerService {
    public logs: Array<{ level: string; message: string; meta?: any; error?: Error }> = [];

    trace(message: string, meta?: any): void {
        this.logs.push({ level: 'trace', message, meta });
    }

    debug(message: string, meta?: any): void {
        this.logs.push({ level: 'debug', message, meta });
    }

    info(message: string, meta?: any): void {
        this.logs.push({ level: 'info', message, meta });
    }

    warn(message: string, meta?: any): void {
        this.logs.push({ level: 'warn', message, meta });
    }

    error(message: string, error?: Error, meta?: any): void {
        this.logs.push({ level: 'error', message, error, meta });
    }

    child(_bindings: Record<string, any>): ILoggerService {
        const child = new MockLoggerService();
        child.logs = this.logs; // Share logs with parent
        return child;
    }

    // Test utilities
    clear(): void {
        this.logs = [];
    }

    getLogsByLevel(level: string): Array<{ message: string; meta?: any; error?: Error }> {
        return this.logs.filter(log => log.level === level);
    }
}

/**
 * Mock progress reporter for testing
 */
export class MockProgressReporter implements IProgressReporter {
    public reports: Array<{ increment: number; message?: string }> = [];
    public completed = false;
    public failed = false;
    public error?: Error;

    report(increment: number, message?: string): void {
        this.reports.push({ increment, message });
    }

    complete(message?: string): void {
        this.completed = true;
        this.reports.push({ increment: 0, message });
    }

    fail(error: Error): void {
        this.failed = true;
        this.error = error;
    }
}

/**
 * Mock progress service for testing
 */
export class MockProgressService implements IProgressService {
    public reporters: MockProgressReporter[] = [];

    createProgress(_title: string, _total?: number): IProgressReporter {
        const reporter = new MockProgressReporter();
        this.reporters.push(reporter);
        return reporter;
    }

    // Test utilities
    clear(): void {
        this.reporters = [];
    }
}

/**
 * Mock configuration service for testing
 */
export class MockConfigurationService implements IConfigurationService {
    private config: Record<string, any> = {};

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

    // Test utilities
    setConfig(config: Record<string, any>): void {
        this.config = config;
    }

    clear(): void {
        this.config = {};
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

/**
 * Mock cache service for testing
 */
export class MockCacheService implements ICacheService {
    private cache = new Map<string, any>();

    async get<T>(key: string): Promise<T | undefined> {
        return this.cache.get(key);
    }

    async set<T>(key: string, value: T, _ttl?: number): Promise<void> {
        this.cache.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    async has(key: string): Promise<boolean> {
        return this.cache.has(key);
    }

    // Test utilities
    getCache(): Map<string, any> {
        return new Map(this.cache);
    }
}

/**
 * Mock command executor service for testing
 */
export class MockCommandExecutorService implements ICommandExecutorService {
    public commands: Array<{ command: string; options?: any; result: { stdout: string; stderr: string } }> = [];
    private commandResults = new Map<string, { stdout: string; stderr: string }>();

    async execute(command: string, options?: { cwd?: string; timeout?: number }): Promise<{ stdout: string; stderr: string }> {
        const result = this.commandResults.get(command) || { stdout: '', stderr: '' };
        this.commands.push({ command, options, result });
        return result;
    }

    async spawn(command: string, args: string[], options?: any): Promise<any> {
        const fullCommand = `${command} ${args.join(' ')}`;
        const result = await this.execute(fullCommand, options);
        return { ...result, code: 0 };
    }

    // Test utilities
    setCommandResult(command: string, stdout: string, stderr: string = ''): void {
        this.commandResults.set(command, { stdout, stderr });
    }

    clear(): void {
        this.commands = [];
        this.commandResults.clear();
    }
}

/**
 * Mock template service for testing
 */
export class MockTemplateService implements ITemplateService {
    private templates = new Map<string, string>();

    async renderTemplate(templatePath: string, data: any): Promise<string> {
        const template = this.templates.get(templatePath);
        if (!template) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        return this.renderString(template, data);
    }

    renderString(template: string, data: any): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value !== undefined ? String(value) : match;
        });
    }

    registerHelper(_name: string, _helper: Function): void {
        // Mock implementation
    }

    registerPartial(_name: string, _partial: string): void {
        // Mock implementation
    }

    // Test utilities
    setTemplate(path: string, content: string): void {
        this.templates.set(path, content);
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}

/**
 * Mock validation service for testing
 */
export class MockValidationService implements IValidationService {
    validateGrammar(_grammar: ParsedGrammar): ValidationResult {
        return {
            diagnostics: [],
            valid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            hintCount: 0
        };
    }

    validateConfig(_config: GLSPConfig): ValidationResult {
        return {
            diagnostics: [],
            valid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            hintCount: 0
        };
    }

    validateOutputStructure(_outputDir: string): ValidationResult {
        return {
            diagnostics: [],
            valid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            hintCount: 0
        };
    }
}

/**
 * Mock event service for testing
 */
export class MockEventService implements IEventService {
    public events: Array<{ event: string; data?: any }> = [];
    private listeners = new Map<string, Array<(data?: any) => void>>();

    emit(event: string, data?: any): void {
        this.events.push({ event, data });
        const handlers = this.listeners.get(event) || [];
        handlers.forEach(handler => handler(data));
    }

    on(event: string, handler: (data?: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    off(event: string, handler: (data?: any) => void): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    once(event: string, handler: (data?: any) => void): void {
        const onceHandler = (data?: any) => {
            handler(data);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }

    // Test utilities
    clear(): void {
        this.events = [];
        this.listeners.clear();
    }

    getEventsByType(event: string): Array<{ data?: any }> {
        return this.events.filter(e => e.event === event);
    }
}

/**
 * Mock metrics service for testing
 */
export class MockMetricsService implements IMetricsService {
    public metrics: Array<{ name: string; value: number; tags?: Record<string, string> }> = [];

    recordMetric(name: string, value: number, tags?: Record<string, string>): void {
        this.metrics.push({ name, value, tags });
    }

    incrementCounter(name: string, tags?: Record<string, string>): void {
        this.recordMetric(name, 1, tags);
    }

    recordDuration(name: string, duration: number, tags?: Record<string, string>): void {
        this.recordMetric(`${name}.duration`, duration, tags);
    }

    getMetrics(): Record<string, any> {
        const result: Record<string, any> = {};

        for (const metric of this.metrics) {
            if (!result[metric.name]) {
                result[metric.name] = { count: 0, sum: 0, values: [] };
            }
            result[metric.name].count++;
            result[metric.name].sum += metric.value;
            result[metric.name].values.push(metric.value);
        }

        return result;
    }

    // Test utilities
    clear(): void {
        this.metrics = [];
    }

    getMetricsByName(name: string): Array<{ value: number; tags?: Record<string, string> }> {
        return this.metrics.filter(m => m.name === name);
    }
}

/**
 * Mock health check service for testing
 */
export class MockHealthCheckService implements IHealthCheckService {
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

    // Test utilities
    clear(): void {
        this.checks.clear();
    }
}

/**
 * Mock grammar parser service for testing
 */
export class MockGrammarParserService implements IGrammarParserService {
    private mockResults = new Map<string, ParsedGrammar>();

    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        const result = this.mockResults.get(grammarPath);
        if (!result) {
            throw new Error(`No mock result configured for ${grammarPath}`);
        }
        return result;
    }

    async parseGrammar(_grammarContent: string): Promise<any> {
        return {
            $type: 'Grammar',
            rules: []
        };
    }

    async validateGrammarFile(_grammarPath: string): Promise<boolean> {
        return true;
    }

    // Test utilities
    setMockResult(grammarPath: string, result: ParsedGrammar): void {
        this.mockResults.set(grammarPath, result);
    }

    clear(): void {
        this.mockResults.clear();
    }
}

/**
 * Mock linter service for testing
 */
export class MockLinterService implements ILinterService {
    private mockResults = new Map<string, ValidationResult>();

    async lintGrammar(grammarFile: string, _grammarContent: string, _ast: any): Promise<ValidationResult> {
        const result = this.mockResults.get(grammarFile);
        if (result) {
            return result;
        }

        return {
            diagnostics: [],
            valid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            hintCount: 0
        };
    }

    formatResults(result: ValidationResult, grammarFile: string, _sourceLines?: string[]): string {
        return `Validation result for ${grammarFile}: ${result.valid ? 'PASSED' : 'FAILED'}`;
    }

    updateConfig(_config: Partial<LinterConfig>): void {
        // Mock implementation
    }

    // Test utilities
    setMockResult(grammarFile: string, result: ValidationResult): void {
        this.mockResults.set(grammarFile, result);
    }

    clear(): void {
        this.mockResults.clear();
    }
}

/**
 * Mock type safety generator service for testing
 */
export class MockTypeSafetyGeneratorService implements ITypeSafetyGeneratorService {
    async generate(grammar: ParsedGrammar, _config: GLSPConfig, _outputDir: string, _options?: any): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }> {
        return {
            success: true,
            filesGenerated: [
                `${grammar.projectName}-types.d.ts`,
                `${grammar.projectName}-validators.ts`,
                `${grammar.projectName}-guards.ts`,
                `${grammar.projectName}-schemas.ts`,
                `${grammar.projectName}-utilities.ts`
            ]
        };
    }
}

/**
 * Mock test generator service for testing
 */
export class MockTestGeneratorService implements ITestGeneratorService {
    async generate(_grammar: ParsedGrammar, _config: GLSPConfig, _outputDir: string, _options?: any): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }> {
        return {
            success: true,
            filesGenerated: [
                'unit-tests.ts',
                'integration-tests.ts',
                'e2e-tests.ts',
                'test-factories.ts',
                'test-config.ts'
            ]
        };
    }
}

/**
 * Mock package manager service for testing
 */
export class MockPackageManagerService implements IPackageManagerService {
    private installedPackages = new Set<string>();
    private packageInfo = new Map<string, any>();

    async installPackage(packageName: string, _options?: any): Promise<void> {
        this.installedPackages.add(packageName);
    }

    async uninstallPackage(packageName: string): Promise<void> {
        this.installedPackages.delete(packageName);
    }

    async listInstalledPackages(): Promise<any[]> {
        return Array.from(this.installedPackages).map(name => ({
            name,
            version: '1.0.0',
            installed: true
        }));
    }

    async searchPackages(query: string): Promise<any[]> {
        return [
            {
                name: `${query}-template`,
                version: '1.0.0',
                description: `Template for ${query}`,
                installed: false
            }
        ];
    }

    async getPackageInfo(packageName: string): Promise<any> {
        return this.packageInfo.get(packageName) || {
            name: packageName,
            version: '1.0.0',
            installed: this.installedPackages.has(packageName)
        };
    }

    async isPackageInstalled(packageName: string): Promise<boolean> {
        return this.installedPackages.has(packageName);
    }

    async validatePackage(_packageName: string): Promise<{ valid: boolean; errors: string[] }> {
        return { valid: true, errors: [] };
    }

    async updatePackage(_packageName: string): Promise<void> {
        // Mock implementation
    }

    async getPackageDependencies(_packageName: string): Promise<string[]> {
        return [];
    }

    // Test utilities
    setPackageInstalled(packageName: string, installed: boolean = true): void {
        if (installed) {
            this.installedPackages.add(packageName);
        } else {
            this.installedPackages.delete(packageName);
        }
    }

    setPackageInfo(packageName: string, info: any): void {
        this.packageInfo.set(packageName, info);
    }

    clear(): void {
        this.installedPackages.clear();
        this.packageInfo.clear();
    }
}