# Documentation Generator with Dependency Injection

This module implements a robust documentation generation system using constructor-based dependency injection with Inversify. The implementation follows SOLID principles and provides excellent testability, loose coupling, and extensibility.

## Architecture Overview

The documentation generator is built around the following key components:

### Core Interfaces

- **`IDocumentationRenderer`** - Handles rendering of documentation content
- **`IDocumentationCollector`** - Manages data collection from various sources
- **`IDocumentationConfig`** - Configuration settings for generation
- **`IFileSystemService`** - File system operations abstraction

### Main Components

- **`DocumentationGenerator`** - Main orchestrator class with injected dependencies
- **`DocumentationRenderer`** - Default implementation of rendering logic
- **`DocumentationCollector`** - Default implementation of data collection
- **`FileSystemService`** - File system operations implementation

## Key Benefits

### 1. Loose Coupling
Components depend only on interfaces, not concrete implementations:

```typescript
@injectable()
export class DocumentationGenerator {
    constructor(
        @inject(TYPES.IDocumentationRenderer) private readonly renderer: IDocumentationRenderer,
        @inject(TYPES.IDocumentationCollector) private readonly collector: IDocumentationCollector,
        @inject(TYPES.IDocumentationConfig) private readonly config: IDocumentationConfig,
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService
    ) {}
}
```

### 2. Testability
Easy to test with mock implementations:

```typescript
const mockRenderer: IDocumentationRenderer = {
    renderOverview: vi.fn().mockResolvedValue('mocked content'),
    // ... other methods
};

container.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer)
    .toConstantValue(mockRenderer);
```

### 3. Multiple Implementation Strategies
Support for different rendering and collection strategies:

```typescript
// HTML Renderer
class HTMLDocumentationRenderer implements IDocumentationRenderer {
    async renderOverview(data: DocumentationData): Promise<string> {
        return `<h1>${data.overview.projectName}</h1>`;
    }
}

// Database Collector
class DatabaseDocumentationCollector implements IDocumentationCollector {
    async collect(): Promise<DocumentationData> {
        // Collect from database instead of files
    }
}
```

### 4. Single Responsibility Principle
Each component has a focused responsibility:

- **Generator**: Orchestrates the documentation generation process
- **Renderer**: Handles content formatting and template processing
- **Collector**: Manages data gathering from various sources
- **FileSystem**: Abstracts file operations

### 5. Runtime Configuration
IoC container enables flexible configuration:

```typescript
const container = createDocumentationContainer({
    projectName: 'My Project',
    outputDir: './custom-docs',
    templatesDir: './custom-templates'
});

// Override specific implementations
container.rebind<IDocumentationRenderer>(TYPES.IDocumentationRenderer)
    .to(CustomRenderer);
```

## Usage Examples

### Basic Usage

```typescript
import { createDocumentationGenerator } from './documentation/index.js';

// Simple generation with defaults
const generator = createDocumentationGenerator();
await generator.generate();
```

### Custom Configuration

```typescript
const generator = createDocumentationGenerator({
    projectName: 'GLSP Workflow Editor',
    description: 'A powerful workflow modeling tool',
    version: '2.1.0',
    outputDir: './docs',
    features: [
        'Visual workflow modeling',
        'Real-time collaboration',
        'Export capabilities'
    ]
});

await generator.generate();
```

### Advanced Customization

```typescript
import { Container } from 'inversify';
import {
    DocumentationGenerator,
    IDocumentationRenderer,
    TYPES,
    createDocumentationContainer
} from './documentation/index.js';

// Custom renderer for PDF output
class PDFDocumentationRenderer implements IDocumentationRenderer {
    async renderOverview(data: DocumentationData): Promise<string> {
        // Generate PDF-specific content
        return generatePDFContent(data.overview);
    }
    
    // ... implement other methods
}

// Setup container with custom renderer
const container = createDocumentationContainer({
    outputDir: './pdf-docs'
});

container.rebind<IDocumentationRenderer>(TYPES.IDocumentationRenderer)
    .to(PDFDocumentationRenderer);

const generator = container.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
await generator.generate();
```

## Testing

The dependency injection pattern makes testing straightforward:

```typescript
describe('DocumentationGenerator', () => {
    let container: Container;
    let mockRenderer: IDocumentationRenderer;
    let generator: DocumentationGenerator;

    beforeEach(() => {
        mockRenderer = {
            renderOverview: vi.fn().mockResolvedValue('mocked overview'),
            renderAPI: vi.fn().mockResolvedValue('mocked api'),
            renderArchitecture: vi.fn().mockResolvedValue('mocked architecture'),
            renderExamples: vi.fn().mockResolvedValue('mocked examples')
        };

        container = new Container();
        container.bind<IDocumentationRenderer>(TYPES.IDocumentationRenderer)
            .toConstantValue(mockRenderer);
        // ... bind other dependencies

        generator = container.get<DocumentationGenerator>(TYPES.DocumentationGenerator);
    });

    it('should generate documentation', async () => {
        await generator.generate();
        
        expect(mockRenderer.renderOverview).toHaveBeenCalled();
        expect(mockRenderer.renderAPI).toHaveBeenCalled();
        // ... other assertions
    });
});
```

## Extension Points

### Custom Renderers

Implement `IDocumentationRenderer` for different output formats:

- **MarkdownRenderer** - Default Markdown output
- **HTMLRenderer** - HTML documentation
- **PDFRenderer** - PDF generation
- **ConfluenceRenderer** - Confluence wiki format

### Custom Collectors

Implement `IDocumentationCollector` for different data sources:

- **FileSystemCollector** - Default file-based collection
- **DatabaseCollector** - Database-driven documentation
- **APICollector** - REST API documentation
- **GitCollector** - Git repository analysis

### Custom File Systems

Implement `IFileSystemService` for different storage backends:

- **LocalFileSystem** - Default local file operations
- **S3FileSystem** - AWS S3 storage
- **AzureFileSystem** - Azure Blob storage
- **MemoryFileSystem** - In-memory for testing

## Performance Considerations

The generator uses parallel execution for rendering operations:

```typescript
// Generate all documentation sections in parallel
await Promise.all([
    this.generateOverview(docData, outputDir),
    this.generateAPI(docData, outputDir),
    this.generateArchitecture(docData, outputDir),
    this.generateExamples(docData, outputDir)
]);
```

## Error Handling

The system provides graceful error handling with proper error propagation:

```typescript
try {
    await generator.generate();
} catch (error) {
    console.error('Documentation generation failed:', error);
    // Handle specific error types
}
```

## Future Enhancements

- **Plugin System**: Dynamic loading of renderer and collector plugins
- **Incremental Generation**: Only regenerate changed sections
- **Watch Mode**: Automatic regeneration on file changes
- **Multi-format Output**: Generate multiple formats simultaneously
- **Template Engine**: Advanced templating with conditional logic