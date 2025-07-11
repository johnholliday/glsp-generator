import { promises as fs } from 'fs';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { ILogger } from '../../utils/logger/index.js';
import { ITemplateLoader } from '../interfaces/template-loader.interface.js';

/**
 * Service for loading templates from the file system
 */
@injectable()
export class TemplateLoaderService implements ITemplateLoader {
    constructor(
        @inject(TYPES.Logger) private logger: ILogger
    ) { }

    /**
     * Load a single template by path
     */
    async loadTemplate(templatePath: string): Promise<string> {
        try {
            this.logger.debug(`Loading template: ${templatePath}`);
            const content = await fs.readFile(templatePath, 'utf-8');
            this.logger.debug(`Template loaded successfully: ${templatePath}`);
            return content;
        } catch (error) {
            this.logger.error(`Failed to load template: ${templatePath}`, error);
            throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load multiple templates
     */
    async loadTemplates(paths: string[]): Promise<Map<string, string>> {
        this.logger.debug(`Loading ${paths.length} templates`);
        const results = new Map<string, string>();

        const loadPromises = paths.map(async (templatePath) => {
            try {
                const content = await this.loadTemplate(templatePath);
                results.set(templatePath, content);
            } catch (error) {
                this.logger.error(`Failed to load template in batch: ${templatePath}`, error);
                // Continue with other templates, don't fail the entire batch
            }
        });

        await Promise.all(loadPromises);
        this.logger.debug(`Loaded ${results.size}/${paths.length} templates successfully`);
        return results;
    }

    /**
     * Check if template exists
     */
    async templateExists(templatePath: string): Promise<boolean> {
        try {
            await fs.access(templatePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get template metadata
     */
    async getTemplateMetadata(templatePath: string): Promise<{
        size: number;
        lastModified: Date;
        dependencies: string[];
    }> {
        try {
            const stats = await fs.stat(templatePath);
            const content = await this.loadTemplate(templatePath);

            // Extract dependencies from template content (simple regex-based approach)
            const dependencies = this.extractDependencies(content);

            return {
                size: stats.size,
                lastModified: stats.mtime,
                dependencies
            };
        } catch (error) {
            this.logger.error(`Failed to get template metadata: ${templatePath}`, error);
            throw new Error(`Failed to get metadata for template ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extract dependencies from template content
     */
    private extractDependencies(content: string): string[] {
        const dependencies: string[] = [];

        // Look for common dependency patterns
        const patterns = [
            /{{>\s*([^}]+)}}/g,           // Handlebars partials
            /@import\s+["']([^"']+)["']/g, // CSS/SCSS imports
            /import\s+.*from\s+["']([^"']+)["']/g, // ES6 imports
            /require\s*\(\s*["']([^"']+)["']\s*\)/g, // CommonJS requires
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const dependency = match[1].trim();
                if (dependency && !dependencies.includes(dependency)) {
                    dependencies.push(dependency);
                }
            }
        }

        return dependencies;
    }
}