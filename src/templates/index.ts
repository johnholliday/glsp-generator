export * from './types.js';
export * from './template-loader.js';
export * from './template-resolver.js';
export * from './package-manager.js';
export * from './inheritance.js';

import { TemplateLoader } from './template-loader.js';
import { TemplateResolver } from './template-resolver.js';
import { TemplatePackageManager } from './package-manager.js';
import { TemplateInheritance } from './inheritance.js';
import { TemplateOptions, TemplateSet } from './types.js';
import Handlebars from 'handlebars';

/**
 * Main template system class that orchestrates all template functionality
 */
export class TemplateSystem {
    private loader: TemplateLoader;
    private packageManager: TemplatePackageManager;
    private inheritance: TemplateInheritance;
    private resolver?: TemplateResolver;

    constructor() {
        this.loader = new TemplateLoader();
        this.packageManager = new TemplatePackageManager();
        this.inheritance = new TemplateInheritance(Handlebars);
    }

    /**
     * Initialize the template system with given options
     */
    async initialize(options: TemplateOptions = {}): Promise<TemplateResolver> {
        const loadResult = await this.loader.loadTemplates(options);

        if (!loadResult.success || !loadResult.templateSet) {
            throw new Error(`Failed to load templates: ${loadResult.errors?.join(', ')}`);
        }

        // Set up inheritance system with loaded layouts
        this.setupInheritance(loadResult.templateSet);

        this.resolver = new TemplateResolver(loadResult.templateSet);
        return this.resolver;
    }

    /**
     * Get the template resolver (must call initialize first)
     */
    getResolver(): TemplateResolver {
        if (!this.resolver) {
            throw new Error('Template system not initialized. Call initialize() first.');
        }
        return this.resolver;
    }

    /**
     * Get the package manager
     */
    getPackageManager(): TemplatePackageManager {
        return this.packageManager;
    }

    /**
     * Get the inheritance system
     */
    getInheritance(): TemplateInheritance {
        return this.inheritance;
    }

    /**
     * Set up inheritance system with layouts from templates
     */
    private setupInheritance(templateSet: TemplateSet): void {
        // Register layouts found in templates
        for (const [name, template] of templateSet.templates) {
            if (name.startsWith('layouts/') || name.includes('layout')) {
                // This template is a layout - register it
                const layoutName = name.replace(/^layouts\//, '').replace(/\.hbs$/, '');
                // TODO: Get the raw template string, not the compiled version
                // this.inheritance.registerLayout(layoutName, templateString);
            }
        }
    }

    /**
     * Validate a template package
     */
    async validatePackage(packageNameOrPath: string): Promise<{ valid: boolean; errors: string[] }> {
        // Check if it's a path or package name
        if (packageNameOrPath.includes('/') || packageNameOrPath.includes('\\')) {
            return this.loader.validateTemplate(packageNameOrPath);
        } else {
            return this.packageManager.validatePackage(packageNameOrPath);
        }
    }

    /**
     * Install a template package
     */
    async installPackage(packageName: string, options?: any): Promise<void> {
        return this.packageManager.installPackage(packageName, options);
    }

    /**
     * List installed template packages
     */
    async listPackages(): Promise<any[]> {
        return this.packageManager.listInstalledPackages();
    }

    /**
     * Search for template packages
     */
    async searchPackages(query: string): Promise<any[]> {
        return this.packageManager.searchPackages(query);
    }
}