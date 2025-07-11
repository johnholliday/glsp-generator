/**
 * Documentation Generation Module
 * 
 * This module provides a complete dependency injection-based documentation generation system
 * with support for multiple implementation strategies, testability, and loose coupling.
 */

// Core interfaces
export {
    IDocumentationRenderer,
    IDocumentationCollector,
    IDocumentationConfig,
    IFileSystemService,
    TYPES
} from './interfaces.js';

// Data types
export {
    DocumentationData,
    OverviewData,
    APIData,
    ClassDoc,
    InterfaceDoc,
    TypeDoc,
    MethodDoc,
    PropertyDoc,
    ParameterDoc,
    ArchitectureData,
    ComponentDoc,
    DataFlowDoc,
    ExampleData
} from './collector.js';

// Main generator class
export { DocumentationGenerator } from './generator.js';

// Default implementations
export { DocumentationRenderer } from './renderer.js';
export { DocumentationCollector } from './collector.js';
export { FileSystemService } from './services/file-system.service.js';

// Dependency injection container
export {
    createDocumentationContainer,
    createDocumentationGenerator
} from './di/container.js';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { createDocumentationGenerator } from './documentation/index.js';
 * 
 * // Create generator with default configuration
 * const generator = createDocumentationGenerator();
 * await generator.generate();
 * 
 * // Create generator with custom configuration
 * const customGenerator = createDocumentationGenerator({
 *   projectName: 'My Project',
 *   outputDir: './custom-docs',
 *   version: '2.0.0'
 * });
 * await customGenerator.generate();
 * ```
 * 
 * Advanced usage with custom implementations:
 * 
 * ```typescript
 * import { Container } from 'inversify';
 * import {
 *   DocumentationGenerator,
 *   IDocumentationRenderer,
 *   TYPES
 * } from './documentation/index.js';
 * 
 * // Create custom renderer implementation
 * class CustomRenderer implements IDocumentationRenderer {
 *   // ... custom implementation
 * }
 * 
 * // Setup container with custom implementation
 * const container = createDocumentationContainer();
 * container.rebind<IDocumentationRenderer>(TYPES.IDocumentationRenderer)
 *   .to(CustomRenderer);
 * 
 * const generator = container.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
 * await generator.generate();
 * ```
 */