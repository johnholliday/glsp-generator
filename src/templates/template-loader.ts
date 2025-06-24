import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    TemplateOptions,
    TemplateSet,
    TemplatePackage,
    TemplateConfig,
    CompiledTemplate,
    TemplateLoadResult
} from './types.js';
import { getTemplatesDir } from '../utils/paths.js';

const execAsync = promisify(exec);

export class TemplateLoader {
    private handlebars: typeof Handlebars;
    private loadedPackages: Map<string, TemplatePackage> = new Map();

    constructor() {
        this.handlebars = Handlebars.create();
        this.registerBuiltinHelpers();
    }

    /**
     * Register built-in helpers that templates expect
     */
    private registerBuiltinHelpers(): void {
        // Helper for converting strings to lowercase
        this.handlebars.registerHelper('toLowerCase', (str: string) =>
            str ? str.toLowerCase() : ''
        );

        // Helper for converting strings to PascalCase
        this.handlebars.registerHelper('toPascalCase', (str: string) => {
            if (!str) return '';
            return str
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
        });

        // Helper for converting strings to camelCase
        this.handlebars.registerHelper('toCamelCase', (str: string) => {
            if (!str) return '';
            const pascal = str
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
            return pascal.charAt(0).toLowerCase() + pascal.slice(1);
        });

        // Helper for checking if array has elements
        this.handlebars.registerHelper('hasElements', (arr: any[]) => arr && arr.length > 0);

        // Helper for joining array elements
        this.handlebars.registerHelper('join', (arr: any[], separator: string) =>
            arr ? arr.join(separator) : ''
        );

        // Helper for indentation
        this.handlebars.registerHelper('indent', (count: number) => '    '.repeat(count));

        // Helper for generating TypeScript property type
        this.handlebars.registerHelper('tsType', (type: string, optional: boolean, array: boolean) => {
            let tsType = type;
            if (array) tsType += '[]';
            if (optional) tsType += ' | undefined';
            return tsType;
        });

        // Helper for equality comparison
        this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);

        // Helper for inequality comparison
        this.handlebars.registerHelper('neq', (a: any, b: any) => a !== b);

        // Helper for logical NOT
        this.handlebars.registerHelper('not', (value: any) => !value);

        // Helper for logical AND
        this.handlebars.registerHelper('and', (...args: any[]) => {
            // Remove the last argument (Handlebars options object)
            const values = args.slice(0, -1);
            return values.every(v => v);
        });

        // Helper for logical OR
        this.handlebars.registerHelper('or', (...args: any[]) => {
            // Remove the last argument (Handlebars options object)
            const values = args.slice(0, -1);
            return values.some(v => v);
        });

        // Helper for unless (inverse of if)
        this.handlebars.registerHelper('unless', function (this: any, conditional: any, options: any) {
            if (!conditional) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        // Helper for formatting dates
        this.handlebars.registerHelper('formatDate', (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        });

        // Helper for converting to lowercase
        this.handlebars.registerHelper('toLowerCase', (str: string) =>
            str ? str.toLowerCase() : ''
        );
    }

    async loadTemplates(options: TemplateOptions = {}): Promise<TemplateLoadResult> {
        try {
            // Load default templates first
            const defaultTemplates = await this.loadDefaultTemplates();

            // Load custom templates if specified
            let customTemplates: TemplatePackage | null = null;
            if (options.templatesPath) {
                customTemplates = await this.loadFromPath(options.templatesPath);
            } else if (options.templatesPackage) {
                customTemplates = await this.loadFromPackage(options.templatesPackage);
            } else if (options.templatesRepo) {
                customTemplates = await this.loadFromGit(options.templatesRepo);
            }

            // Merge templates with override logic
            const templateSet = await this.mergeTemplates(defaultTemplates, customTemplates);

            return {
                success: true,
                templateSet
            };
        } catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }

    private async loadDefaultTemplates(): Promise<TemplatePackage> {
        const templatesDir = getTemplatesDir();
        const configPath = path.join(templatesDir, 'config.json');

        let config: TemplateConfig = {
            name: '@glsp-generator/default-templates',
            version: '1.0.0',
            description: 'Default GLSP templates'
        };

        // Load config if exists
        if (await fs.pathExists(configPath)) {
            const configContent = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configContent);
        }

        return this.loadTemplatePackageFromPath(templatesDir, config);
    }

    private async loadFromPath(templatePath: string): Promise<TemplatePackage> {
        if (!path.isAbsolute(templatePath)) {
            templatePath = path.resolve(process.cwd(), templatePath);
        }

        if (!await fs.pathExists(templatePath)) {
            throw new Error(`Template path does not exist: ${templatePath}`);
        }

        const configPath = path.join(templatePath, 'config.json');
        if (!await fs.pathExists(configPath)) {
            throw new Error(`Template config not found: ${configPath}`);
        }

        const configContent = await fs.readFile(configPath, 'utf-8');
        const config: TemplateConfig = JSON.parse(configContent);

        return this.loadTemplatePackageFromPath(templatePath, config);
    }

    private async loadFromPackage(packageName: string): Promise<TemplatePackage> {
        // Check if package is already loaded
        if (this.loadedPackages.has(packageName)) {
            return this.loadedPackages.get(packageName)!;
        }

        try {
            // Try to resolve package
            const packagePath = require.resolve(`${packageName}/package.json`);
            const packageDir = path.dirname(packagePath);

            const packageJson = await fs.readJSON(packagePath);
            const templatesDir = path.join(packageDir, 'templates');

            if (!await fs.pathExists(templatesDir)) {
                throw new Error(`Templates directory not found in package: ${packageName}`);
            }

            // Look for template config
            const configPath = path.join(packageDir, 'config.json');
            let config: TemplateConfig = {
                name: packageName,
                version: packageJson.version || '1.0.0',
                description: packageJson.description
            };

            if (await fs.pathExists(configPath)) {
                const configContent = await fs.readFile(configPath, 'utf-8');
                config = { ...config, ...JSON.parse(configContent) };
            }

            const templatePackage = await this.loadTemplatePackageFromPath(packageDir, config);
            this.loadedPackages.set(packageName, templatePackage);

            return templatePackage;
        } catch (error) {
            throw new Error(`Failed to load template package '${packageName}': ${error}`);
        }
    }

    private async loadFromGit(repoUrl: string): Promise<TemplatePackage> {
        const tempDir = path.join(process.cwd(), '.tmp-templates');

        try {
            // Clean up any existing temp directory
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }

            // Clone repository
            await execAsync(`git clone ${repoUrl} ${tempDir}`);

            // Load from the cloned directory
            const templatePackage = await this.loadFromPath(tempDir);

            return templatePackage;
        } finally {
            // Clean up temp directory
            if (await fs.pathExists(tempDir)) {
                await fs.remove(tempDir);
            }
        }
    }

    private async loadTemplatePackageFromPath(
        templatePath: string,
        config: TemplateConfig
    ): Promise<TemplatePackage> {
        const templates = new Map<string, string>();
        const helpers = new Map<string, string>();
        const partials = new Map<string, string>();

        // Load templates - check both 'templates' subdirectory and direct path
        const templatesDir = path.join(templatePath, 'templates');
        if (await fs.pathExists(templatesDir)) {
            await this.loadTemplateFiles(templatesDir, templates, '');
        } else {
            // If no 'templates' subdirectory, load directly from templatePath
            await this.loadTemplateFiles(templatePath, templates, '');
        }

        // Load helpers
        if (config.helpers) {
            for (const helperPath of config.helpers) {
                const fullPath = path.join(templatePath, helperPath);
                if (await fs.pathExists(fullPath)) {
                    const helperContent = await fs.readFile(fullPath, 'utf-8');
                    const helperName = path.basename(helperPath, path.extname(helperPath));
                    helpers.set(helperName, helperContent);
                }
            }
        }

        // Load partials
        if (config.partials) {
            for (const [partialName, partialPath] of Object.entries(config.partials)) {
                const fullPath = path.join(templatePath, partialPath);
                if (await fs.pathExists(fullPath)) {
                    const partialContent = await fs.readFile(fullPath, 'utf-8');
                    partials.set(partialName, partialContent);
                }
            }
        }

        // Also auto-load from partials directory
        const partialsDir = path.join(templatePath, 'partials');
        if (await fs.pathExists(partialsDir)) {
            await this.loadPartialFiles(partialsDir, partials);
        }

        return {
            config,
            templates,
            helpers,
            partials,
            path: templatePath
        };
    }

    private async loadTemplateFiles(
        dir: string,
        templates: Map<string, string>,
        prefix: string
    ): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                // Skip certain directories when loading from root template path
                if (['node_modules', '.git', 'dist', '__tests__'].includes(entry.name)) {
                    continue;
                }
                await this.loadTemplateFiles(entryPath, templates, relativeName);
            } else if (entry.name.endsWith('.hbs')) {
                const templateName = relativeName.replace(/\.hbs$/, '');
                const content = await fs.readFile(entryPath, 'utf-8');
                templates.set(templateName, content);
            }
        }
    }

    private async loadPartialFiles(dir: string, partials: Map<string, string>): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.hbs')) {
                const partialName = entry.name.replace(/\.hbs$/, '');
                const partialPath = path.join(dir, entry.name);
                const content = await fs.readFile(partialPath, 'utf-8');
                partials.set(partialName, content);
            }
        }
    }

    private async mergeTemplates(
        defaultTemplates: TemplatePackage,
        customTemplates: TemplatePackage | null
    ): Promise<TemplateSet> {
        const compiledTemplates = new Map<string, CompiledTemplate>();
        const helpers = new Map<string, Handlebars.HelperDelegate>();
        const partials = new Map<string, HandlebarsTemplateDelegate>();

        // Start with default templates
        for (const [name, content] of defaultTemplates.templates) {
            const compiled = this.handlebars.compile(content);
            compiledTemplates.set(name, {
                name,
                template: compiled,
                config: defaultTemplates.config.templates?.[name] || {},
                source: 'default'
            });
        }

        // Add default partials
        for (const [name, content] of defaultTemplates.partials) {
            const compiled = this.handlebars.compile(content);
            partials.set(name, compiled);
            this.handlebars.registerPartial(name, compiled);
        }

        // Override with custom templates if provided
        if (customTemplates) {
            // Add custom partials first (they might be used by templates)
            for (const [name, content] of customTemplates.partials) {
                const compiled = this.handlebars.compile(content);
                partials.set(name, compiled);
                this.handlebars.registerPartial(name, compiled);
            }

            // Add or override templates
            for (const [name, content] of customTemplates.templates) {
                const templateConfig = customTemplates.config.templates?.[name] || {};

                if (templateConfig.override !== false) {
                    const compiled = this.handlebars.compile(content);
                    compiledTemplates.set(name, {
                        name,
                        template: compiled,
                        config: templateConfig,
                        source: 'custom'
                    });
                }
            }

            // Load custom helpers
            for (const [name, content] of customTemplates.helpers) {
                try {
                    // Evaluate helper function
                    const helperFunction = new Function('Handlebars', content);
                    const helper = helperFunction(this.handlebars);
                    if (typeof helper === 'function') {
                        helpers.set(name, helper);
                        this.handlebars.registerHelper(name, helper);
                    }
                } catch (error) {
                    console.warn(`Failed to load helper '${name}':`, error);
                }
            }
        }

        return {
            templates: compiledTemplates,
            helpers,
            partials,
            config: customTemplates?.config || defaultTemplates.config
        };
    }

    async validateTemplate(templatePath: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            // Check if config exists
            const configPath = path.join(templatePath, 'config.json');
            if (!await fs.pathExists(configPath)) {
                errors.push('config.json not found');
            } else {
                // Validate config
                const configContent = await fs.readFile(configPath, 'utf-8');
                try {
                    const config = JSON.parse(configContent);
                    if (!config.name) errors.push('config.json missing required "name" field');
                    if (!config.version) errors.push('config.json missing required "version" field');
                } catch (e) {
                    errors.push('config.json is not valid JSON');
                }
            }

            // Check if templates directory exists
            const templatesDir = path.join(templatePath, 'templates');
            if (!await fs.pathExists(templatesDir)) {
                errors.push('templates directory not found');
            }

            // TODO: Add more validation (helper syntax, template syntax, etc.)

        } catch (error) {
            errors.push(`Validation error: ${error}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}