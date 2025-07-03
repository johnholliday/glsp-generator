import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container } from 'inversify';
import 'reflect-metadata';
import { DocumentationGenerator } from '../generator.js';
import {
    IDocumentationRenderer,
    IDocumentationCollector,
    IDocumentationConfig,
    IFileSystemService,
    TYPES
} from '../interfaces.js';
import { DocumentationData } from '../collector.js';

describe('DocumentationGenerator', () => {
    let container: Container;
    let mockRenderer: IDocumentationRenderer;
    let mockCollector: IDocumentationCollector;
    let mockFileSystem: IFileSystemService;
    let mockConfig: IDocumentationConfig;
    let generator: DocumentationGenerator;

    const mockDocData: DocumentationData = {
        overview: {
            projectName: 'Test Project',
            description: 'Test Description',
            version: '1.0.0',
            features: ['Feature 1', 'Feature 2']
        },
        api: {
            classes: [],
            interfaces: [],
            types: []
        },
        architecture: {
            components: [],
            dataFlow: []
        },
        examples: []
    };

    beforeEach(() => {
        // Create mock implementations
        mockRenderer = {
            renderOverview: vi.fn().mockResolvedValue('# Overview\nMocked overview content'),
            renderAPI: vi.fn().mockResolvedValue('# API\nMocked API content'),
            renderArchitecture: vi.fn().mockResolvedValue('# Architecture\nMocked architecture content'),
            renderExamples: vi.fn().mockResolvedValue('# Examples\nMocked examples content')
        };

        mockCollector = {
            collect: vi.fn().mockResolvedValue(mockDocData)
        };

        mockFileSystem = {
            ensureDir: vi.fn().mockResolvedValue(undefined),
            writeFile: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(true),
            readFile: vi.fn().mockResolvedValue('mock file content')
        };

        mockConfig = {
            projectName: 'Test Project',
            description: 'Test Description',
            version: '1.0.0',
            outputDir: './test-output',
            templatesDir: './test-templates',
            features: ['Feature 1', 'Feature 2']
        };

        // Setup DI container with mocks
        container = new Container();
        container.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(mockRenderer);
        container.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(mockCollector);
        container.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mockConfig);
        container.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
        container.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

        generator = container.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
    });

    describe('constructor injection', () => {
        it('should inject all required dependencies', () => {
            expect(generator).toBeInstanceOf(DocumentationGenerator);
        });

        it('should support different renderer implementations', () => {
            const alternativeRenderer: IDocumentationRenderer = {
                renderOverview: vi.fn().mockResolvedValue('Alternative overview'),
                renderAPI: vi.fn().mockResolvedValue('Alternative API'),
                renderArchitecture: vi.fn().mockResolvedValue('Alternative architecture'),
                renderExamples: vi.fn().mockResolvedValue('Alternative examples')
            };

            const altContainer = new Container();
            altContainer.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(alternativeRenderer);
            altContainer.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(mockCollector);
            altContainer.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mockConfig);
            altContainer.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
            altContainer.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

            const altGenerator = altContainer.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
            expect(altGenerator).toBeInstanceOf(DocumentationGenerator);
        });

        it('should support different collector implementations', () => {
            const alternativeCollector: IDocumentationCollector = {
                collect: vi.fn().mockResolvedValue({
                    ...mockDocData,
                    overview: { ...mockDocData.overview, projectName: 'Alternative Project' }
                })
            };

            const altContainer = new Container();
            altContainer.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(mockRenderer);
            altContainer.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(alternativeCollector);
            altContainer.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mockConfig);
            altContainer.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
            altContainer.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

            const altGenerator = altContainer.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
            expect(altGenerator).toBeInstanceOf(DocumentationGenerator);
        });
    });

    describe('generate', () => {
        it('should orchestrate documentation generation process', async () => {
            await generator.generate();

            // Verify output directory creation
            expect(mockFileSystem.ensureDir).toHaveBeenCalledWith('./test-output');

            // Verify data collection
            expect(mockCollector.collect).toHaveBeenCalledOnce();

            // Verify all rendering operations
            expect(mockRenderer.renderOverview).toHaveBeenCalledWith(mockDocData);
            expect(mockRenderer.renderAPI).toHaveBeenCalledWith(mockDocData);
            expect(mockRenderer.renderArchitecture).toHaveBeenCalledWith(mockDocData);
            expect(mockRenderer.renderExamples).toHaveBeenCalledWith(mockDocData);

            // Verify file writing operations
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith('./test-output/README.md', '# Overview\nMocked overview content');
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith('./test-output/api.md', '# API\nMocked API content');
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith('./test-output/architecture.md', '# Architecture\nMocked architecture content');
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith('./test-output/examples.md', '# Examples\nMocked examples content');
        });

        it('should use default output directory when not configured', async () => {
            const configWithoutOutputDir = { ...mockConfig, outputDir: undefined };

            const newContainer = new Container();
            newContainer.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(mockRenderer);
            newContainer.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(mockCollector);
            newContainer.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(configWithoutOutputDir);
            newContainer.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
            newContainer.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

            const generatorWithDefaultDir = newContainer.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
            await generatorWithDefaultDir.generate();

            expect(mockFileSystem.ensureDir).toHaveBeenCalledWith('.');
        });

        it('should handle errors gracefully', async () => {
            const errorCollector: IDocumentationCollector = {
                collect: vi.fn().mockRejectedValue(new Error('Collection failed'))
            };

            const errorContainer = new Container();
            errorContainer.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(mockRenderer);
            errorContainer.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(errorCollector);
            errorContainer.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mockConfig);
            errorContainer.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
            errorContainer.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

            const errorGenerator = errorContainer.get<DocumentationGenerator>(TYPES.DocumentationGenerator);

            await expect(errorGenerator.generate()).rejects.toThrow('Collection failed');
        });

        it('should execute generation steps in parallel for performance', async () => {
            const startTime = Date.now();

            // Add delays to rendering methods to test parallelization
            mockRenderer.renderOverview = vi.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('overview'), 50))
            );
            mockRenderer.renderAPI = vi.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('api'), 50))
            );
            mockRenderer.renderArchitecture = vi.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('architecture'), 50))
            );
            mockRenderer.renderExamples = vi.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('examples'), 50))
            );

            await generator.generate();

            const endTime = Date.now();
            const duration = endTime - startTime;

            // If executed in parallel, should take ~50ms, not ~200ms
            expect(duration).toBeLessThan(150);
        });
    });

    describe('single responsibility principle', () => {
        it('should delegate rendering concerns to renderer', async () => {
            await generator.generate();

            // Generator should not contain rendering logic
            expect(mockRenderer.renderOverview).toHaveBeenCalled();
            expect(mockRenderer.renderAPI).toHaveBeenCalled();
            expect(mockRenderer.renderArchitecture).toHaveBeenCalled();
            expect(mockRenderer.renderExamples).toHaveBeenCalled();
        });

        it('should delegate data collection to collector', async () => {
            await generator.generate();

            // Generator should not contain collection logic
            expect(mockCollector.collect).toHaveBeenCalled();
        });

        it('should delegate file operations to file system service', async () => {
            await generator.generate();

            // Generator should not contain file system logic
            expect(mockFileSystem.ensureDir).toHaveBeenCalled();
            expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(4);
        });
    });

    describe('loose coupling', () => {
        it('should depend only on interfaces, not concrete implementations', () => {
            // This test verifies that the generator can work with any implementation
            // that satisfies the interface contracts

            const customRenderer: IDocumentationRenderer = {
                renderOverview: vi.fn().mockResolvedValue('Custom overview'),
                renderAPI: vi.fn().mockResolvedValue('Custom API'),
                renderArchitecture: vi.fn().mockResolvedValue('Custom architecture'),
                renderExamples: vi.fn().mockResolvedValue('Custom examples')
            };

            const customContainer = new Container();
            customContainer.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer).toConstantValue(customRenderer);
            customContainer.bind<IDocumentationCollector>(TYPES.IDocumentationCollector).toConstantValue(mockCollector);
            customContainer.bind<IDocumentationConfig>(TYPES.IDocumentationConfig).toConstantValue(mockConfig);
            customContainer.bind<IFileSystemService>(TYPES.IFileSystemService).toConstantValue(mockFileSystem);
            customContainer.bind<DocumentationGenerator>(TYPES.DocumentationGenerator).to(DocumentationGenerator);

            const customGenerator = customContainer.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
            expect(customGenerator).toBeInstanceOf(DocumentationGenerator);
        });
    });
});