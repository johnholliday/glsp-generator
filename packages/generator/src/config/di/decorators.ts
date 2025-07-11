/**
 * Dependency Injection decorators
 */

import 'reflect-metadata';
import {
    ServiceIdentifier,
    Constructor,
    InjectableOptions,
    InjectOptions,
    ServiceLifetime,
    INJECTABLE_METADATA_KEY,
    INJECT_METADATA_KEY,
    OPTIONAL_METADATA_KEY,
    LAZY_METADATA_KEY
} from '../../types/di.js';

/**
 * Marks a class as injectable and configures its registration
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
    return function (target: any) {
        const existingMetadata = Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) || {};

        const metadata = {
            ...existingMetadata,
            lifetime: options.lifetime || ServiceLifetime.Transient,
            tags: options.tags || [],
            identifier: options.identifier || target,
            target
        };

        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, metadata, target);
        return target;
    };
}

/**
 * Marks a parameter for dependency injection
 */
export function Inject(identifierOrOptions?: ServiceIdentifier | InjectOptions): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        let identifier: ServiceIdentifier | undefined;
        let options: InjectOptions = {};

        if (typeof identifierOrOptions === 'object' && identifierOrOptions !== null) {
            options = identifierOrOptions;
            identifier = options.identifier;
        } else {
            identifier = identifierOrOptions;
        }

        // Get existing inject metadata
        const existingInjects = Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
        const existingOptionals = Reflect.getMetadata(OPTIONAL_METADATA_KEY, target) || [];
        const existingLazy = Reflect.getMetadata(LAZY_METADATA_KEY, target) || [];

        // Add this injection
        existingInjects[parameterIndex] = identifier;

        if (options.optional) {
            existingOptionals[parameterIndex] = true;
        }

        if (options.lazy) {
            existingLazy[parameterIndex] = true;
        }

        // Store metadata
        Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjects, target);
        Reflect.defineMetadata(OPTIONAL_METADATA_KEY, existingOptionals, target);
        Reflect.defineMetadata(LAZY_METADATA_KEY, existingLazy, target);
    };
}

/**
 * Marks a parameter as optional (won't throw if not found)
 */
export function Optional(): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingOptionals = Reflect.getMetadata(OPTIONAL_METADATA_KEY, target) || [];
        existingOptionals[parameterIndex] = true;
        Reflect.defineMetadata(OPTIONAL_METADATA_KEY, existingOptionals, target);
    };
}

/**
 * Marks a parameter for lazy injection (returns a factory function)
 */
export function Lazy(): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingLazy = Reflect.getMetadata(LAZY_METADATA_KEY, target) || [];
        existingLazy[parameterIndex] = true;
        Reflect.defineMetadata(LAZY_METADATA_KEY, existingLazy, target);
    };
}

/**
 * Property injection decorator
 */
export function InjectProperty(identifier?: ServiceIdentifier): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        const existingProperties = Reflect.getMetadata('inject:properties', target.constructor) || {};
        existingProperties[propertyKey] = identifier || Reflect.getMetadata('design:type', target, propertyKey);
        Reflect.defineMetadata('inject:properties', existingProperties, target.constructor);
    };
}

/**
 * Singleton lifecycle decorator
 */
export function Singleton(identifier?: ServiceIdentifier): ClassDecorator {
    return Injectable({ lifetime: ServiceLifetime.Singleton, identifier });
}

/**
 * Transient lifecycle decorator
 */
export function Transient(identifier?: ServiceIdentifier): ClassDecorator {
    return Injectable({ lifetime: ServiceLifetime.Transient, identifier });
}

/**
 * Scoped lifecycle decorator
 */
export function Scoped(identifier?: ServiceIdentifier): ClassDecorator {
    return Injectable({ lifetime: ServiceLifetime.Scoped, identifier });
}

/**
 * Tags decorator for service categorization
 */
export function Tags(...tags: string[]): ClassDecorator {
    return function (target: any) {
        const existingMetadata = Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) || {};
        existingMetadata.tags = [...(existingMetadata.tags || []), ...tags];
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, existingMetadata, target);
        return target;
    };
}

/**
 * PostConstruct decorator for initialization methods
 */
export function PostConstruct(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const existingMethods = Reflect.getMetadata('lifecycle:postconstruct', target.constructor) || [];
        existingMethods.push(propertyKey);
        Reflect.defineMetadata('lifecycle:postconstruct', existingMethods, target.constructor);
        return descriptor;
    };
}

/**
 * PreDestroy decorator for cleanup methods
 */
export function PreDestroy(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const existingMethods = Reflect.getMetadata('lifecycle:predestroy', target.constructor) || [];
        existingMethods.push(propertyKey);
        Reflect.defineMetadata('lifecycle:predestroy', existingMethods, target.constructor);
        return descriptor;
    };
}

/**
 * Utility functions for metadata extraction
 */
export class MetadataReader {
    static getInjectableMetadata(target: Constructor): any {
        return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
    }

    static getInjectMetadata(target: Constructor): ServiceIdentifier[] {
        return Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
    }

    static getOptionalMetadata(target: Constructor): boolean[] {
        return Reflect.getMetadata(OPTIONAL_METADATA_KEY, target) || [];
    }

    static getLazyMetadata(target: Constructor): boolean[] {
        return Reflect.getMetadata(LAZY_METADATA_KEY, target) || [];
    }

    static getPropertyInjectMetadata(target: Constructor): Record<string | symbol, ServiceIdentifier> {
        return Reflect.getMetadata('inject:properties', target) || {};
    }

    static getPostConstructMethods(target: Constructor): (string | symbol)[] {
        return Reflect.getMetadata('lifecycle:postconstruct', target) || [];
    }

    static getPreDestroyMethods(target: Constructor): (string | symbol)[] {
        return Reflect.getMetadata('lifecycle:predestroy', target) || [];
    }

    static getParameterTypes(target: Constructor): Constructor[] {
        return Reflect.getMetadata('design:paramtypes', target) || [];
    }
}