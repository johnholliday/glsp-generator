import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { TemplateSet, CompiledTemplate, TemplateDefinition } from './types.js';

export interface TemplateContext {
    projectName: string;
    grammar: ParsedGrammar;
    config: GLSPConfig;
    outputDir: string;
    [key: string]: any;
}

export interface GenerationItem {
    templateName: string;
    outputPath: string;
    context: TemplateContext;
    template: CompiledTemplate;
}

export class TemplateResolver {
    constructor(private templateSet: TemplateSet) {}

    /**
     * Resolve which templates should be generated and their output paths
     */
    resolveTemplates(context: TemplateContext): GenerationItem[] {
        const items: GenerationItem[] = [];
        
        for (const [templateName, compiledTemplate] of this.templateSet.templates) {
            // Check if template should be generated based on conditions
            if (!this.shouldGenerateTemplate(compiledTemplate, context)) {
                continue;
            }

            // Calculate output path
            const outputPath = this.resolveOutputPath(templateName, compiledTemplate.config, context);
            
            items.push({
                templateName,
                outputPath,
                context,
                template: compiledTemplate
            });
        }

        return items.sort((a, b) => a.outputPath.localeCompare(b.outputPath));
    }

    /**
     * Get a specific template by name
     */
    getTemplate(name: string): CompiledTemplate | undefined {
        return this.templateSet.templates.get(name);
    }

    /**
     * List all available templates
     */
    listTemplates(): string[] {
        return Array.from(this.templateSet.templates.keys()).sort();
    }

    /**
     * Get templates by category/prefix
     */
    getTemplatesByCategory(category: string): Map<string, CompiledTemplate> {
        const filtered = new Map<string, CompiledTemplate>();
        
        for (const [name, template] of this.templateSet.templates) {
            if (name.startsWith(category + '/') || name.startsWith(category + '-')) {
                filtered.set(name, template);
            }
        }
        
        return filtered;
    }

    /**
     * Check if a template should be generated based on conditions
     */
    private shouldGenerateTemplate(template: CompiledTemplate, context: TemplateContext): boolean {
        const config = template.config;
        
        // Check basic conditions
        if (config.condition) {
            try {
                // Simple condition evaluation - could be expanded
                return this.evaluateCondition(config.condition, context);
            } catch (error) {
                console.warn(`Failed to evaluate condition for template ${template.name}: ${error}`);
                return true; // Default to generating if condition fails
            }
        }
        
        return true;
    }

    /**
     * Simple condition evaluator
     * Supports: hasInterfaces, hasTypes, hasFeature, etc.
     */
    private evaluateCondition(condition: string, context: TemplateContext): boolean {
        // Simple condition parser - could be much more sophisticated
        if (condition === 'hasInterfaces') {
            return context.grammar.interfaces.length > 0;
        }
        
        if (condition === 'hasTypes') {
            return context.grammar.types.length > 0;
        }
        
        if (condition.startsWith('hasFeature:')) {
            const feature = condition.split(':')[1];
            return this.templateSet.config.features?.includes(feature) || false;
        }
        
        if (condition.startsWith('config.')) {
            const configPath = condition.substring(7);
            return this.getNestedProperty(context.config, configPath);
        }
        
        // Default to true for unknown conditions
        return true;
    }

    /**
     * Resolve the output path for a template
     */
    private resolveOutputPath(
        templateName: string, 
        config: TemplateDefinition, 
        context: TemplateContext
    ): string {
        // Use explicit targetDir if specified
        if (config.targetDir) {
            const fileName = this.resolveFileName(templateName, context);
            return path.join(config.targetDir, fileName);
        }

        // Default path resolution based on template name
        return this.getDefaultOutputPath(templateName, context);
    }

    /**
     * Default output path resolution
     */
    private getDefaultOutputPath(templateName: string, context: TemplateContext): string {
        const { projectName } = context;
        
        // Map template names to output paths
        const pathMappings: Record<string, string> = {
            'model': `src/common/${projectName}-model.ts`,
            'command-contribution': `src/browser/${projectName}-command-contribution.ts`,
            'diagram-configuration': `src/browser/diagram/${projectName}-diagram-configuration.ts`,
            'server-model': `src/server/model/${projectName}-server-model.ts`,
            'create-node-handler': `src/server/handlers/create-${projectName}-node-handler.ts`,
            'package-json': 'package.json',
            'tsconfig': 'tsconfig.json'
        };

        // Check direct mapping first
        if (pathMappings[templateName]) {
            return pathMappings[templateName];
        }

        // Handle nested template names (e.g., 'browser/component')
        if (templateName.includes('/')) {
            const parts = templateName.split('/');
            const fileName = this.resolveFileName(parts[parts.length - 1], context);
            
            // Build path based on structure
            if (parts[0] === 'browser') {
                return `src/browser/${parts.slice(1).join('/')}/${fileName}`;
            } else if (parts[0] === 'server') {
                return `src/server/${parts.slice(1).join('/')}/${fileName}`;
            } else if (parts[0] === 'common') {
                return `src/common/${parts.slice(1).join('/')}/${fileName}`;
            }
        }

        // Default: use template name as filename in src
        const fileName = this.resolveFileName(templateName, context);
        return `src/${fileName}`;
    }

    /**
     * Resolve filename with project name substitution
     */
    private resolveFileName(templateName: string, context: TemplateContext): string {
        const { projectName } = context;
        
        // If template name contains placeholders, replace them
        let fileName = templateName;
        
        // Replace common patterns
        fileName = fileName.replace(/\{projectName\}/g, projectName);
        fileName = fileName.replace(/\{kebab-case\}/g, this.toKebabCase(projectName));
        fileName = fileName.replace(/\{camelCase\}/g, this.toCamelCase(projectName));
        
        // Add .ts extension if not present and not a special file
        if (!fileName.includes('.') && !['package-json', 'tsconfig', 'readme'].includes(templateName)) {
            fileName += '.ts';
        }
        
        // Handle special cases
        if (templateName === 'package-json') {
            return 'package.json';
        }
        if (templateName === 'tsconfig') {
            return 'tsconfig.json';
        }
        if (templateName === 'readme') {
            return 'README.md';
        }
        
        return fileName;
    }

    /**
     * Get nested property from object using dot notation
     */
    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Convert string to kebab-case
     */
    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * Convert string to camelCase
     */
    private toCamelCase(str: string): string {
        return str
            .replace(/[-_\s]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
            .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
    }

    /**
     * Get template metadata for debugging/documentation
     */
    getTemplateInfo(templateName: string): any {
        const template = this.templateSet.templates.get(templateName);
        if (!template) {
            return null;
        }

        return {
            name: template.name,
            source: template.source,
            config: template.config,
            hasCondition: !!template.config.condition,
            targetDir: template.config.targetDir,
            description: template.config.description
        };
    }

    /**
     * Validate template context before generation
     */
    validateContext(context: TemplateContext): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!context.projectName) {
            errors.push('projectName is required');
        }

        if (!context.grammar) {
            errors.push('grammar is required');
        }

        if (!context.config) {
            errors.push('config is required');
        }

        if (!context.outputDir) {
            errors.push('outputDir is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}