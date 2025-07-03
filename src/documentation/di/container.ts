import { Container } from 'inversify';
import 'reflect-metadata';
import {
    IDocumentationRenderer,
    IDocumentationCollector,
    IDocumentationConfig,
    IFileSystemService,
    TYPES
} from '../interfaces.js';
import { DocumentationRenderer } from '../renderer.js';
import { DocumentationCollector } from '../collector.js';
import { FileSystemService } from '../services/file-system.service.js';
import { DocumentationGenerator } from '../generator.js';

/**
 * Creates and configures the dependency injection container for documentation generation
 */
export function createDocumentationContainer(config?: Partial<IDocumentationConfig>): Container {
    const container = new Container();

    // Bind configuration
    const defaultConfig: IDocumentationConfig = {
        projectName: 'GLSP Server',
        description: 'Generated GLSP server for graphical modeling',
        version: '1.0.0',
        outputDir: './docs',
        templatesDir: undefined, // Will use default
        features: [
            'Node and edge creation',
            'Model validation',
            'Layout support',
            'Action handlers',
            'Operation handlers',
            'Custom tools'
        ]
    };

    const mergedConfig = { ...defaultConfig, ...config };
    container.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mergedConfig);

    // Bind services
    container.bind<IFileSystemService>(TYPES.IFileSystemService).to(FileSystemService).inSingletonScope();
    container.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).to(DocumentationRenderer).inSingletonScope();
    container.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).to(DocumentationCollector).inSingletonScope();

    // Bind main generator
    container.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator).inSingletonScope();

    return container;
}

/**
 * Factory function to create a configured DocumentationGenerator instance
 */
export function createDocumentationGenerator(config?: Partial<IDocumentationConfig>): DocumentationGenerator {
    const container = createDocumentationContainer(config);
    return container.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
}