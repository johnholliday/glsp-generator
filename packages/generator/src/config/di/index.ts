/**
 * Dependency Injection System - Main Entry Point
 * 
 * This module provides a comprehensive dependency injection system for the GLSP generator.
 * It includes:
 * - IoC Container with lifecycle management
 * - Decorator-based dependency injection
 * - Service interfaces and implementations
 * - Mock implementations for testing
 * - Container configuration and modules
 * 
 * @example
 * ```typescript
 * import { createContainer, Injectable, Inject } from './config/di';
 * 
 * // Create and configure container
 * const container = createContainer();
 * 
 * // Use in classes
 * @Injectable()
 * class MyService {
 *   constructor(
 *     @Inject(TYPES.ILoggerService) private logger: ILoggerService
 *   ) {}
 * }
 * 
 * // Register and resolve
 * container.register(TYPES.MyService, MyService);
 * const service = container.resolve(TYPES.MyService);
 * ```
 */

// Core DI Types
export * from '../../types/di.js';

// Decorators
export * from './decorators.js';

// Container
export { ServiceContainer } from './container.js';

// Service Interfaces
export * from './interfaces.js';

// Core Services
export * from './services.js';

// Container Configuration
export * from './container-config.js';

// Mock Implementations
export * from './mocks.js';

// Re-export commonly used symbols for convenience
// Note: TYPES is defined in interfaces.js and contains all service identifiers
import { TYPES } from './interfaces.js';
export { TYPES };

/**
 * Creates a new service container with default configuration
 * 
 * @param environment - The environment to configure for ('development', 'test', 'production')
 * @returns Configured service container
 * 
 * @example
 * ```typescript
 * const container = createContainer('development');
 * await container.initialize();
 * 
 * const logger = container.resolve(TYPES.ILoggerService);
 * logger.info('Container initialized');
 * ```
 */
export function createContainer(environment: 'development' | 'test' | 'production' = 'development') {
    const { ContainerConfigBuilder } = require('./container-config.js');

    const config = new ContainerConfigBuilder()
        .withEnvironment(environment)
        .withHealthChecks()
        .withMetrics()
        .build();

    return config.createContainer();
}

/**
 * Creates a test container with mock implementations
 * 
 * @returns Service container configured for testing
 * 
 * @example
 * ```typescript
 * const container = createTestContainer();
 * await container.initialize();
 * 
 * const mockLogger = container.resolve(TYPES.ILoggerService) as MockLoggerService;
 * mockLogger.clear(); // Clear previous logs
 * ```
 */
export function createTestContainer() {
    const { ContainerConfigBuilder } = require('./container-config.js');

    const config = new ContainerConfigBuilder()
        .withEnvironment('test')
        .withMockServices()
        .build();

    return config.createContainer();
}

/**
 * Creates a minimal container with only core services
 * Useful for lightweight scenarios or when you want to register services manually
 * 
 * @returns Minimal service container
 * 
 * @example
 * ```typescript
 * const container = createMinimalContainer();
 * 
 * // Register your own services
 * container.register(TYPES.IMyService, MyService);
 * 
 * await container.initialize();
 * ```
 */
export function createMinimalContainer() {
    const { ServiceContainer } = require('./container.js');
    return new ServiceContainer();
}

/**
 * Utility function to validate container configuration
 * 
 * @param container - The container to validate
 * @returns Validation result with any issues found
 * 
 * @example
 * ```typescript
 * const container = createContainer();
 * const validation = await validateContainer(container);
 * 
 * if (!validation.valid) {
 *   console.error('Container validation failed:', validation.errors);
 * }
 * ```
 */
export async function validateContainer(container: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Check if container is initialized
        if (!container.isInitialized) {
            warnings.push('Container is not initialized');
        }

        // Validate core services are registered
        const { TYPES } = require('./interfaces.js');
        const coreServices = [
            TYPES.ILoggerService,
            TYPES.IFileSystemService,
            TYPES.IConfigurationService,
            TYPES.ICacheService
        ];

        for (const serviceType of coreServices) {
            try {
                container.resolve(serviceType);
            } catch (error) {
                errors.push(`Core service not registered: ${String(serviceType)}`);
            }
        }

        // Run health checks if available
        try {
            const healthService = container.resolve(TYPES.IHealthCheckService);
            const healthStatus = await healthService.getStatus();

            if (healthStatus === 'unhealthy') {
                errors.push('Health checks indicate unhealthy state');
            } else if (healthStatus === 'degraded') {
                warnings.push('Health checks indicate degraded state');
            }
        } catch {
            warnings.push('Health check service not available');
        }

    } catch (error) {
        errors.push(`Container validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Utility function to get container metrics and statistics
 * 
 * @param container - The container to analyze
 * @returns Container metrics and statistics
 * 
 * @example
 * ```typescript
 * const container = createContainer();
 * await container.initialize();
 * 
 * const stats = getContainerStats(container);
 * console.log(`Registered services: ${stats.registeredServices}`);
 * console.log(`Resolved instances: ${stats.resolvedInstances}`);
 * ```
 */
export function getContainerStats(container: any): {
    registeredServices: number;
    resolvedInstances: number;
    singletonInstances: number;
    circularDependencies: number;
    memoryUsage?: {
        used: number;
        total: number;
    };
} {
    const stats = {
        registeredServices: 0,
        resolvedInstances: 0,
        singletonInstances: 0,
        circularDependencies: 0,
        memoryUsage: undefined as any
    };

    try {
        // Get basic container stats
        if (container.getRegisteredServices) {
            stats.registeredServices = container.getRegisteredServices().length;
        }

        if (container.getResolvedInstances) {
            stats.resolvedInstances = container.getResolvedInstances().length;
        }

        if (container.getSingletonInstances) {
            stats.singletonInstances = container.getSingletonInstances().length;
        }

        if (container.getCircularDependencies) {
            stats.circularDependencies = container.getCircularDependencies().length;
        }

        // Get memory usage if available
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memory = process.memoryUsage();
            stats.memoryUsage = {
                used: memory.heapUsed,
                total: memory.heapTotal
            };
        }

    } catch (error) {
        // Ignore errors in stats collection
    }

    return stats;
}

/**
 * Utility function to dispose of a container and clean up resources
 * 
 * @param container - The container to dispose
 * 
 * @example
 * ```typescript
 * const container = createContainer();
 * await container.initialize();
 * 
 * // Use container...
 * 
 * // Clean up
 * await disposeContainer(container);
 * ```
 */
export async function disposeContainer(container: any): Promise<void> {
    try {
        if (container.dispose) {
            await container.dispose();
        }
    } catch (error) {
        console.error('Error disposing container:', error);
        throw error;
    }
}

/**
 * Type guard to check if an object is a service container
 * 
 * @param obj - Object to check
 * @returns True if object is a service container
 */
export function isServiceContainer(obj: any): obj is any {
    return obj &&
        typeof obj.register === 'function' &&
        typeof obj.resolve === 'function' &&
        typeof obj.initialize === 'function';
}

/**
 * Default container instance for global use
 * Note: Use with caution in production code. Prefer explicit dependency injection.
 */
let defaultContainer: any = null;

/**
 * Gets or creates the default container instance
 * 
 * @param environment - Environment to configure for if creating new container
 * @returns The default container instance
 * 
 * @example
 * ```typescript
 * const container = getDefaultContainer();
 * const logger = container.resolve(TYPES.ILoggerService);
 * ```
 */
export function getDefaultContainer(environment: 'development' | 'test' | 'production' = 'development') {
    if (!defaultContainer) {
        defaultContainer = createContainer(environment);
    }
    return defaultContainer;
}

/**
 * Resets the default container instance
 * Useful for testing or when you need a fresh container
 * 
 * @example
 * ```typescript
 * // In test setup
 * resetDefaultContainer();
 * const container = getDefaultContainer('test');
 * ```
 */
export async function resetDefaultContainer(): Promise<void> {
    if (defaultContainer) {
        await disposeContainer(defaultContainer);
        defaultContainer = null;
    }
}

// Export version information
export const VERSION = '1.0.0';
export const DI_SYSTEM_NAME = 'GLSP Generator DI';

/**
 * DI System information and utilities
 */
export const DISystem = {
    VERSION,
    NAME: DI_SYSTEM_NAME,
    createContainer,
    createTestContainer,
    createMinimalContainer,
    validateContainer,
    getContainerStats,
    disposeContainer,
    isServiceContainer,
    getDefaultContainer,
    resetDefaultContainer
} as const;