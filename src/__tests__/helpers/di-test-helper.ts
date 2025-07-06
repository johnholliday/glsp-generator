/**
 * Dependency Injection test helpers
 * @module test/helpers
 */

import { Container, interfaces } from 'inversify';
import { TYPES } from '../../src/infrastructure/di/symbols';

/**
 * DI test helper for testing service bindings
 */
export class DITestHelper {
  /**
   * Verify that all required services are bound
   */
  static verifyRequiredBindings(container: Container): void {
    const requiredBindings = [
      TYPES.IGenerator,
      TYPES.IParser,
      TYPES.IValidator,
      TYPES.ITemplateEngine,
      TYPES.IStructuredLogger,
      TYPES.IEventBus,
      TYPES.IFileSystem,
      TYPES.IErrorHandler,
    ];

    const missingBindings: symbol[] = [];

    for (const binding of requiredBindings) {
      try {
        container.get(binding);
      } catch (error) {
        missingBindings.push(binding);
      }
    }

    if (missingBindings.length > 0) {
      throw new Error(
        `Missing required bindings: ${missingBindings.map(s => s.toString()).join(', ')}`
      );
    }
  }

  /**
   * Verify that a service implements expected interface
   */
  static verifyServiceInterface<T>(
    container: Container,
    serviceIdentifier: symbol,
    requiredMethods: (keyof T)[]
  ): void {
    const service = container.get<T>(serviceIdentifier);

    const missingMethods: string[] = [];

    for (const method of requiredMethods) {
      if (typeof service[method] !== 'function') {
        missingMethods.push(String(method));
      }
    }

    if (missingMethods.length > 0) {
      throw new Error(
        `Service ${serviceIdentifier.toString()} missing methods: ${missingMethods.join(', ')}`
      );
    }
  }

  /**
   * Create a spy container that tracks service resolutions
   */
  static createSpyContainer(baseContainer: Container): SpyContainer {
    const resolutions = new Map<symbol, number>();
    const spyContainer = new Container();

    // Copy all bindings
    baseContainer.getAll(Symbol.for('*')).forEach((service, index) => {
      const binding = baseContainer.getServiceIdentifierForBinding(service);
      if (binding) {
        spyContainer.bind(binding).toConstantValue(service);
      }
    });

    // Override get method to track resolutions
    const originalGet = spyContainer.get.bind(spyContainer);
    spyContainer.get = <T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) => {
      const count = resolutions.get(serviceIdentifier as symbol) || 0;
      resolutions.set(serviceIdentifier as symbol, count + 1);
      return originalGet(serviceIdentifier);
    };

    return {
      container: spyContainer,
      getResolutionCount: (serviceIdentifier: symbol) => resolutions.get(serviceIdentifier) || 0,
      wasResolved: (serviceIdentifier: symbol) => resolutions.has(serviceIdentifier),
      reset: () => resolutions.clear(),
    };
  }

  /**
   * Create a container with auto-mocking
   */
  static createAutoMockContainer(requiredServices: symbol[]): Container {
    const container = new Container();

    for (const service of requiredServices) {
      container.bind(service).toDynamicValue(() => {
        return new Proxy({}, {
          get: (target, prop) => {
            if (prop === Symbol.toStringTag) {
              return `Mock<${service.toString()}>`;
            }
            return vi.fn().mockReturnValue(undefined);
          },
        });
      });
    }

    return container;
  }

  /**
   * Snapshot container bindings for comparison
   */
  static snapshotBindings(container: Container): BindingSnapshot {
    const snapshot = new Map<string, BindingInfo>();

    const serviceIdentifiers = container.getServiceIdentifiers();
    
    for (const identifier of serviceIdentifiers) {
      const bindings = container.getAll(identifier);
      snapshot.set(identifier.toString(), {
        identifier,
        count: bindings.length,
        scope: 'singleton', // Default, would need reflection to get actual
      });
    }

    return {
      bindings: snapshot,
      compare: (other: Container) => {
        const otherSnapshot = DITestHelper.snapshotBindings(other);
        const differences: string[] = [];

        // Check for missing bindings
        for (const [key, info] of snapshot.bindings) {
          if (!otherSnapshot.bindings.has(key)) {
            differences.push(`Missing binding: ${key}`);
          }
        }

        // Check for extra bindings
        for (const [key] of otherSnapshot.bindings) {
          if (!snapshot.bindings.has(key)) {
            differences.push(`Extra binding: ${key}`);
          }
        }

        return differences;
      },
    };
  }
}

/**
 * Spy container interface
 */
export interface SpyContainer {
  container: Container;
  getResolutionCount(serviceIdentifier: symbol): number;
  wasResolved(serviceIdentifier: symbol): boolean;
  reset(): void;
}

/**
 * Binding snapshot interface
 */
export interface BindingSnapshot {
  bindings: Map<string, BindingInfo>;
  compare(other: Container): string[];
}

/**
 * Binding info interface
 */
export interface BindingInfo {
  identifier: symbol;
  count: number;
  scope: string;
}

/**
 * Container test utilities
 */
export const ContainerTestUtils = {
  /**
   * Assert that a service is a singleton
   */
  assertSingleton(container: Container, serviceIdentifier: symbol): void {
    const instance1 = container.get(serviceIdentifier);
    const instance2 = container.get(serviceIdentifier);
    expect(instance1).toBe(instance2);
  },

  /**
   * Assert that a service is transient
   */
  assertTransient(container: Container, serviceIdentifier: symbol): void {
    const instance1 = container.get(serviceIdentifier);
    const instance2 = container.get(serviceIdentifier);
    expect(instance1).not.toBe(instance2);
  },

  /**
   * Assert that a factory produces different instances
   */
  assertFactory(container: Container, factoryIdentifier: symbol): void {
    const factory = container.get<interfaces.Factory<any>>(factoryIdentifier);
    const instance1 = factory();
    const instance2 = factory();
    expect(instance1).not.toBe(instance2);
  },

  /**
   * Assert circular dependency throws
   */
  assertCircularDependencyThrows(
    container: Container,
    serviceIdentifier: symbol
  ): void {
    expect(() => container.get(serviceIdentifier)).toThrow(/circular/i);
  },
};