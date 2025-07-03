import * as path from 'path';
import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import {
    IDocumentationRenderer,
    IDocumentationCollector,
    IDocumentationConfig,
    IFileSystemService,
    TYPES
} from './interfaces.js';

/**
 * Documentation generator that uses constructor-based dependency injection
 * to resolve and inject instances of DocumentationRenderer and DocumentationCollector interfaces.
 * 
 * This implementation ensures:
 * - Loose coupling between components through interface-based dependencies
 * - Testability through mock injection capabilities
 * - Multiple implementation strategies for rendering and collection operations
 * - Single responsibility principle by delegating specific concerns to injected dependencies
 * - Runtime configuration of documentation generation behavior through IoC container
 */
@injectable()
export class DocumentationGenerator {

    /**
     * Creates a new DocumentationGenerator with injected dependencies
     * 
     * @param renderer - Documentation rendering service implementing IDocumentationRenderer
     * @param collector - Documentation data collection service implementing IDocumentationCollector
     * @param config - Configuration object containing generation settings
     * @param fileSystem - File system operations service implementing IFileSystemService
     */
    constructor(
        @inject(TYPES.IDocumentationRenderer) private readonly renderer: IDocumentationRenderer,
        @inject(TYPES.IDocumentationCollector) private readonly collector: IDocumentationCollector,
        @inject(TYPES.IDocumentationConfig) private readonly config: IDocumentationConfig,
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService
    ) { }

    /**
     * Generates complete documentation by orchestrating data collection and rendering operations
     * 
     * @returns Promise that resolves when documentation generation is complete
     */
    async generate(): Promise<void> {
        console.log('Generating documentation...');

        const outputDir = this.config.outputDir || '.';

        // Ensure output directory exists
        await this.fileSystem.ensureDir(outputDir);

        // Collect documentation data using injected collector
        const docData = await this.collector.collect();

        // Generate all documentation sections using injected renderer
        await Promise.all([
            this.generateOverview(docData, outputDir),
            this.generateAPI(docData, outputDir),
            this.generateArchitecture(docData, outputDir),
            this.generateExamples(docData, outputDir)
        ]);

        console.log(`Documentation generated in ${outputDir}`);
    }

    /**
     * Generates overview documentation section
     * 
     * @param docData - Collected documentation data
     * @param outputDir - Output directory path
     */
    private async generateOverview(docData: any, outputDir: string): Promise<void> {
        const content = await this.renderer.renderOverview(docData);
        const outputPath = path.join(outputDir, 'README.md');
        await this.fileSystem.writeFile(outputPath, content);
    }

    /**
     * Generates API documentation section
     * 
     * @param docData - Collected documentation data
     * @param outputDir - Output directory path
     */
    private async generateAPI(docData: any, outputDir: string): Promise<void> {
        const content = await this.renderer.renderAPI(docData);
        const outputPath = path.join(outputDir, 'api.md');
        await this.fileSystem.writeFile(outputPath, content);
    }

    /**
     * Generates architecture documentation section
     * 
     * @param docData - Collected documentation data
     * @param outputDir - Output directory path
     */
    private async generateArchitecture(docData: any, outputDir: string): Promise<void> {
        const content = await this.renderer.renderArchitecture(docData);
        const outputPath = path.join(outputDir, 'architecture.md');
        await this.fileSystem.writeFile(outputPath, content);
    }

    /**
     * Generates examples documentation section
     * 
     * @param docData - Collected documentation data
     * @param outputDir - Output directory path
     */
    private async generateExamples(docData: any, outputDir: string): Promise<void> {
        const content = await this.renderer.renderExamples(docData);
        const outputPath = path.join(outputDir, 'examples.md');
        await this.fileSystem.writeFile(outputPath, content);
    }
}