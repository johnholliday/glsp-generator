/**
 * Dependency Injection Container Implementation
 */

import 'reflect-metadata';
import { performance } from 'perf_hooks';
import {
    IServiceContainer,
    IServiceScope,
    ServiceIdentifier,
    ServiceRegistration,
    ServiceLifetime,
    Constructor,
    Factory,
    DIError,
    CircularDependencyError,
    ServiceNotFoundError,
    DIConfiguration,
    IDisposable,
    IMetricsCollector,
    DIMetrics
} from '../../types/di.js';
import { MetadataReader } from './decorators.js';

export class ServiceContainer implements IServiceContainer {
    private readonly registrations = new Map<ServiceIdentifier, ServiceRegistration>();
    private readonly singletonInstances = new Map<ServiceIdentifier, any>();
    private readonly resolutionStack: ServiceIdentifier[] = [];
    private readonly config: DIConfiguration;
    private readonly metricsCollector: IMetricsCollector;
    private disposed = false;

    constructor(config: DIConfiguration = {}) {
        this.config = {
            enableValidation: true,
            enableCircularDependencyDetection: true,
            enableLazyLoading: true,
            maxResolutionDepth: 50,
            logLevel: 'warn',
            ...config
        };
        this.metricsCollector = new DefaultMetricsCollector();
    }

    register<T>(registration: ServiceRegistration<T>): void {
        this.ensureNotDisposed();

        if (this.config.enableValidation) {
            this.validateRegistration(registration);
        }

        this.registrations.set(registration.identifier, registration);
        this.metricsCollector.recordRegistration(registration.identifier);
    }

    registerSingleton<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void {
        this.register({
            identifier,
            implementation,
            lifetime: ServiceLifetime.Singleton
        });
    }

    registerTransient<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void {
        this.register({
            identifier,
            implementation,
            lifetime: ServiceLifetime.Transient
        });
    }

    registerFactory<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>, lifetime = ServiceLifetime.Transient): void {
        this.register({
            identifier,
            factory,
            lifetime
        });
    }

    registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void {
        this.register({
            identifier,
            instance,
            lifetime: ServiceLifetime.Singleton
        });
        this.singletonInstances.set(identifier, instance);
    }

    resolve<T>(identifier: ServiceIdentifier<T>): T {
        const startTime = performance.now();
        let success = false;

        try {
            const result = this.internalResolve(identifier);
            success = true;
            return result;
        } catch (error) {
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            this.metricsCollector.recordResolution(identifier, duration, success);
        }
    }

    async resolveAsync<T>(identifier: ServiceIdentifier<T>): Promise<T> {
        const startTime = performance.now();
        let success = false;

        try {
            const result = await this.internalResolveAsync(identifier);
            success = true;
            return result;
        } catch (error) {
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            this.metricsCollector.recordResolution(identifier, duration, success);
        }
    }

    tryResolve<T>(identifier: ServiceIdentifier<T>): T | undefined {
        try {
            return this.resolve(identifier);
        } catch {
            return undefined;
        }
    }

    isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
        return this.registrations.has(identifier);
    }

    getRegistration<T>(identifier: ServiceIdentifier<T>): ServiceRegistration<T> | undefined {
        return this.registrations.get(identifier) as ServiceRegistration<T>;
    }

    createScope(): IServiceScope {
        return new ServiceScope(this);
    }

    async dispose(): Promise<void> {
        if (this.disposed) return;

        // Dispose all singleton instances that implement IDisposable
        const disposalPromises: Promise<void>[] = [];

        for (const instance of this.singletonInstances.values()) {
            if (this.isDisposable(instance)) {
                const disposal = instance.dispose();
                if (disposal instanceof Promise) {
                    disposalPromises.push(disposal);
                }
            }

            // Call PreDestroy methods
            const preDestroyMethods = MetadataReader.getPreDestroyMethods(instance.constructor);
            for (const method of preDestroyMethods) {
                try {
                    const result = instance[method]();
                    if (result instanceof Promise) {
                        disposalPromises.push(result);
                    }
                } catch (error) {
                    console.warn(`Error calling PreDestroy method ${String(method)}:`, error);
                }
            }
        }

        await Promise.all(disposalPromises);

        this.registrations.clear();
        this.singletonInstances.clear();
        this.disposed = true;
    }

    private internalResolve<T>(identifier: ServiceIdentifier<T>): T {
        this.ensureNotDisposed();

        if (this.config.enableCircularDependencyDetection) {
            this.checkCircularDependency(identifier);
        }

        if (this.resolutionStack.length > this.config.maxResolutionDepth!) {
            throw new DIError(`Maximum resolution depth exceeded: ${this.config.maxResolutionDepth}`);
        }

        this.resolutionStack.push(identifier);

        try {
            const registration = this.registrations.get(identifier);
            if (!registration) {
                throw new ServiceNotFoundError(identifier);
            }

            return this.createInstance(registration);
        } finally {
            this.resolutionStack.pop();
        }
    }

    private async internalResolveAsync<T>(identifier: ServiceIdentifier<T>): Promise<T> {
        this.ensureNotDisposed();

        if (this.config.enableCircularDependencyDetection) {
            this.checkCircularDependency(identifier);
        }

        this.resolutionStack.push(identifier);

        try {
            const registration = this.registrations.get(identifier);
            if (!registration) {
                throw new ServiceNotFoundError(identifier);
            }

            return await this.createInstanceAsync(registration);
        } finally {
            this.resolutionStack.pop();
        }
    }

    private createInstance<T>(registration: ServiceRegistration<T>): T {
        // Check for existing singleton instance
        if (registration.lifetime === ServiceLifetime.Singleton) {
            const existing = this.singletonInstances.get(registration.identifier);
            if (existing) {
                return existing;
            }
        }

        let instance: T;

        if (registration.instance) {
            instance = registration.instance;
        } else if (registration.factory) {
            const result = registration.factory();
            instance = result as T;
        } else if (registration.implementation) {
            instance = this.constructInstance(registration.implementation);
        } else {
            throw new DIError(`Invalid registration for ${String(registration.identifier)}`);
        }

        // Store singleton instance
        if (registration.lifetime === ServiceLifetime.Singleton) {
            this.singletonInstances.set(registration.identifier, instance);
        }

        // Perform property injection
        this.injectProperties(instance);

        // Call PostConstruct methods
        this.callPostConstruct(instance);

        return instance;
    }

    private async createInstanceAsync<T>(registration: ServiceRegistration<T>): Promise<T> {
        // Check for existing singleton instance
        if (registration.lifetime === ServiceLifetime.Singleton) {
            const existing = this.singletonInstances.get(registration.identifier);
            if (existing) {
                return existing;
            }
        }

        let instance: T;

        if (registration.instance) {
            instance = registration.instance;
        } else if (registration.factory) {
            const result = registration.factory();
            instance = result instanceof Promise ? await result : result;
        } else if (registration.implementation) {
            instance = await this.constructInstanceAsync(registration.implementation);
        } else {
            throw new DIError(`Invalid registration for ${String(registration.identifier)}`);
        }

        // Store singleton instance
        if (registration.lifetime === ServiceLifetime.Singleton) {
            this.singletonInstances.set(registration.identifier, instance);
        }

        // Perform property injection
        this.injectProperties(instance);

        // Call PostConstruct methods
        await this.callPostConstructAsync(instance);

        return instance;
    }

    private constructInstance<T>(constructor: Constructor<T>): T {
        const paramTypes = MetadataReader.getParameterTypes(constructor as Constructor);
        const injectMetadata = MetadataReader.getInjectMetadata(constructor as Constructor);
        const optionalMetadata = MetadataReader.getOptionalMetadata(constructor as Constructor);
        const lazyMetadata = MetadataReader.getLazyMetadata(constructor as Constructor);

        const args: any[] = [];

        for (let i = 0; i < paramTypes.length; i++) {
            const paramType = paramTypes[i];
            const injectId = injectMetadata[i] || paramType;
            const isOptional = optionalMetadata[i] || false;
            const isLazy = lazyMetadata[i] || false;

            if (isLazy) {
                // Create a lazy factory function
                args[i] = () => this.resolve(injectId);
            } else {
                try {
                    args[i] = this.resolve(injectId);
                } catch (error) {
                    if (isOptional) {
                        args[i] = undefined;
                    } else {
                        throw error;
                    }
                }
            }
        }

        return new constructor(...args);
    }

    private async constructInstanceAsync<T>(constructor: Constructor<T>): Promise<T> {
        const paramTypes = MetadataReader.getParameterTypes(constructor as Constructor);
        const injectMetadata = MetadataReader.getInjectMetadata(constructor as Constructor);
        const optionalMetadata = MetadataReader.getOptionalMetadata(constructor as Constructor);
        const lazyMetadata = MetadataReader.getLazyMetadata(constructor as Constructor);

        const args: any[] = [];

        for (let i = 0; i < paramTypes.length; i++) {
            const paramType = paramTypes[i];
            const injectId = injectMetadata[i] || paramType;
            const isOptional = optionalMetadata[i] || false;
            const isLazy = lazyMetadata[i] || false;

            if (isLazy) {
                // Create a lazy factory function
                args[i] = () => this.resolveAsync(injectId);
            } else {
                try {
                    args[i] = await this.resolveAsync(injectId);
                } catch (error) {
                    if (isOptional) {
                        args[i] = undefined;
                    } else {
                        throw error;
                    }
                }
            }
        }

        return new constructor(...args);
    }

    private injectProperties(instance: any): void {
        const propertyMetadata = MetadataReader.getPropertyInjectMetadata(instance.constructor);

        for (const [property, identifier] of Object.entries(propertyMetadata)) {
            try {
                instance[property] = this.resolve(identifier);
            } catch (error) {
                // Property injection failures are typically non-fatal
                console.warn(`Failed to inject property ${String(property)}:`, error);
            }
        }
    }

    private callPostConstruct(instance: any): void {
        const postConstructMethods = MetadataReader.getPostConstructMethods(instance.constructor);

        for (const method of postConstructMethods) {
            try {
                instance[method]();
            } catch (error) {
                console.warn(`Error calling PostConstruct method ${String(method)}:`, error);
            }
        }
    }

    private async callPostConstructAsync(instance: any): Promise<void> {
        const postConstructMethods = MetadataReader.getPostConstructMethods(instance.constructor);

        for (const method of postConstructMethods) {
            try {
                const result = instance[method]();
                if (result instanceof Promise) {
                    await result;
                }
            } catch (error) {
                console.warn(`Error calling PostConstruct method ${String(method)}:`, error);
            }
        }
    }

    private checkCircularDependency(identifier: ServiceIdentifier): void {
        if (this.resolutionStack.includes(identifier)) {
            const cycle = [...this.resolutionStack, identifier];
            throw new CircularDependencyError(cycle);
        }
    }

    private validateRegistration<T>(registration: ServiceRegistration<T>): void {
        if (!registration.identifier) {
            throw new DIError('Registration must have an identifier');
        }

        if (!registration.implementation && !registration.factory && !registration.instance) {
            throw new DIError('Registration must have implementation, factory, or instance');
        }
    }

    private isDisposable(obj: any): obj is IDisposable {
        return obj && typeof obj.dispose === 'function';
    }

    private ensureNotDisposed(): void {
        if (this.disposed) {
            throw new DIError('Container has been disposed');
        }
    }
}

class ServiceScope implements IServiceScope {
    private readonly scopedInstances = new Map<ServiceIdentifier, any>();
    private disposed = false;

    constructor(public readonly parent: IServiceContainer) { }

    register<T>(registration: ServiceRegistration<T>): void {
        this.parent.register(registration);
    }

    registerSingleton<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void {
        this.parent.registerSingleton(identifier, implementation);
    }

    registerTransient<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>): void {
        this.parent.registerTransient(identifier, implementation);
    }

    registerFactory<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>, lifetime?: ServiceLifetime): void {
        this.parent.registerFactory(identifier, factory, lifetime);
    }

    registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void {
        this.parent.registerInstance(identifier, instance);
    }

    resolve<T>(identifier: ServiceIdentifier<T>): T {
        this.ensureNotDisposed();

        const registration = this.parent.getRegistration(identifier);
        if (registration?.lifetime === ServiceLifetime.Scoped) {
            const existing = this.scopedInstances.get(identifier);
            if (existing) {
                return existing;
            }

            const instance = this.parent.resolve(identifier);
            this.scopedInstances.set(identifier, instance);
            return instance;
        }

        return this.parent.resolve(identifier);
    }

    async resolveAsync<T>(identifier: ServiceIdentifier<T>): Promise<T> {
        this.ensureNotDisposed();

        const registration = this.parent.getRegistration(identifier);
        if (registration?.lifetime === ServiceLifetime.Scoped) {
            const existing = this.scopedInstances.get(identifier);
            if (existing) {
                return existing;
            }

            const instance = await this.parent.resolveAsync(identifier);
            this.scopedInstances.set(identifier, instance);
            return instance;
        }

        return this.parent.resolveAsync(identifier);
    }

    tryResolve<T>(identifier: ServiceIdentifier<T>): T | undefined {
        try {
            return this.resolve(identifier);
        } catch {
            return undefined;
        }
    }

    isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
        return this.parent.isRegistered(identifier);
    }

    getRegistration<T>(identifier: ServiceIdentifier<T>): ServiceRegistration<T> | undefined {
        return this.parent.getRegistration(identifier);
    }

    createScope(): IServiceScope {
        return new ServiceScope(this);
    }

    async dispose(): Promise<void> {
        if (this.disposed) return;

        // Dispose scoped instances
        const disposalPromises: Promise<void>[] = [];

        for (const instance of this.scopedInstances.values()) {
            if (this.isDisposable(instance)) {
                const disposal = instance.dispose();
                if (disposal instanceof Promise) {
                    disposalPromises.push(disposal);
                }
            }
        }

        await Promise.all(disposalPromises);
        this.scopedInstances.clear();
        this.disposed = true;
    }

    private isDisposable(obj: any): obj is IDisposable {
        return obj && typeof obj.dispose === 'function';
    }

    private ensureNotDisposed(): void {
        if (this.disposed) {
            throw new DIError('Scope has been disposed');
        }
    }
}

class DefaultMetricsCollector implements IMetricsCollector {
    private totalRegistrations = 0;
    private totalResolutions = 0;
    private totalResolutionTime = 0;
    private failedResolutions = 0;
    private circularDependencies = 0;

    recordResolution(_identifier: ServiceIdentifier, duration: number, success: boolean): void {
        this.totalResolutions++;
        this.totalResolutionTime += duration;

        if (!success) {
            this.failedResolutions++;
        }
    }

    recordRegistration(_identifier: ServiceIdentifier): void {
        this.totalRegistrations++;
    }

    getMetrics(): DIMetrics {
        return {
            totalRegistrations: this.totalRegistrations,
            totalResolutions: this.totalResolutions,
            averageResolutionTime: this.totalResolutions > 0 ? this.totalResolutionTime / this.totalResolutions : 0,
            failedResolutions: this.failedResolutions,
            circularDependencies: this.circularDependencies,
            memoryUsage: process.memoryUsage().heapUsed
        };
    }

    reset(): void {
        this.totalRegistrations = 0;
        this.totalResolutions = 0;
        this.totalResolutionTime = 0;
        this.failedResolutions = 0;
        this.circularDependencies = 0;
    }
}