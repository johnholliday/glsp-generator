/**
 * Dependency Injection types and interfaces
 */


// Core DI types
export type ServiceIdentifier<T = any> = string | symbol | Constructor<T>;
export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T> = (...args: any[]) => T | Promise<T>;
export type AsyncFactory<T> = (...args: any[]) => Promise<T>;

// Lifecycle management
export enum ServiceLifetime {
    Transient = 'transient',
    Singleton = 'singleton',
    Scoped = 'scoped'
}

// Service registration
export interface ServiceRegistration<T = any> {
    identifier: ServiceIdentifier<T>;
    implementation?: Constructor<T>;
    factory?: Factory<T>;
    instance?: T;
    lifetime: ServiceLifetime;
    dependencies?: ServiceIdentifier[];
    lazy?: boolean;
    tags?: string[];
    metadata?: Record<string, any>;
}

// Container interfaces
export interface IServiceContainer {
    register<T>(registration: ServiceRegistration<T>): void;
    registerSingleton<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void;
    registerTransient<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void;
    registerFactory<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>, lifetime?: ServiceLifetime): void;
    registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void;

    resolve<T>(identifier: ServiceIdentifier<T>): T;
    resolveAsync<T>(identifier: ServiceIdentifier<T>): Promise<T>;
    tryResolve<T>(identifier: ServiceIdentifier<T>): T | undefined;

    isRegistered<T>(identifier: ServiceIdentifier<T>): boolean;
    getRegistration<T>(identifier: ServiceIdentifier<T>): ServiceRegistration<T> | undefined;

    createScope(): IServiceScope;
    dispose(): Promise<void>;
}

export interface IServiceScope extends IServiceContainer {
    parent: IServiceContainer;
}

// Disposable pattern
export interface IDisposable {
    dispose(): void | Promise<void>;
}

// Configuration interfaces
export interface DIConfiguration {
    enableValidation?: boolean;
    enableCircularDependencyDetection?: boolean;
    enableLazyLoading?: boolean;
    maxResolutionDepth?: number;
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

// Error types
export class DIError extends Error {
    constructor(message: string, public readonly identifier?: ServiceIdentifier) {
        super(message);
        this.name = 'DIError';
    }
}

export class CircularDependencyError extends DIError {
    constructor(dependencyChain: ServiceIdentifier[]) {
        const chain = dependencyChain.map(id => String(id)).join(' -> ');
        super(`Circular dependency detected: ${chain}`, dependencyChain[0]);
        this.name = 'CircularDependencyError';
    }
}

export class ServiceNotFoundError extends DIError {
    constructor(identifier: ServiceIdentifier) {
        super(`Service not found: ${String(identifier)}`, identifier);
        this.name = 'ServiceNotFoundError';
    }
}

// Decorator metadata
export const INJECTABLE_METADATA_KEY = Symbol('injectable');
export const INJECT_METADATA_KEY = Symbol('inject');
export const OPTIONAL_METADATA_KEY = Symbol('optional');
export const LAZY_METADATA_KEY = Symbol('lazy');

// Decorator interfaces
export interface InjectableOptions {
    lifetime?: ServiceLifetime;
    tags?: string[];
    identifier?: ServiceIdentifier;
}

export interface InjectOptions {
    identifier?: ServiceIdentifier;
    optional?: boolean;
    lazy?: boolean;
}

// Service locator pattern (for legacy support)
export interface IServiceLocator {
    getService<T>(identifier: ServiceIdentifier<T>): T;
    getServiceAsync<T>(identifier: ServiceIdentifier<T>): Promise<T>;
    tryGetService<T>(identifier: ServiceIdentifier<T>): T | undefined;
}

// Factory pattern interfaces
export interface IServiceFactory<T> {
    create(...args: any[]): T;
    createAsync(...args: any[]): Promise<T>;
}

// Cross-cutting concerns
export interface IInterceptor {
    intercept<T>(target: T, method: string, args: any[]): any;
}

export interface InterceptorRegistration {
    interceptor: IInterceptor;
    pattern?: RegExp;
    tags?: string[];
    priority?: number;
}

// Validation interfaces
export interface IServiceValidator {
    validate(container: IServiceContainer): ValidationResult;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    identifier: ServiceIdentifier;
    message: string;
    type: 'missing_dependency' | 'circular_dependency' | 'invalid_registration';
}

export interface ValidationWarning {
    identifier: ServiceIdentifier;
    message: string;
    type: 'unused_service' | 'multiple_registrations' | 'performance_concern';
}

// Module system
export interface IServiceModule {
    configure(container: IServiceContainer): void | Promise<void>;
}

// Health check interfaces
export interface IHealthCheck {
    name: string;
    check(): Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    data?: Record<string, any>;
    duration?: number;
}

// Metrics and monitoring
export interface DIMetrics {
    totalRegistrations: number;
    totalResolutions: number;
    averageResolutionTime: number;
    failedResolutions: number;
    circularDependencies: number;
    memoryUsage: number;
}

export interface IMetricsCollector {
    recordResolution(identifier: ServiceIdentifier, duration: number, success: boolean): void;
    recordRegistration(identifier: ServiceIdentifier): void;
    getMetrics(): DIMetrics;
    reset(): void;
}