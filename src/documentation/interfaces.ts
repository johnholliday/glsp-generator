import { DocumentationData } from './collector.js';

/**
 * Interface for documentation rendering operations
 */
export interface IDocumentationRenderer {
    /**
     * Renders overview documentation from collected data
     */
    renderOverview(data: DocumentationData): Promise<string>;

    /**
     * Renders API documentation from collected data
     */
    renderAPI(data: DocumentationData): Promise<string>;

    /**
     * Renders architecture documentation from collected data
     */
    renderArchitecture(data: DocumentationData): Promise<string>;

    /**
     * Renders examples documentation from collected data
     */
    renderExamples(data: DocumentationData): Promise<string>;
}

/**
 * Interface for documentation data collection operations
 */
export interface IDocumentationCollector {
    /**
     * Collects all documentation data from various sources
     */
    collect(): Promise<DocumentationData>;
}

/**
 * Configuration interface for documentation generation
 */
export interface IDocumentationConfig {
    readonly projectName?: string;
    readonly description?: string;
    readonly version?: string;
    readonly outputDir?: string;
    readonly templatesDir?: string;
    readonly features?: string[];
}

/**
 * Interface for file system operations used by documentation generator
 */
export interface IFileSystemService {
    /**
     * Ensures directory exists, creating it if necessary
     */
    ensureDir(dirPath: string): Promise<void>;

    /**
     * Writes content to a file
     */
    writeFile(filePath: string, content: string): Promise<void>;

    /**
     * Checks if a file exists
     */
    exists(filePath: string): Promise<boolean>;

    /**
     * Reads file content
     */
    readFile(filePath: string): Promise<string>;
}

/**
 * Dependency injection container symbols
 */
export const TYPES = {
    IDocumentationRenderer: Symbol.for('IDocumentationRenderer'),
    IDocumentationCollector: Symbol.for('IDocumentationCollector'),
    IDocumentationConfig: Symbol.for('IDocumentationConfig'),
    IFileSystemService: Symbol.for('IFileSystemService'),
    DocumentationGenerator: Symbol.for('DocumentationGenerator')
} as const;