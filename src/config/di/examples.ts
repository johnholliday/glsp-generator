/**
 * Dependency Injection System - Usage Examples
 * 
 * This file demonstrates various ways to use the DI system in the GLSP generator.
 * These examples show best practices and common patterns.
 */

import {
    Injectable,
    Inject,
    PostConstruct,
    PreDestroy,
    Optional,
    // Lazy,
    createContainer,
    createTestContainer,
    TYPES,
    ILoggerService,
    IFileSystemService,
    IConfigurationService,
    ICacheService,
    IGrammarParserService,
    ServiceLifetime
} from './index.js';

/**
 * Example 1: Basic Service with Constructor Injection
 */
@Injectable()
export class BasicExampleService {
    constructor(
        @Inject(TYPES.ILoggerService) private logger: ILoggerService,
        @Inject(TYPES.IFileSystemService) private fileSystem: IFileSystemService
    ) { }

    async processFile(filePath: string): Promise<string> {
        this.logger.info('Processing file', { filePath });

        try {
            const content = await this.fileSystem.readFile(filePath);
            this.logger.debug('File read successfully', { size: content.length });
            return content.toUpperCase();
        } catch (error) {
            this.logger.error('Failed to process file', error as Error, { filePath });
            throw error;
        }
    }
}

/**
 * Example 2: Service with Lifecycle Management
 */
@Injectable()
export class LifecycleExampleService {
    private isInitialized = false;
    private resources: any[] = [];

    constructor(
        @Inject(TYPES.ILoggerService) private logger: ILoggerService,
        @Inject(TYPES.IConfigurationService) private config: IConfigurationService
    ) { }

    @PostConstruct()
    async initialize(): Promise<void> {
        this.logger.info('Initializing lifecycle service');

        const maxResources = this.config.get<number>('maxResources', 10);
        this.resources = new Array(maxResources).fill(null);

        this.isInitialized = true;
        this.logger.info('Lifecycle service initialized', { maxResources });
    }

    @PreDestroy()
    async cleanup(): Promise<void> {
        this.logger.info('Cleaning up lifecycle service');

        this.resources = [];
        this.isInitialized = false;

        this.logger.info('Lifecycle service cleaned up');
    }

    getStatus(): { initialized: boolean; resourceCount: number } {
        return {
            initialized: this.isInitialized,
            resourceCount: this.resources.length
        };
    }
}

/**
 * Example 3: Service with Optional Dependencies
 */
@Injectable()
export class OptionalDependencyService {
    constructor(
        @Inject(TYPES.ILoggerService) private logger: ILoggerService,
        @Optional() @Inject(TYPES.ICacheService) private cache?: ICacheService
    ) { }

    async getData(key: string): Promise<any> {
        this.logger.debug('Getting data', { key, cacheAvailable: !!this.cache });

        // Try cache first if available
        if (this.cache) {
            const cached = await this.cache.get(key);
            if (cached) {
                this.logger.debug('Data found in cache', { key });
                return cached;
            }
        }

        // Simulate data fetching
        const data = { key, value: `data-${key}`, timestamp: Date.now() };

        // Cache if available
        if (this.cache) {
            await this.cache.set(key, data, 300); // 5 minutes TTL
            this.logger.debug('Data cached', { key });
        }

        return data;
    }
}

/**
 * Example 4: Service with Lazy Dependencies
 */
@Injectable()
export class LazyDependencyService {
    constructor(
        @Inject(TYPES.ILoggerService) private logger: ILoggerService,
        @Inject(TYPES.IGrammarParserService) private grammarParser: IGrammarParserService
    ) { }

    async parseGrammarWhenNeeded(grammarPath: string): Promise<any> {
        this.logger.info('Lazy loading grammar parser');

        // Grammar parser is only resolved when actually needed
        const grammarParser = this.grammarParser;

        return await grammarParser.parseGrammarFile(grammarPath);
    }
}

/**
 * Example 5: Factory Pattern Service
 */
export interface IReportGenerator {
    generateReport(data: any): Promise<string>;
}

@Injectable()
export class PDFReportGenerator implements IReportGenerator {
    constructor(@Inject(TYPES.ILoggerService) private logger: ILoggerService) { }

    async generateReport(data: any): Promise<string> {
        this.logger.info('Generating PDF report');
        return `PDF Report: ${JSON.stringify(data)}`;
    }
}

@Injectable()
export class HTMLReportGenerator implements IReportGenerator {
    constructor(@Inject(TYPES.ILoggerService) private logger: ILoggerService) { }

    async generateReport(data: any): Promise<string> {
        this.logger.info('Generating HTML report');
        return `<html><body>Report: ${JSON.stringify(data)}</body></html>`;
    }
}

@Injectable()
export class ReportFactory {
    constructor(@Inject(TYPES.ILoggerService) private logger: ILoggerService) { }

    createGenerator(type: 'pdf' | 'html'): IReportGenerator {
        this.logger.debug('Creating report generator', { type });

        switch (type) {
            case 'pdf':
                return new PDFReportGenerator(this.logger);
            case 'html':
                return new HTMLReportGenerator(this.logger);
            default:
                throw new Error(`Unknown report type: ${type}`);
        }
    }
}

/**
 * Example 6: Container Usage Examples
 */
export class ContainerUsageExamples {
    /**
     * Basic container setup and usage
     */
    static async basicUsage(): Promise<void> {
        // Create container
        const container = createContainer('development');

        // Register custom services
        container.register(Symbol.for('BasicExampleService'), BasicExampleService);
        container.register(Symbol.for('LifecycleExampleService'), LifecycleExampleService);

        // Initialize container (runs PostConstruct methods)
        await container.initialize();

        // Resolve and use services
        const basicService = container.resolve(Symbol.for('BasicExampleService')) as BasicExampleService;
        const result = await basicService.processFile('example.txt');

        console.log('Processed result:', result);

        // Clean up (runs PreDestroy methods)
        await container.dispose();
    }

    /**
     * Test container usage
     */
    static async testUsage(): Promise<void> {
        // Create test container with mocks
        const container = createTestContainer();

        // Register test services
        container.register(Symbol.for('TestService'), BasicExampleService);

        await container.initialize();

        // Use mock services for testing
        const service = container.resolve(Symbol.for('TestService')) as BasicExampleService;

        // Mock file system will be used
        const result = await service.processFile('test.txt');

        console.log('Test result:', result);

        await container.dispose();
    }

    /**
     * Manual service registration
     */
    static async manualRegistration(): Promise<void> {
        const container = createContainer();

        // Register with different lifetimes
        container.register(
            Symbol.for('SingletonService'),
            LifecycleExampleService,
            ServiceLifetime.Singleton
        );

        container.register(
            Symbol.for('TransientService'),
            BasicExampleService,
            ServiceLifetime.Transient
        );

        // Register factory
        container.registerFactory(
            Symbol.for('ReportFactory'),
            (container: any) => new ReportFactory(container.resolve(TYPES.ILoggerService))
        );

        await container.initialize();

        // Singleton - same instance every time
        const singleton1 = container.resolve(Symbol.for('SingletonService'));
        const singleton2 = container.resolve(Symbol.for('SingletonService'));
        console.log('Singleton same instance:', singleton1 === singleton2); // true

        // Transient - new instance every time
        const transient1 = container.resolve(Symbol.for('TransientService'));
        const transient2 = container.resolve(Symbol.for('TransientService'));
        console.log('Transient different instances:', transient1 !== transient2); // true

        // Factory usage
        const factory = container.resolve(Symbol.for('ReportFactory')) as ReportFactory;
        const pdfGenerator = factory.createGenerator('pdf');
        const report = await pdfGenerator.generateReport({ title: 'Test Report' });
        console.log('Generated report:', report);

        await container.dispose();
    }

    /**
     * Configuration-driven service setup
     */
    static async configurationDriven(): Promise<void> {
        const container = createContainer('production');

        await container.initialize();

        // Get configuration service
        const config = container.resolve(TYPES.IConfigurationService) as IConfigurationService;

        // Set some configuration
        await config.set('app.name', 'GLSP Generator');
        await config.set('app.version', '1.0.0');
        await config.set('logging.level', 'info');

        // Services can now use configuration
        const logger = container.resolve(TYPES.ILoggerService) as ILoggerService;
        logger.info('Application started', {
            name: config.get('app.name'),
            version: config.get('app.version')
        });

        await container.dispose();
    }

    /**
     * Error handling and validation
     */
    static async errorHandling(): Promise<void> {
        const container = createContainer();

        try {
            await container.initialize();

            // This will throw if service is not registered
            // const _unknownService = container.resolve(Symbol.for('UnknownService'));
        } catch (error) {
            console.error('Expected error for unknown service:', error);
        }

        // Validate container
        const { validateContainer } = await import('./index.js');
        const validation = await validateContainer(container);

        if (!validation.valid) {
            console.error('Container validation failed:', validation.errors);
        } else {
            console.log('Container validation passed');
        }

        // Get container stats
        const { getContainerStats } = await import('./index.js');
        const stats = getContainerStats(container);
        console.log('Container stats:', stats);

        await container.dispose();
    }
}

/**
 * Example 7: Advanced Patterns
 */

/**
 * Decorator pattern for cross-cutting concerns
 */
@Injectable()
export class CachedGrammarParser implements IGrammarParserService {
    constructor(
        @Inject(TYPES.IGrammarParserService) private innerParser: IGrammarParserService,
        @Inject(TYPES.ICacheService) private cache: ICacheService,
        @Inject(TYPES.ILoggerService) private logger: ILoggerService
    ) { }

    async parseGrammarFile(grammarPath: string): Promise<any> {
        const cacheKey = `grammar:${grammarPath}`;

        // Check cache first
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.logger.debug('Grammar found in cache', { grammarPath });
            return cached;
        }

        // Parse and cache
        this.logger.debug('Parsing grammar file', { grammarPath });
        const result = await this.innerParser.parseGrammarFile(grammarPath);

        await this.cache.set(cacheKey, result, 3600); // 1 hour TTL
        this.logger.debug('Grammar cached', { grammarPath });

        return result;
    }

    async parseGrammar(grammarContent: string): Promise<any> {
        return this.innerParser.parseGrammar(grammarContent);
    }

    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        return this.innerParser.validateGrammarFile(grammarPath);
    }
}

/**
 * Plugin pattern with DI
 */
export interface IPlugin {
    name: string;
    initialize(): Promise<void>;
    execute(context: any): Promise<any>;
}

@Injectable()
export class ValidationPlugin implements IPlugin {
    name = 'validation';

    constructor(@Inject(TYPES.ILoggerService) private logger: ILoggerService) { }

    async initialize(): Promise<void> {
        this.logger.info('Validation plugin initialized');
    }

    async execute(context: any): Promise<any> {
        this.logger.debug('Running validation plugin', { context });
        return { valid: true, errors: [] };
    }
}

@Injectable()
export class PluginManager {
    private plugins: IPlugin[] = [];

    constructor(@Inject(TYPES.ILoggerService) private logger: ILoggerService) { }

    registerPlugin(plugin: IPlugin): void {
        this.plugins.push(plugin);
        this.logger.info('Plugin registered', { name: plugin.name });
    }

    async initializePlugins(): Promise<void> {
        for (const plugin of this.plugins) {
            await plugin.initialize();
        }
    }

    async executePlugins(context: any): Promise<any[]> {
        const results = [];

        for (const plugin of this.plugins) {
            try {
                const result = await plugin.execute(context);
                results.push({ plugin: plugin.name, result });
            } catch (error) {
                this.logger.error('Plugin execution failed', error as Error, { plugin: plugin.name });
                results.push({ plugin: plugin.name, error: error });
            }
        }

        return results;
    }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
    console.log('=== DI System Examples ===\n');

    try {
        console.log('1. Basic Usage:');
        await ContainerUsageExamples.basicUsage();

        console.log('\n2. Test Usage:');
        await ContainerUsageExamples.testUsage();

        console.log('\n3. Manual Registration:');
        await ContainerUsageExamples.manualRegistration();

        console.log('\n4. Configuration Driven:');
        await ContainerUsageExamples.configurationDriven();

        console.log('\n5. Error Handling:');
        await ContainerUsageExamples.errorHandling();

        console.log('\n=== Examples completed successfully ===');
    } catch (error) {
        console.error('Example execution failed:', error);
    }
}

// Export for easy testing
export const Examples = {
    BasicExampleService,
    LifecycleExampleService,
    OptionalDependencyService,
    LazyDependencyService,
    ReportFactory,
    CachedGrammarParser,
    PluginManager,
    ValidationPlugin,
    ContainerUsageExamples,
    runAllExamples
};