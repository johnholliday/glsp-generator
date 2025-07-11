/**
 * Interface for template loading operations
 */
export interface ITemplateLoader {
    /**
     * Load a single template by path
     */
    loadTemplate(path: string): Promise<string>;

    /**
     * Load multiple templates
     */
    loadTemplates(paths: string[]): Promise<Map<string, string>>;

    /**
     * Check if template exists
     */
    templateExists(path: string): Promise<boolean>;

    /**
     * Get template metadata
     */
    getTemplateMetadata(path: string): Promise<{
        size: number;
        lastModified: Date;
        dependencies: string[];
    }>;
}