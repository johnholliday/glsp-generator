import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { IParallelTemplateProcessor } from '../interfaces/parallel-template-processor.interface.js';
import { ParallelProcessingOptions, PerformanceConfig } from '../types.js';

/**
 * Factory for creating ParallelTemplateProcessor instances
 * Provides backward compatibility and easy instantiation
 */
@injectable()
export class ParallelTemplateProcessorFactory {
    constructor(
        @inject(TYPES.IParallelTemplateProcessor) private processor: IParallelTemplateProcessor
    ) { }

    /**
     * Create a new ParallelTemplateProcessor instance
     * This method provides backward compatibility for existing code
     */
    create(
        _config?: PerformanceConfig,
        _options?: ParallelProcessingOptions
    ): IParallelTemplateProcessor {
        // The DI container already handles configuration and options
        // Return the singleton instance
        return this.processor;
    }

    /**
     * Create a ParallelTemplateProcessor with custom configuration
     * For advanced use cases where different configurations are needed
     */
    createWithConfig(
        _config: PerformanceConfig,
        _options?: ParallelProcessingOptions
    ): IParallelTemplateProcessor {
        // For now, return the singleton instance
        // In the future, this could create a new instance with custom config
        return this.processor;
    }

    /**
     * Get the default ParallelTemplateProcessor instance
     */
    getDefault(): IParallelTemplateProcessor {
        return this.processor;
    }
}

/**
 * Convenience function for creating ParallelTemplateProcessor instances
 * Provides a simple API for backward compatibility
 */
export function createParallelTemplateProcessor(
    _config?: PerformanceConfig,
    _options?: ParallelProcessingOptions
): IParallelTemplateProcessor {
    // This is a simplified version for backward compatibility
    // In a real implementation, you would use the DI container
    throw new Error('Use DI container to resolve IParallelTemplateProcessor instead');
}

/**
 * Migration helper function
 * Helps existing code transition to the new DI-based architecture
 */
export function migrateToNewProcessor(): string {
    return `
To migrate to the new ParallelTemplateProcessor architecture:

1. Import the DI container:
   import { container } from '../config/di/container.js';
   import { TYPES } from '../config/di/types.js';

2. Resolve the processor from the container:
   const processor = container.get<IParallelTemplateProcessor>(TYPES.IParallelTemplateProcessor);

3. Use the processor as before:
   const results = await processor.processTemplates(templates, context, options);

4. Don't forget to cleanup when done:
   await processor.cleanup();

Benefits of the new architecture:
- Proper dependency injection
- Better testability with mock dependencies
- Improved error handling and logging
- Enhanced performance monitoring
- Thread-safe operations
- Comprehensive validation
`;
}