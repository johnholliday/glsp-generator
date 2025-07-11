import * as fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar } from '../types/grammar.js';

export interface VSIXMetadata {
    displayName: string;
    description: string;
    version: string;
    publisher: string;
    categories: string[];
    keywords: string[];
    icon?: string;
    repository?: {
        type: string;
        url: string;
    };
    engines: {
        vscode: string;
    };
}

export class VSIXMetadataExtractor {
    /**
     * Extract metadata for VSIX package from grammar and configuration
     */
    extractMetadata(grammar: ParsedGrammar, config?: any): VSIXMetadata {
        const projectName = grammar.projectName || 'unknown';
        const displayName = this.toDisplayName(projectName);
        
        return {
            displayName: config?.displayName || `${displayName} GLSP Extension`,
            description: config?.description || grammar.metadata?.description || 
                        `GLSP extension for ${displayName}`,
            version: config?.version || grammar.metadata?.version || '0.1.0',
            publisher: config?.publisher || 'glsp-generator',
            categories: config?.categories || ['Programming Languages', 'Visualization'],
            keywords: config?.keywords || [
                'glsp',
                'diagram',
                'modeling',
                projectName.toLowerCase()
            ],
            icon: config?.icon,
            repository: config?.repository,
            engines: {
                vscode: config?.engines?.vscode || '^1.74.0'
            }
        };
    }

    /**
     * Extract metadata from an existing package.json if available
     */
    async extractFromPackageJson(packageJsonPath: string): Promise<Partial<VSIXMetadata>> {
        try {
            const packageJson = await fs.readJson(packageJsonPath);
            return {
                displayName: packageJson.displayName,
                description: packageJson.description,
                version: packageJson.version,
                publisher: packageJson.publisher,
                categories: packageJson.categories,
                keywords: packageJson.keywords,
                icon: packageJson.icon,
                repository: packageJson.repository,
                engines: packageJson.engines
            };
        } catch (error) {
            // Return empty object if package.json doesn't exist or is invalid
            return {};
        }
    }

    /**
     * Merge metadata from multiple sources
     */
    mergeMetadata(...sources: Partial<VSIXMetadata>[]): VSIXMetadata {
        const merged: any = {};
        
        for (const source of sources) {
            for (const [key, value] of Object.entries(source)) {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // Merge arrays by concatenating unique values
                        merged[key] = [...new Set([...(merged[key] || []), ...value])];
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        // Merge objects recursively
                        merged[key] = { ...(merged[key] || {}), ...value };
                    } else {
                        // Overwrite primitive values
                        merged[key] = value;
                    }
                }
            }
        }

        // Ensure required fields have defaults
        return {
            displayName: merged.displayName || 'GLSP Extension',
            description: merged.description || 'A GLSP extension',
            version: merged.version || '0.1.0',
            publisher: merged.publisher || 'glsp-generator',
            categories: merged.categories || ['Programming Languages'],
            keywords: merged.keywords || ['glsp'],
            icon: merged.icon,
            repository: merged.repository,
            engines: merged.engines || { vscode: '^1.74.0' }
        };
    }

    /**
     * Convert project name to display name
     */
    private toDisplayName(projectName: string): string {
        return projectName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    /**
     * Validate metadata
     */
    validateMetadata(metadata: VSIXMetadata): string[] {
        const errors: string[] = [];

        if (!metadata.displayName || metadata.displayName.length === 0) {
            errors.push('Display name is required');
        }

        if (!metadata.description || metadata.description.length === 0) {
            errors.push('Description is required');
        }

        if (!metadata.version || !this.isValidVersion(metadata.version)) {
            errors.push('Valid version is required (e.g., 1.0.0)');
        }

        if (!metadata.publisher || metadata.publisher.length === 0) {
            errors.push('Publisher is required');
        }

        if (metadata.icon && !this.isValidIconPath(metadata.icon)) {
            errors.push('Icon must be a valid file path');
        }

        return errors;
    }

    private isValidVersion(version: string): boolean {
        return /^\d+\.\d+\.\d+/.test(version);
    }

    private isValidIconPath(iconPath: string): boolean {
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
        const ext = path.extname(iconPath).toLowerCase();
        return validExtensions.includes(ext);
    }

    /**
     * Static method to extract metadata from grammar file
     */
    static async extractFromGrammar(
        grammarPath: string,
        parsedGrammar: ParsedGrammar,
        defaultIcon?: string
    ): Promise<VSIXMetadata> {
        const extractor = new VSIXMetadataExtractor();
        const baseMetadata = extractor.extractMetadata(parsedGrammar);
        
        // Try to find package.json in the same directory
        const grammarDir = path.dirname(grammarPath);
        const packageJsonPath = path.join(grammarDir, 'package.json');
        
        let packageMetadata: Partial<VSIXMetadata> = {};
        if (await fs.pathExists(packageJsonPath)) {
            packageMetadata = await extractor.extractFromPackageJson(packageJsonPath);
        }
        
        // Merge with defaults
        return extractor.mergeMetadata(
            baseMetadata,
            packageMetadata,
            defaultIcon ? { icon: defaultIcon } : {}
        );
    }

    /**
     * Convert VSIX metadata to package.json format
     */
    static toPackageJson(
        metadata: VSIXMetadata,
        projectName: string,
        fileExtension: string
    ): any {
        return {
            name: `${projectName}-glsp-extension`,
            displayName: metadata.displayName,
            description: metadata.description,
            version: metadata.version,
            publisher: metadata.publisher,
            categories: metadata.categories,
            keywords: metadata.keywords,
            icon: metadata.icon,
            repository: metadata.repository,
            engines: metadata.engines,
            fileExtension
        };
    }

    /**
     * Copy icon file to extension directory
     */
    static async copyIcon(iconPath: string, extensionDir: string): Promise<void> {
        if (!iconPath || !await fs.pathExists(iconPath)) {
            return;
        }
        
        const iconName = path.basename(iconPath);
        const targetPath = path.join(extensionDir, iconName);
        
        try {
            await fs.copy(iconPath, targetPath);
        } catch (error) {
            console.warn(`Failed to copy icon: ${error}`);
        }
    }
}