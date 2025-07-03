/**
 * Corrected Inversify container configuration
 * This version uses the actual Inversify API correctly
 */

import 'reflect-metadata';
import { Container, ContainerModule } from 'inversify';
import { TYPES } from './types.inversify.js';
import {
    IFileSystemService,
    ILoggerService,
    IProgressService,
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
    IPackageManagerService,
    IGLSPGeneratorService,
    IDocumentationGeneratorService,
    IValidationReporterService,
    ICICDGeneratorService,
    ITemplateSystemService,
    IPerformanceOptimizerService
} from './interfaces.js';
import {
    FileSystemService,
    LoggerService,
    ProgressService,
    ConfigurationService,
    CacheService,
    CommandExecutorService,
    TemplateService,
    ValidationService,
    EventService,
    MetricsService,
    HealthCheckService
} from './services.js';
import { LangiumGrammarParser } from '../../utils/langium-grammar-parser.refactored.js';
import { GrammarLinter } from '../../validation/linter.refactored.js';
import { TypeSafetyGenerator } from '../../type-safety/type-safety-generator.refactored.js';
import { TestGenerator } from '../../test-generation/test-generator.refactored.js';
import { TemplatePackageManager } from '../../templates/package-manager.refactored.js';
import { GLSPGenerator } from '../../generator.js';
import { DocumentationGenerator } from '../../documentation/documentation-generator.js';
import { ValidationReporter } from '../../validation/reporter.js';
import { CICDGenerator } from '../../cicd/cicd-generator.js';
import { TemplateSystem } from '../../templates/index.js';
import { PerformanceOptimizer } from '../../performance/index.js';
import {
    MockFileSystemService,
    MockLoggerService,
    MockProgressService,
    MockConfigurationService,
    MockCacheService,
    MockCommandExecutorService,
    MockTemplateService,
    MockValidationService,
    MockEventService,
    MockMetricsService,
    MockHealthCheckService,
    MockGrammarParserService,
    MockLinterService,
    MockTypeSafetyGeneratorService,
    MockTestGeneratorService,
    MockPackageManagerService
} from './mocks.js';

/**
 * Core services module - registers all fundamental infrastructure services
 */
export const coreServicesModule = new ContainerModule(({ bind }) => {
    // File System Service
    bind<IFileSystemService>(TYPES.IFileSystemService).to(FileSystemService).inSingletonScope();

    // Logger Service
    bind<ILoggerService>(TYPES.ILoggerService).to(LoggerService).inSingletonScope();

    // Progress Service
    bind<IProgressService>(TYPES.IProgressService).to(ProgressService).inSingletonScope();

    // Configuration Service
    bind<IConfigurationService>(TYPES.IConfigurationService).to(ConfigurationService).inSingletonScope();

    // Cache Service
    bind<ICacheService>(TYPES.ICacheService).to(CacheService).inSingletonScope();

    // Command Executor Service
    bind<ICommandExecutorService>(TYPES.ICommandExecutorService).to(CommandExecutorService).inSingletonScope();

    // Template Service
    bind<ITemplateService>(TYPES.ITemplateService).to(TemplateService).inSingletonScope();

    // Validation Service
    bind<IValidationService>(TYPES.IValidationService).to(ValidationService).inSingletonScope();

    // Event Service
    bind<IEventService>(TYPES.IEventService).to(EventService).inSingletonScope();

    // Metrics Service
    bind<IMetricsService>(TYPES.IMetricsService).to(MetricsService).inSingletonScope();

    // Health Check Service
    bind<IHealthCheckService>(TYPES.IHealthCheckService).to(HealthCheckService).inSingletonScope();
});

/**
 * Business services module - registers domain-specific services
 */
export const businessServicesModule = new ContainerModule(({ bind }) => {
    // Grammar Parser Service
    bind<IGrammarParserService>(TYPES.IGrammarParserService).to(LangiumGrammarParser).inSingletonScope();

    // Linter Service
    bind<ILinterService>(TYPES.ILinterService).to(GrammarLinter).inSingletonScope();

    // Type Safety Generator Service
    bind<ITypeSafetyGeneratorService>(TYPES.ITypeSafetyGeneratorService).to(TypeSafetyGenerator).inSingletonScope();

    // Test Generator Service
    bind<ITestGeneratorService>(TYPES.ITestGeneratorService).to(TestGenerator).inSingletonScope();

    // Package Manager Service
    bind<IPackageManagerService>(TYPES.IPackageManagerService).to(TemplatePackageManager).inSingletonScope();

    // GLSP Generator Service
    bind<IGLSPGeneratorService>(TYPES.IGLSPGeneratorService).to(GLSPGenerator).inSingletonScope();

    // Documentation Generator Service
    bind<IDocumentationGeneratorService>(TYPES.IDocumentationGeneratorService).to(DocumentationGenerator).inSingletonScope();

    // Validation Reporter Service
    bind<IValidationReporterService>(TYPES.IValidationReporterService).to(ValidationReporter).inSingletonScope();

    // CICD Generator Service
    bind<ICICDGeneratorService>(TYPES.ICICDGeneratorService).to(CICDGenerator).inSingletonScope();

    // Template System Service
    bind<ITemplateSystemService>(TYPES.ITemplateSystemService).to(TemplateSystem).inSingletonScope();

    // Performance Optimizer Service
    bind<IPerformanceOptimizerService>(TYPES.IPerformanceOptimizerService).to(PerformanceOptimizer).inSingletonScope();
});


/**
 * Mock services module for testing
 */
export const mockServicesModule = new ContainerModule(({ bind }) => {
    // Core Mock Services
    bind<IFileSystemService>(TYPES.IFileSystemService).to(MockFileSystemService).inSingletonScope();
    bind<ILoggerService>(TYPES.ILoggerService).to(MockLoggerService).inSingletonScope();
    bind<IProgressService>(TYPES.IProgressService).to(MockProgressService).inSingletonScope();
    bind<IConfigurationService>(TYPES.IConfigurationService).to(MockConfigurationService).inSingletonScope();
    bind<ICacheService>(TYPES.ICacheService).to(MockCacheService).inSingletonScope();
    bind<ICommandExecutorService>(TYPES.ICommandExecutorService).to(MockCommandExecutorService).inSingletonScope();
    bind<ITemplateService>(TYPES.ITemplateService).to(MockTemplateService).inSingletonScope();
    bind<IValidationService>(TYPES.IValidationService).to(MockValidationService).inSingletonScope();
    bind<IEventService>(TYPES.IEventService).to(MockEventService).inSingletonScope();
    bind<IMetricsService>(TYPES.IMetricsService).to(MockMetricsService).inSingletonScope();
    bind<IHealthCheckService>(TYPES.IHealthCheckService).to(MockHealthCheckService).inSingletonScope();

    // Business Mock Services
    bind<IGrammarParserService>(TYPES.IGrammarParserService).to(MockGrammarParserService).inSingletonScope();
    bind<ILinterService>(TYPES.ILinterService).to(MockLinterService).inSingletonScope();
    bind<ITypeSafetyGeneratorService>(TYPES.ITypeSafetyGeneratorService).to(MockTypeSafetyGeneratorService).inSingletonScope();
    bind<ITestGeneratorService>(TYPES.ITestGeneratorService).to(MockTestGeneratorService).inSingletonScope();
    bind<IPackageManagerService>(TYPES.IPackageManagerService).to(MockPackageManagerService).inSingletonScope();
});

/**
 * Container configuration options
 */
export interface InversifyContainerOptions {
    environment?: 'development' | 'test' | 'production';
    enableMocks?: boolean;
}

/**
 * Create Inversify container with specified configuration
 */
export function createInversifyContainer(options: InversifyContainerOptions = {}): Container {
    const {
        environment = 'development',
        enableMocks = false
    } = options;

    const container = new Container({
        defaultScope: 'Singleton'
    });

    // Load core modules
    container.load(coreServicesModule);

    // Load business services (or mocks for testing)
    if (enableMocks || environment === 'test') {
        container.load(mockServicesModule);
    } else {
        container.load(businessServicesModule);
    }

    return container;
}

/**
 * Create development container with enhanced debugging
 */
export function createDevelopmentContainer(): Container {
    return createInversifyContainer({
        environment: 'development',
        enableMocks: false
    });
}

/**
 * Create production container
 */
export function createProductionContainer(): Container {
    return createInversifyContainer({
        environment: 'production',
        enableMocks: false
    });
}

/**
 * Create test container with mocked services
 */
export function createTestContainer(): Container {
    return createInversifyContainer({
        environment: 'test',
        enableMocks: true
    });
}

/**
 * Container validation utility
 */
export async function validateInversifyContainer(container: Container): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Test core service resolution
        const coreServices = [
            TYPES.IFileSystemService,
            TYPES.ILoggerService,
            TYPES.IConfigurationService,
            TYPES.ICacheService,
            TYPES.IEventService,
            TYPES.IMetricsService
        ];

        for (const serviceType of coreServices) {
            try {
                container.get(serviceType);
            } catch (error) {
                errors.push(`Failed to resolve core service ${String(serviceType)}: ${error}`);
            }
        }

        // Test business service resolution
        const businessServices = [
            TYPES.IGrammarParserService,
            TYPES.ILinterService,
            TYPES.ITypeSafetyGeneratorService,
            TYPES.ITestGeneratorService,
            TYPES.IPackageManagerService
        ];

        for (const serviceType of businessServices) {
            try {
                container.get(serviceType);
            } catch (error) {
                errors.push(`Failed to resolve business service ${String(serviceType)}: ${error}`);
            }
        }


        // Run health checks if available
        if (container.isBound(TYPES.IHealthCheckService)) {
            try {
                const healthService = container.get<IHealthCheckService>(TYPES.IHealthCheckService);
                const healthResults = await healthService.runChecks();

                for (const [checkName, result] of Object.entries(healthResults)) {
                    if (!result) {
                        warnings.push(`Health check failed: ${checkName}`);
                    }
                }
            } catch (error) {
                warnings.push(`Health check service unavailable: ${error}`);
            }
        }

    } catch (error) {
        errors.push(`Container validation failed: ${error}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Global container instance management
 */
let globalContainer: Container | null = null;

/**
 * Initialize the global Inversify container
 */
export async function initializeGlobalInversifyContainer(
    containerFactory: () => Container = createDevelopmentContainer
): Promise<Container> {
    if (globalContainer) {
        // Dispose existing container if needed
        globalContainer = null;
    }

    globalContainer = containerFactory();

    // Validate the container
    const validation = await validateInversifyContainer(globalContainer);
    if (!validation.isValid) {
        throw new Error(`Container validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
        console.warn('Container validation warnings:', validation.warnings);
    }

    return globalContainer;
}

/**
 * Get the global Inversify container instance
 */
export function getGlobalInversifyContainer(): Container {
    if (!globalContainer) {
        throw new Error('Global Inversify container not initialized. Call initializeGlobalInversifyContainer() first.');
    }
    return globalContainer;
}

/**
 * Dispose the global Inversify container
 */
export async function disposeGlobalInversifyContainer(): Promise<void> {
    if (globalContainer) {
        // Inversify doesn't have built-in disposal, but we can clear bindings
        globalContainer.unbindAll();
        globalContainer = null;
    }
}