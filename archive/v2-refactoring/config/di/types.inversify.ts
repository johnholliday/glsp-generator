/**
 * Inversify service type identifiers
 * These symbols are used to register and resolve services in the Inversify container
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
    IGLSPGeneratorService: Symbol.for('IGLSPGeneratorService'),
    IDocumentationGeneratorService: Symbol.for('IDocumentationGeneratorService'),
    IValidationReporterService: Symbol.for('IValidationReporterService'),
    ICICDGeneratorService: Symbol.for('ICICDGeneratorService'),
    ITemplateSystemService: Symbol.for('ITemplateSystemService'),
    IPerformanceOptimizerService: Symbol.for('IPerformanceOptimizerService'),

    // Factory Services
    IGrammarParserFactory: Symbol.for('IGrammarParserFactory'),
    ILinterFactory: Symbol.for('ILinterFactory'),
    ITypeSafetyGeneratorFactory: Symbol.for('ITypeSafetyGeneratorFactory'),
    ITestGeneratorFactory: Symbol.for('ITestGeneratorFactory'),
    IPackageManagerFactory: Symbol.for('IPackageManagerFactory'),

    // Configuration
    LinterConfig: Symbol.for('LinterConfig'),
    GLSPConfig: Symbol.for('GLSPConfig'),

    // Lazy Factories
    LazyGrammarParser: Symbol.for('LazyGrammarParser'),
    LazyLinter: Symbol.for('LazyLinter'),
    LazyTypeSafetyGenerator: Symbol.for('LazyTypeSafetyGenerator'),
    LazyTestGenerator: Symbol.for('LazyTestGenerator'),
    LazyPackageManager: Symbol.for('LazyPackageManager')
} as const;

/**
 * Type definitions for lazy factories
 */
export interface LazyFactory<T> {
    (): T;
}

/**
 * Type definitions for async factories
 */
export interface AsyncFactory<T> {
    (): Promise<T>;
}

/**
 * Service tags for categorization and conditional binding
 */
export const SERVICE_TAGS = {
    CORE: 'core',
    BUSINESS: 'business',
    FACTORY: 'factory',
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
} as const;

/**
 * Named bindings for specific configurations
 */
export const NAMED_BINDINGS = {
    DEVELOPMENT_LOGGER: 'development-logger',
    PRODUCTION_LOGGER: 'production-logger',
    TEST_LOGGER: 'test-logger',
    FILE_CACHE: 'file-cache',
    MEMORY_CACHE: 'memory-cache',
    REDIS_CACHE: 'redis-cache'
} as const;