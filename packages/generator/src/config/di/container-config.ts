/**
 * Dependency injection container configuration and module system
 */

import { ServiceContainer } from './container.js';
import {
    IServiceContainer,
    IServiceModule,
    ServiceLifetime,
    DIConfiguration
} from '../../types/di.js';
import {
    SERVICE_IDENTIFIERS,
    FACTORY_IDENTIFIERS,
    IGrammarParserService,
    ILinterService,
    ITypeSafetyGeneratorService,
    ITestGeneratorService,
    IPackageManagerService,
    IGrammarParserFactory,
    ILinterFactory,
    ITypeSafetyGeneratorFactory,
    ITestGeneratorFactory,
    IPackageManagerFactory
} from './interfaces.js';
import {
    FileSystemService,
    LoggerService,
    ProgressService,
    ConfigurationService,
    CommandExecutorService,
    TemplateService,
    ValidationService,
    EventService,
    MetricsService,
    HealthCheckService
} from './services.js';
import { LangiumGrammarParser } from '../../utils/langium-grammar-parser.js';
import { GrammarLinter } from '../../validation/linter.js';
import { TypeSafetyGenerator } from '../../type-safety/type-safety-generator.js';
import { TestGenerator } from '../../test-generation/test-generator.js';
import { TemplatePackageManager } from '../../templates/package-manager.js';
import { LinterConfig } from '../types.js';

/**
 * Core services module - registers all fundamental services
 */
export class CoreServicesModule implements IServiceModule {
    async configure(container: IServiceContainer): Promise<void> {
        // Core infrastructure services
        container.registerSingleton(SERVICE_IDENTIFIERS.FileSystemService, FileSystemService);
        container.registerSingleton(SERVICE_IDENTIFIERS.LoggerService, LoggerService);
        container.registerSingleton(SERVICE_IDENTIFIERS.ProgressService, ProgressService);
        container.registerSingleton(SERVICE_IDENTIFIERS.ConfigurationService, ConfigurationService);
        container.registerSingleton(SERVICE_IDENTIFIERS.CommandExecutorService, CommandExecutorService);
        container.registerSingleton(SERVICE_IDENTIFIERS.TemplateService, TemplateService);
        container.registerSingleton(SERVICE_IDENTIFIERS.ValidationService, ValidationService);
        container.registerSingleton(SERVICE_IDENTIFIERS.EventService, EventService);
        container.registerSingleton(SERVICE_IDENTIFIERS.MetricsService, MetricsService);
        container.registerSingleton(SERVICE_IDENTIFIERS.HealthCheckService, HealthCheckService);
    }
}

/**
 * Business services module - registers domain-specific services
 */
export class BusinessServicesModule implements IServiceModule {
    async configure(container: IServiceContainer): Promise<void> {
        // Main business services
        container.registerSingleton(SERVICE_IDENTIFIERS.GrammarParserService, LangiumGrammarParser);
        container.registerSingleton(SERVICE_IDENTIFIERS.LinterService, GrammarLinter);
        container.registerSingleton(SERVICE_IDENTIFIERS.TypeSafetyGeneratorService, TypeSafetyGenerator);
        container.registerSingleton(SERVICE_IDENTIFIERS.TestGeneratorService, TestGenerator);
        container.registerSingleton(SERVICE_IDENTIFIERS.PackageManagerService, TemplatePackageManager);
    }
}

/**
 * Factory services module - registers factory patterns for complex object creation
 */
export class FactoryServicesModule implements IServiceModule {
    async configure(container: IServiceContainer): Promise<void> {
        // Grammar parser factory
        container.registerFactory<IGrammarParserFactory>(
            FACTORY_IDENTIFIERS.GrammarParserFactory,
            () => ({
                create: (_options?: any) => {
                    return container.resolve<IGrammarParserService>(SERVICE_IDENTIFIERS.GrammarParserService);
                }
            }),
            ServiceLifetime.Singleton
        );

        // Linter factory
        container.registerFactory<ILinterFactory>(
            FACTORY_IDENTIFIERS.LinterFactory,
            () => ({
                create: (config?: LinterConfig) => {
                    if (config) {
                        // Create a new scope with custom config
                        const scope = container.createScope();
                        scope.registerInstance('LinterConfig', config);
                        return scope.resolve<ILinterService>(SERVICE_IDENTIFIERS.LinterService);
                    }
                    return container.resolve<ILinterService>(SERVICE_IDENTIFIERS.LinterService);
                }
            }),
            ServiceLifetime.Singleton
        );

        // Type safety generator factory
        container.registerFactory<ITypeSafetyGeneratorFactory>(
            FACTORY_IDENTIFIERS.TypeSafetyGeneratorFactory,
            () => ({
                create: (_options?: any) => {
                    return container.resolve<ITypeSafetyGeneratorService>(SERVICE_IDENTIFIERS.TypeSafetyGeneratorService);
                }
            }),
            ServiceLifetime.Singleton
        );

        // Test generator factory
        container.registerFactory<ITestGeneratorFactory>(
            FACTORY_IDENTIFIERS.TestGeneratorFactory,
            () => ({
                create: (_options?: any) => {
                    return container.resolve<ITestGeneratorService>(SERVICE_IDENTIFIERS.TestGeneratorService);
                }
            }),
            ServiceLifetime.Singleton
        );

        // Package manager factory
        container.registerFactory<IPackageManagerFactory>(
            FACTORY_IDENTIFIERS.PackageManagerFactory,
            () => ({
                create: (_options?: any) => {
                    return container.resolve<IPackageManagerService>(SERVICE_IDENTIFIERS.PackageManagerService);
                }
            }),
            ServiceLifetime.Singleton
        );
    }
}

/**
 * Health check module - registers health checks for all services
 */
export class HealthCheckModule implements IServiceModule {
    async configure(container: IServiceContainer): Promise<void> {
        const healthCheckService = container.resolve<HealthCheckService>(SERVICE_IDENTIFIERS.HealthCheckService);

        // Register health checks for critical services
        healthCheckService.registerCheck('file-system', async () => {
            try {
                const fs = container.resolve<FileSystemService>(SERVICE_IDENTIFIERS.FileSystemService);
                await fs.pathExists(process.cwd());
                return true;
            } catch {
                return false;
            }
        });


        healthCheckService.registerCheck('command-executor', async () => {
            try {
                const executor = container.resolve<CommandExecutorService>(SERVICE_IDENTIFIERS.CommandExecutorService);
                await executor.execute('echo "health-check"');
                return true;
            } catch {
                return false;
            }
        });

        healthCheckService.registerCheck('grammar-parser', async () => {
            try {
                const parser = container.resolve<IGrammarParserService>(SERVICE_IDENTIFIERS.GrammarParserService);
                // Simple validation that the service is available
                return typeof parser.parseGrammar === 'function';
            } catch {
                return false;
            }
        });

        healthCheckService.registerCheck('linter', async () => {
            try {
                const linter = container.resolve<ILinterService>(SERVICE_IDENTIFIERS.LinterService);
                return typeof linter.lintGrammar === 'function';
            } catch {
                return false;
            }
        });
    }
}

/**
 * Container builder with fluent API for easy configuration
 */
export class ContainerBuilder {
    private modules: IServiceModule[] = [];
    private config: DIConfiguration = {};

    withModule(module: IServiceModule): ContainerBuilder {
        this.modules.push(module);
        return this;
    }

    withConfiguration(config: Partial<DIConfiguration>): ContainerBuilder {
        this.config = { ...this.config, ...config };
        return this;
    }

    withCoreServices(): ContainerBuilder {
        return this.withModule(new CoreServicesModule());
    }

    withBusinessServices(): ContainerBuilder {
        return this.withModule(new BusinessServicesModule());
    }

    withFactories(): ContainerBuilder {
        return this.withModule(new FactoryServicesModule());
    }

    withHealthChecks(): ContainerBuilder {
        return this.withModule(new HealthCheckModule());
    }

    withDefaultModules(): ContainerBuilder {
        return this
            .withCoreServices()
            .withBusinessServices()
            .withFactories()
            .withHealthChecks();
    }

    async build(): Promise<IServiceContainer> {
        const container = new ServiceContainer(this.config);

        // Configure all modules
        for (const module of this.modules) {
            await module.configure(container);
        }

        return container;
    }
}

/**
 * Default container factory with standard configuration
 */
export async function createDefaultContainer(): Promise<IServiceContainer> {
    return new ContainerBuilder()
        .withConfiguration({
            enableValidation: true,
            enableCircularDependencyDetection: true,
            enableLazyLoading: true,
            maxResolutionDepth: 50,
            logLevel: 'info'
        })
        .withDefaultModules()
        .build();
}

/**
 * Development container factory with enhanced debugging
 */
export async function createDevelopmentContainer(): Promise<IServiceContainer> {
    return new ContainerBuilder()
        .withConfiguration({
            enableValidation: true,
            enableCircularDependencyDetection: true,
            enableLazyLoading: true,
            maxResolutionDepth: 100,
            logLevel: 'debug'
        })
        .withDefaultModules()
        .build();
}

/**
 * Production container factory with optimized settings
 */
export async function createProductionContainer(): Promise<IServiceContainer> {
    return new ContainerBuilder()
        .withConfiguration({
            enableValidation: false,
            enableCircularDependencyDetection: false,
            enableLazyLoading: true,
            maxResolutionDepth: 30,
            logLevel: 'warn'
        })
        .withDefaultModules()
        .build();
}

/**
 * Test container factory with mocked services
 */
export async function createTestContainer(): Promise<IServiceContainer> {
    const container = new ServiceContainer({
        enableValidation: true,
        enableCircularDependencyDetection: true,
        enableLazyLoading: false,
        maxResolutionDepth: 50,
        logLevel: 'error'
    });

    // Register core services
    await new CoreServicesModule().configure(container);

    // Register business services
    await new BusinessServicesModule().configure(container);

    // Register factories
    await new FactoryServicesModule().configure(container);

    return container;
}

/**
 * Container validation utility
 */
export async function validateContainer(container: IServiceContainer): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Test core service resolution
        const coreServices = [
            SERVICE_IDENTIFIERS.FileSystemService,
            SERVICE_IDENTIFIERS.LoggerService,
            SERVICE_IDENTIFIERS.ConfigurationService,
            SERVICE_IDENTIFIERS.EventService,
            SERVICE_IDENTIFIERS.MetricsService
        ];

        for (const serviceId of coreServices) {
            try {
                container.resolve(serviceId);
            } catch (error) {
                errors.push(`Failed to resolve core service ${String(serviceId)}: ${error}`);
            }
        }

        // Test business service resolution
        const businessServices = [
            SERVICE_IDENTIFIERS.GrammarParserService,
            SERVICE_IDENTIFIERS.LinterService,
            SERVICE_IDENTIFIERS.TypeSafetyGeneratorService,
            SERVICE_IDENTIFIERS.TestGeneratorService,
            SERVICE_IDENTIFIERS.PackageManagerService
        ];

        for (const serviceId of businessServices) {
            try {
                container.resolve(serviceId);
            } catch (error) {
                errors.push(`Failed to resolve business service ${String(serviceId)}: ${error}`);
            }
        }

        // Test factory resolution
        const factories = [
            FACTORY_IDENTIFIERS.GrammarParserFactory,
            FACTORY_IDENTIFIERS.LinterFactory,
            FACTORY_IDENTIFIERS.TypeSafetyGeneratorFactory,
            FACTORY_IDENTIFIERS.TestGeneratorFactory,
            FACTORY_IDENTIFIERS.PackageManagerFactory
        ];

        for (const factoryId of factories) {
            try {
                container.resolve(factoryId);
            } catch (error) {
                warnings.push(`Failed to resolve factory ${String(factoryId)}: ${error}`);
            }
        }

        // Run health checks if available
        try {
            const healthService = container.resolve<HealthCheckService>(SERVICE_IDENTIFIERS.HealthCheckService);
            const healthResults = await healthService.runChecks();

            for (const [checkName, result] of Object.entries(healthResults)) {
                if (!result) {
                    warnings.push(`Health check failed: ${checkName}`);
                }
            }
        } catch (error) {
            warnings.push(`Health check service unavailable: ${error}`);
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
 * Global container instance for application-wide access
 */
let globalContainer: IServiceContainer | null = null;

/**
 * Initialize the global container
 */
export async function initializeGlobalContainer(
    containerFactory: () => Promise<IServiceContainer> = createDefaultContainer
): Promise<IServiceContainer> {
    if (globalContainer) {
        await globalContainer.dispose();
    }

    globalContainer = await containerFactory();

    // Validate the container
    const validation = await validateContainer(globalContainer);
    if (!validation.isValid) {
        throw new Error(`Container validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
        console.warn('Container validation warnings:', validation.warnings);
    }

    return globalContainer;
}

/**
 * Get the global container instance
 */
export function getGlobalContainer(): IServiceContainer {
    if (!globalContainer) {
        throw new Error('Global container not initialized. Call initializeGlobalContainer() first.');
    }
    return globalContainer;
}

/**
 * Dispose the global container
 */
export async function disposeGlobalContainer(): Promise<void> {
    if (globalContainer) {
        await globalContainer.dispose();
        globalContainer = null;
    }
}