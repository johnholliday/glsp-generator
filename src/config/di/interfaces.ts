/**
 * Service interfaces for dependency injection
 */

import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig, LinterConfig } from '../types.js';
import { ValidationResult } from '../../validation/types.js';
/**
 * Service type identifiers for dependency injection
 * These symbols are used to register and resolve services in the container
 */
export const TYPES = {
    // Core Services
    IFileSystemService: Symbol.for('IFileSystemService'),
    ILoggerService: Symbol.for('ILoggerService'),
    IProgressService: Symbol.for('IProgressService'),
    IConfigurationService: Symbol.for('IConfigurationService'),
    ICacheService: Symbol.for('ICacheService'),
    ICommandExecutorService: Symbol.for('ICommandExecutorService'),
    ITemplateService: Symbol.for('ITemplateService'),
    IValidationService: Symbol.for('IValidationService'),
    IEventService: Symbol.for('IEventService'),
    IMetricsService: Symbol.for('IMetricsService'),
    IHealthCheckService: Symbol.for('IHealthCheckService'),

    // Domain Services
    IGrammarParserService: Symbol.for('IGrammarParserService'),
    ILinterService: Symbol.for('ILinterService'),
    ITypeSafetyGeneratorService: Symbol.for('ITypeSafetyGeneratorService'),
    ITestGeneratorService: Symbol.for('ITestGeneratorService'),
    IPackageManagerService: Symbol.for('IPackageManagerService'),

    // Factory Services
    IServiceFactory: Symbol.for('IServiceFactory'),
    IContainerFactory: Symbol.for('IContainerFactory')
} as const;

// File system abstraction
export interface IFileSystemService {
    readFile(path: string, encoding?: BufferEncoding): Promise<string>;
    writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
    pathExists(path: string): Promise<boolean>;
    ensureDir(path: string): Promise<void>;
    readJSON<T = any>(path: string): Promise<T>;
    writeJSON(path: string, data: any, options?: { spaces?: number }): Promise<void>;
}

// Logger abstraction
export interface ILoggerService {
    trace(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    child(bindings: Record<string, any>): ILoggerService;
}

// Progress reporting
export interface IProgressService {
    createProgress(title: string, total?: number): IProgressReporter;
}

export interface IProgressReporter {
    report(increment: number, message?: string): void;
    complete(message?: string): void;
    fail(error: Error): void;
}

// Configuration service
export interface IConfigurationService {
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: any): Promise<void>;
    has(key: string): boolean;
    getAll(): Record<string, any>;
}

// Cache service
export interface ICacheService {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
}

// Grammar parsing service interface
export interface IGrammarParserService {
    parseGrammarFile(grammarPath: string): Promise<ParsedGrammar>;
    parseGrammar(grammarContent: string): Promise<any>;
    validateGrammarFile(grammarPath: string): Promise<boolean>;
}

// Linting service interface
export interface ILinterService {
    lintGrammar(grammarFile: string, grammarContent: string, ast: any): Promise<ValidationResult>;
    formatResults(result: ValidationResult, grammarFile: string, sourceLines?: string[]): string;
    updateConfig(config: Partial<LinterConfig>): void;
}

// Type safety generation service interface
export interface ITypeSafetyGeneratorService {
    generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: any
    ): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }>;
}

// Test generation service interface
export interface ITestGeneratorService {
    generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: any
    ): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }>;
}

// Package management service interface
export interface IPackageManagerService {
    installPackage(packageName: string, options?: any): Promise<void>;
    uninstallPackage(packageName: string): Promise<void>;
    listInstalledPackages(): Promise<any[]>;
    searchPackages(query: string): Promise<any[]>;
    getPackageInfo(packageName: string): Promise<any>;
    isPackageInstalled(packageName: string): Promise<boolean>;
    validatePackage(packageName: string): Promise<{ valid: boolean; errors: string[] }>;
    updatePackage(packageName: string): Promise<void>;
    getPackageDependencies(packageName: string): Promise<string[]>;
}

// GLSP Generator service interface
export interface IGLSPGeneratorService {
    generateExtension(
        grammarFile: string,
        outputDir?: string,
        options?: any
    ): Promise<{ extensionDir: string }>;
    validateGrammar(grammarFile: string, options?: any): Promise<boolean>;
    validateWithDetails(grammarFile: string): Promise<ValidationResult>;
    generateDocumentation(grammarFile: string, outputDir?: string, options?: any): Promise<void>;
    generateTypeSafety(grammarFile: string, outputDir?: string, options?: any): Promise<void>;
    generateTests(grammarFile: string, outputDir?: string, options?: any): Promise<void>;
    generateCICD(grammarFile: string, outputDir?: string, options?: any): Promise<void>;
    generate(grammarFile: string, outputDir?: string): Promise<void>;
}

// Documentation Generator service interface
export interface IDocumentationGeneratorService {
    generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: any
    ): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }>;
}

// Validation Reporter service interface
export interface IValidationReporterService {
    generateHtmlReport(result: ValidationResult, grammarFile: string, outputPath: string): Promise<void>;
    generateMarkdownReport(result: ValidationResult, grammarFile: string, outputPath: string): Promise<void>;
}

// CICD Generator service interface
export interface ICICDGeneratorService {
    generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: any
    ): Promise<{ success: boolean; filesGenerated: string[]; errors?: string[] }>;
}

// Template System service interface
export interface ITemplateSystemService {
    initialize(options?: any): Promise<any>;
}

// Performance Optimizer service interface
export interface IPerformanceOptimizerService {
    startMonitoring(): void;
    stopMonitoring(): Promise<void>;
    getProgress(): any;
    shouldOptimize(fileSize: number): boolean;
    getStreamingParser(): any;
    getCacheManager(): any;
    getParallelProcessor(): any;
    getOptimizationRecommendations(): string[];
}

// Logger service interface (extending the basic one for compatibility)
export interface ILoggerServiceExtended extends ILoggerService {
    info(message: string, meta?: any): void;
}

// Command execution service
export interface ICommandExecutorService {
    execute(command: string, options?: { cwd?: string; timeout?: number }): Promise<{ stdout: string; stderr: string }>;
    spawn(command: string, args: string[], options?: any): Promise<any>;
}

// Template service
export interface ITemplateService {
    renderTemplate(templatePath: string, data: any): Promise<string>;
    renderString(template: string, data: any): string;
    registerHelper(name: string, helper: Function): void;
    registerPartial(name: string, partial: string): void;
}

// Validation service
export interface IValidationService {
    validateGrammar(grammar: ParsedGrammar): ValidationResult;
    validateConfig(config: GLSPConfig): ValidationResult;
    validateOutputStructure(outputDir: string): ValidationResult;
}

// Event service
export interface IEventService {
    emit(event: string, data?: any): void;
    on(event: string, handler: (data?: any) => void): void;
    off(event: string, handler: (data?: any) => void): void;
    once(event: string, handler: (data?: any) => void): void;
}

// Metrics service
export interface IMetricsService {
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    incrementCounter(name: string, tags?: Record<string, string>): void;
    recordDuration(name: string, duration: number, tags?: Record<string, string>): void;
    getMetrics(): Record<string, any>;
}

// Health check service
export interface IHealthCheckService {
    registerCheck(name: string, check: () => Promise<boolean>): void;
    runChecks(): Promise<Record<string, boolean>>;
    getStatus(): Promise<'healthy' | 'unhealthy' | 'degraded'>;
}

// Service identifiers (symbols for better type safety)
export const SERVICE_IDENTIFIERS = {
    FileSystemService: Symbol.for('FileSystemService'),
    LoggerService: Symbol.for('LoggerService'),
    ProgressService: Symbol.for('ProgressService'),
    ConfigurationService: Symbol.for('ConfigurationService'),
    CacheService: Symbol.for('CacheService'),
    GrammarParserService: Symbol.for('GrammarParserService'),
    LinterService: Symbol.for('LinterService'),
    TypeSafetyGeneratorService: Symbol.for('TypeSafetyGeneratorService'),
    TestGeneratorService: Symbol.for('TestGeneratorService'),
    PackageManagerService: Symbol.for('PackageManagerService'),
    CommandExecutorService: Symbol.for('CommandExecutorService'),
    TemplateService: Symbol.for('TemplateService'),
    ValidationService: Symbol.for('ValidationService'),
    EventService: Symbol.for('EventService'),
    MetricsService: Symbol.for('MetricsService'),
    HealthCheckService: Symbol.for('HealthCheckService')
} as const;

// Factory interfaces for complex object creation
export interface IGrammarParserFactory {
    create(options?: any): IGrammarParserService;
}

export interface ILinterFactory {
    create(config?: LinterConfig): ILinterService;
}

export interface ITypeSafetyGeneratorFactory {
    create(options?: any): ITypeSafetyGeneratorService;
}

export interface ITestGeneratorFactory {
    create(options?: any): ITestGeneratorService;
}

export interface IPackageManagerFactory {
    create(options?: any): IPackageManagerService;
}

// Factory service identifiers
export const FACTORY_IDENTIFIERS = {
    GrammarParserFactory: Symbol.for('GrammarParserFactory'),
    LinterFactory: Symbol.for('LinterFactory'),
    TypeSafetyGeneratorFactory: Symbol.for('TypeSafetyGeneratorFactory'),
    TestGeneratorFactory: Symbol.for('TestGeneratorFactory'),
    PackageManagerFactory: Symbol.for('PackageManagerFactory')
} as const;