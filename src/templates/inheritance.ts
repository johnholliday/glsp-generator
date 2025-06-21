import Handlebars from 'handlebars';

/**
 * Template inheritance system for Handlebars templates
 * Supports block-based inheritance similar to Django/Jinja2 templates
 */
export class TemplateInheritance {
    private handlebars: typeof Handlebars;
    private layouts: Map<string, string> = new Map();
    private blocks: Map<string, string> = new Map();

    constructor(handlebars: typeof Handlebars) {
        this.handlebars = handlebars;
        this.registerInheritanceHelpers();
    }

    /**
     * Register a layout template
     */
    registerLayout(name: string, template: string): void {
        this.layouts.set(name, template);
    }

    /**
     * Process a template with inheritance
     */
    processTemplate(template: string): string {
        // Reset blocks for each template processing
        this.blocks.clear();
        
        // Pre-process the template to extract blocks and extends
        const processed = this.preProcessTemplate(template);
        
        return processed;
    }

    /**
     * Pre-process template to handle inheritance directives
     */
    private preProcessTemplate(template: string): string {
        let processed = template;
        
        // Extract extends directive
        const extendsMatch = processed.match(/\{\{#extend\s+["']([^"']+)["']\}\}([\s\S]*?)\{\{\/extend\}\}/);
        if (extendsMatch) {
            const layoutName = extendsMatch[1];
            const childContent = extendsMatch[2];
            
            // Extract blocks from child content
            this.extractBlocks(childContent);
            
            // Get parent layout
            const parentLayout = this.layouts.get(layoutName);
            if (parentLayout) {
                // Process parent layout with child blocks
                processed = this.processParentLayout(parentLayout);
            } else {
                console.warn(`Layout '${layoutName}' not found`);
                processed = childContent;
            }
        }
        
        return processed;
    }

    /**
     * Extract block definitions from template content
     */
    private extractBlocks(content: string): void {
        const blockRegex = /\{\{#content\s+["']([^"']+)["']\}\}([\s\S]*?)\{\{\/content\}\}/g;
        let match;
        
        while ((match = blockRegex.exec(content)) !== null) {
            const blockName = match[1];
            const blockContent = match[2].trim();
            this.blocks.set(blockName, blockContent);
        }
    }

    /**
     * Process parent layout by replacing block placeholders
     */
    private processParentLayout(layout: string): string {
        let processed = layout;
        
        // Replace block placeholders with child content
        const blockRegex = /\{\{#block\s+["']([^"']+)["']\}\}([\s\S]*?)\{\{\/block\}\}/g;
        
        processed = processed.replace(blockRegex, (match, blockName, defaultContent) => {
            // Use child block content if available, otherwise use default
            const childContent = this.blocks.get(blockName);
            return childContent !== undefined ? childContent : defaultContent.trim();
        });
        
        return processed;
    }

    /**
     * Register Handlebars helpers for inheritance
     */
    private registerInheritanceHelpers(): void {
        // Block helper - defines a replaceable block in parent template
        this.handlebars.registerHelper('block', function(this: any, name: string, options: any) {
            // This is handled in pre-processing, so just return default content
            return options.fn ? options.fn(this) : '';
        });

        // Extend helper - indicates template inheritance
        this.handlebars.registerHelper('extend', function(this: any, layoutName: string, options: any) {
            // This is handled in pre-processing, so just return content
            return options.fn ? options.fn(this) : '';
        });

        // Content helper - defines block content in child template
        this.handlebars.registerHelper('content', function(this: any, blockName: string, options: any) {
            // This is handled in pre-processing, so just return content
            return options.fn ? options.fn(this) : '';
        });

        // Super helper - includes parent block content
        this.handlebars.registerHelper('super', function(this: any) {
            // TODO: Implement super functionality
            return '';
        });

        // Include helper - includes another template
        this.handlebars.registerHelper('include', function(this: any, templateName: string, context?: any) {
            // TODO: Implement include functionality
            return `<!-- Include: ${templateName} -->`;
        });
    }

    /**
     * Create a layout template
     */
    static createLayout(name: string, content: string): string {
        return `{{!-- Layout: ${name} --}}
${content}`;
    }

    /**
     * Create a child template that extends a layout
     */
    static createChild(layoutName: string, blocks: Record<string, string>): string {
        let template = `{{#extend "${layoutName}"}}\n`;
        
        for (const [blockName, content] of Object.entries(blocks)) {
            template += `  {{#content "${blockName}"}}\n`;
            template += content.split('\n').map(line => `    ${line}`).join('\n') + '\n';
            template += `  {{/content}}\n\n`;
        }
        
        template += '{{/extend}}';
        
        return template;
    }

    /**
     * Validate inheritance structure
     */
    validateTemplate(template: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Check for balanced extend/content blocks
        const extendMatches = (template.match(/\{\{#extend/g) || []).length;
        const extendCloses = (template.match(/\{\{\/extend\}\}/g) || []).length;
        
        if (extendMatches !== extendCloses) {
            errors.push('Unbalanced extend blocks');
        }
        
        const contentMatches = (template.match(/\{\{#content/g) || []).length;
        const contentCloses = (template.match(/\{\{\/content\}\}/g) || []).length;
        
        if (contentMatches !== contentCloses) {
            errors.push('Unbalanced content blocks');
        }
        
        // Check for valid extend usage (should only be one per template)
        if (extendMatches > 1) {
            errors.push('Template can only extend one layout');
        }
        
        // Extract layout name and check if it exists
        const extendsMatch = template.match(/\{\{#extend\s+["']([^"']+)["']\}\}/);
        if (extendsMatch) {
            const layoutName = extendsMatch[1];
            if (!this.layouts.has(layoutName)) {
                errors.push(`Layout '${layoutName}' not found`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get available layouts
     */
    getLayouts(): string[] {
        return Array.from(this.layouts.keys());
    }

    /**
     * Get layout content
     */
    getLayout(name: string): string | undefined {
        return this.layouts.get(name);
    }
}

/**
 * Example usage and utilities
 */
export const TemplateInheritanceUtils = {
    /**
     * Create a basic layout template
     */
    createBasicLayout(): string {
        return `{{!-- Basic Layout --}}
{{> header}}

{{#block "content"}}
  <!-- Default content -->
{{/block}}

{{#block "scripts"}}
  <!-- Default scripts -->
{{/block}}

{{> footer}}`;
    },

    /**
     * Create a TypeScript file layout
     */
    createTypeScriptLayout(): string {
        return `{{!-- TypeScript File Layout --}}
{{#block "imports"}}
// Default imports
{{/block}}

{{#block "interfaces"}}
// Interfaces
{{/block}}

{{#block "classes"}}
// Classes
{{/block}}

{{#block "exports"}}
// Exports
{{/block}}`;
    },

    /**
     * Create a React component layout
     */
    createReactComponentLayout(): string {
        return `{{!-- React Component Layout --}}
{{#block "imports"}}
import React from 'react';
{{/block}}

{{#block "interfaces"}}
// Component interfaces
{{/block}}

{{#block "component"}}
export const {{componentName}}: React.FC = () => {
  return (
    <div>
      {{#block "render"}}
        <!-- Component content -->
      {{/block}}
    </div>
  );
};
{{/block}}

{{#block "exports"}}
export default {{componentName}};
{{/block}}`;
    }
};