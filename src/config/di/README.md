# Dependency Injection System

A comprehensive dependency injection system for the GLSP generator project, providing IoC container functionality, decorator-based injection, lifecycle management, and extensive testing support.

## Overview

This DI system provides:

- **IoC Container**: Full-featured inversion of control container with multiple service lifetimes
- **Decorator-based Injection**: Clean, annotation-driven dependency injection
- **Lifecycle Management**: PostConstruct and PreDestroy hooks for proper resource management
- **Interface Segregation**: Well-defined service contracts with symbol-based identifiers
- **Mock Support**: Comprehensive mock implementations for testing
- **Health Checks**: Built-in health monitoring and validation
- **Metrics Collection**: Performance monitoring and statistics
- **Error Handling**: Robust error handling with custom error types

## Quick Start

### Basic Usage

```typescript
import { createContainer, Injectable, Inject, TYPES } from './config/di';

// Define a service
@Injectable()
class MyService {
    constructor(
        @Inject(TYPES.ILoggerService) private logger: ILoggerService
    ) {}

    doSomething(): void {
        this.logger.info('Doing something...');
    }
}

// Create and use container
const container = createContainer('development');
container.register(Symbol.for('MyService'), MyService);
await container.initialize();

const service = container.resolve(Symbol.for('MyService')) as MyService;
service.doSomething();

await container.dispose();
```

### Testing

```typescript
import { createTestContainer } from './config/di';

// Create test container with mocks
const container = createTestContainer();
await container.initialize();

// All services are automatically mocked
const mockLogger = container.resolve(TYPES.ILoggerService) as MockLoggerService;
mockLogger.clear(); // Clear previous logs
```

## Core Concepts

### Service Lifetimes

- **Singleton**: One instance per container (default)
- **Transient**: New instance every time
- **Scoped**: One instance per scope (future enhancement)

```typescript
container.register(TYPES.IMyService, MyService, ServiceLifetime.Singleton);
container.register(TYPES.IMyService, MyService, ServiceLifetime.Transient);
```

### Decorators

#### @Injectable()
Marks a class as injectable and enables dependency injection.

```typescript
@Injectable()
class MyService {
    // Service implementation
}
```

#### @Inject(token)
Injects a dependency by service token.

```typescript
constructor(
    @Inject(TYPES.ILoggerService) private logger: ILoggerService
) {}
```

#### @Optional()
Makes a dependency optional (can be undefined).

```typescript
constructor(
    @Optional() @Inject(TYPES.ICacheService) private cache?: ICacheService
) {}
```

#### @PostConstruct()
Method called after all dependencies are injected.

```typescript
@PostConstruct()
async initialize(): Promise<void> {
    // Initialization logic
}
```

#### @PreDestroy()
Method called before the service is destroyed.

```typescript
@PreDestroy()
async cleanup(): Promise<void> {
    // Cleanup logic
}
```

#### @Lazy(token)
Provides lazy dependency resolution.

```typescript
constructor(
    @Lazy(TYPES.IExpensiveService) private serviceFactory: () => IExpensiveService
) {}
```

### Service Registration

#### Basic Registration

```typescript
container.register(TYPES.IMyService, MyService);
```

#### Factory Registration

```typescript
container.registerFactory(
    TYPES.IMyService,
    (container) => new MyService(container.resolve(TYPES.IDependency))
);
```

#### Instance Registration

```typescript
const instance = new MyService();
container.registerInstance(TYPES.IMyService, instance);
```

## Available Services

### Core Services

- **IFileSystemService**: File system operations
- **ILoggerService**: Logging functionality
- **IProgressService**: Progress reporting
- **IConfigurationService**: Configuration management
- **ICacheService**: Caching with TTL support
- **ICommandExecutorService**: Command execution
- **ITemplateService**: Template rendering
- **IValidationService**: Validation utilities
- **IEventService**: Event handling
- **IMetricsService**: Metrics collection
- **IHealthCheckService**: Health monitoring

### Domain Services

- **IGrammarParserService**: Langium grammar parsing
- **ILinterService**: Grammar validation and linting
- **ITypeSafetyGeneratorService**: Type safety code generation
- **ITestGeneratorService**: Test code generation
- **IPackageManagerService**: Package management

## Container Configuration

### Environment-based Configuration

```typescript
// Development environment
const devContainer = createContainer('development');

// Test environment with mocks
const testContainer = createContainer('test');

// Production environment
const prodContainer = createContainer('production');
```

### Custom Configuration

```typescript
import { ContainerConfigBuilder } from './config/di';

const config = new ContainerConfigBuilder()
    .withEnvironment('development')
    .withHealthChecks()
    .withMetrics()
    .withMockServices() // For testing
    .build();

const container = config.createContainer();
```

## Advanced Patterns

### Decorator Pattern

```typescript
@Injectable()
class CachedService implements IMyService {
    constructor(
        @Inject(TYPES.IMyService) private innerService: IMyService,
        @Inject(TYPES.ICacheService) private cache: ICacheService
    ) {}

    async getData(key: string): Promise<any> {
        const cached = await this.cache.get(key);
        if (cached) return cached;

        const data = await this.innerService.getData(key);
        await this.cache.set(key, data);
        return data;
    }
}
```

### Factory Pattern

```typescript
@Injectable()
class ServiceFactory {
    createService(type: string): IService {
        switch (type) {
            case 'pdf': return new PDFService();
            case 'html': return new HTMLService();
            default: throw new Error(`Unknown type: ${type}`);
        }
    }
}
```

### Plugin Pattern

```typescript
@Injectable()
class PluginManager {
    private plugins: IPlugin[] = [];

    registerPlugin(plugin: IPlugin): void {
        this.plugins.push(plugin);
    }

    async executePlugins(context: any): Promise<any[]> {
        return Promise.all(
            this.plugins.map(plugin => plugin.execute(context))
        );
    }
}
```

## Error Handling

The DI system provides comprehensive error handling:

```typescript
try {
    const service = container.resolve(TYPES.IUnknownService);
} catch (error) {
    if (error instanceof ServiceNotFoundError) {
        console.error('Service not registered:', error.serviceId);
    } else if (error instanceof CircularDependencyError) {
        console.error('Circular dependency detected:', error.dependencyChain);
    }
}
```

## Validation and Health Checks

### Container Validation

```typescript
import { validateContainer } from './config/di';

const validation = await validateContainer(container);
if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    console.warn('Validation warnings:', validation.warnings);
}
```

### Health Checks

```typescript
const healthService = container.resolve(TYPES.IHealthCheckService);

// Register custom health check
healthService.registerCheck('database', async () => {
    // Check database connectivity
    return true; // or false if unhealthy
});

// Get overall health status
const status = await healthService.getStatus(); // 'healthy' | 'unhealthy' | 'degraded'
```

### Container Statistics

```typescript
import { getContainerStats } from './config/di';

const stats = getContainerStats(container);
console.log(`Registered services: ${stats.registeredServices}`);
console.log(`Resolved instances: ${stats.resolvedInstances}`);
console.log(`Memory usage: ${stats.memoryUsage?.used} bytes`);
```

## Testing

### Mock Services

All core services have corresponding mock implementations:

```typescript
import { 
    MockLoggerService, 
    MockFileSystemService, 
    MockCacheService 
} from './config/di/mocks';

const mockLogger = new MockLoggerService();
mockLogger.info('Test message');
console.log(mockLogger.logs); // Access logged messages

const mockFs = new MockFileSystemService();
mockFs.setFile('/test.txt', 'content');
const content = await mockFs.readFile('/test.txt');
```

### Test Container

```typescript
import { createTestContainer } from './config/di';

describe('MyService', () => {
    let container: any;
    let service: MyService;

    beforeEach(async () => {
        container = createTestContainer();
        container.register(Symbol.for('MyService'), MyService);
        await container.initialize();
        
        service = container.resolve(Symbol.for('MyService'));
    });

    afterEach(async () => {
        await container.dispose();
    });

    it('should work with mocked dependencies', () => {
        // Test with automatically mocked dependencies
        expect(service).toBeDefined();
    });
});
```

## Best Practices

### 1. Use Interfaces

Always define and use interfaces for your services:

```typescript
export interface IMyService {
    doSomething(): Promise<void>;
}

@Injectable()
export class MyService implements IMyService {
    async doSomething(): Promise<void> {
        // Implementation
    }
}
```

### 2. Prefer Constructor Injection

Use constructor injection over property injection:

```typescript
// Good
@Injectable()
class MyService {
    constructor(
        @Inject(TYPES.IDependency) private dependency: IDependency
    ) {}
}

// Avoid
@Injectable()
class MyService {
    @Inject(TYPES.IDependency)
    private dependency!: IDependency;
}
```

### 3. Use Lifecycle Hooks

Implement proper initialization and cleanup:

```typescript
@Injectable()
class MyService {
    @PostConstruct()
    async initialize(): Promise<void> {
        // Setup resources
    }

    @PreDestroy()
    async cleanup(): Promise<void> {
        // Clean up resources
    }
}
```

### 4. Handle Optional Dependencies

Use optional injection for non-critical dependencies:

```typescript
@Injectable()
class MyService {
    constructor(
        @Inject(TYPES.IRequiredService) private required: IRequiredService,
        @Optional() @Inject(TYPES.IOptionalService) private optional?: IOptionalService
    ) {}

    doSomething(): void {
        this.required.doRequired();
        
        if (this.optional) {
            this.optional.doOptional();
        }
    }
}
```

### 5. Use Factories for Complex Creation

For complex object creation, use factory services:

```typescript
@Injectable()
class ComplexServiceFactory {
    constructor(
        @Inject(TYPES.IConfigService) private config: IConfigService
    ) {}

    createService(type: string): IComplexService {
        const settings = this.config.get(`services.${type}`);
        return new ComplexService(settings);
    }
}
```

## Migration Guide

### From Original Classes

To migrate existing classes to use the DI system:

1. **Add @Injectable() decorator**:
   ```typescript
   @Injectable()
   class ExistingClass {
   ```

2. **Convert dependencies to constructor injection**:
   ```typescript
   constructor(
       @Inject(TYPES.ILoggerService) private logger: ILoggerService
   ) {}
   ```

3. **Add lifecycle methods if needed**:
   ```typescript
   @PostConstruct()
   async initialize(): Promise<void> {
       // Move initialization logic here
   }
   ```

4. **Register in container**:
   ```typescript
   container.register(TYPES.IExistingService, ExistingClass);
   ```

## File Structure

```
src/config/di/
├── index.ts              # Main entry point
├── types.ts              # Type definitions
├── decorators.ts         # DI decorators
├── container.ts          # IoC container implementation
├── interfaces.ts         # Service interfaces and TYPES
├── services.ts           # Core service implementations
├── container-config.ts   # Container configuration
├── mocks.ts              # Mock implementations
├── examples.ts           # Usage examples
└── README.md            # This documentation
```

## Examples

See [`examples.ts`](./examples.ts) for comprehensive usage examples including:

- Basic service injection
- Lifecycle management
- Optional dependencies
- Factory patterns
- Decorator patterns
- Plugin patterns
- Error handling
- Testing scenarios

## Contributing

When adding new services:

1. Define the interface in `interfaces.ts`
2. Add the service identifier to `TYPES`
3. Implement the service in `services.ts`
4. Create a mock implementation in `mocks.ts`
5. Add configuration in `container-config.ts`
6. Write tests and examples

## Performance Considerations

- **Singleton services** are cached after first resolution
- **Transient services** create new instances each time
- **Circular dependency detection** adds minimal overhead
- **Lazy injection** defers resolution until needed
- **Health checks** run periodically, not on every resolution

## Troubleshooting

### Common Issues

1. **Service not found**: Ensure service is registered before resolution
2. **Circular dependencies**: Check dependency chains and use lazy injection
3. **Type errors**: Ensure proper TypeScript configuration and imports
4. **Memory leaks**: Always call `container.dispose()` when done

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const container = createContainer('development');
// Container will log registration and resolution activities
```

## License

This DI system is part of the GLSP generator project and follows the same license terms.