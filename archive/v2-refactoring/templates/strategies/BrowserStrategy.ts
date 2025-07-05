/**
 * Browser-specific template rendering strategy
 * @module templates/strategies
 */

import { injectable, inject } from 'inversify';
import { Grammar } from 'langium';
import { TYPES } from '../../infrastructure/di/symbols';
import { ITemplateStrategy, ITemplateLoader, ITemplateRenderer } from '../../core/interfaces';
import { GeneratedFile, TemplateContext } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';

/**
 * Strategy for rendering browser/client-side templates
 * Implements Strategy Pattern for template rendering
 */
@injectable()
export class BrowserStrategy implements ITemplateStrategy {
  readonly name = 'browser';

  private readonly templates = [
    'frontend-module',
    'diagram-configuration', 
    'command-contribution',
    'tool-palette-contribution',
    'property-palette-contribution',
    'context-menu-contribution',
    'model-source',
    'views'
  ];

  constructor(
    @inject(TYPES.ITemplateLoader) private readonly templateLoader: ITemplateLoader,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger
  ) {
    this.logger.info('BrowserStrategy initialized');
  }

  /**
   * Checks if this strategy can handle the template category
   */
  canHandle(templateName: string): boolean {
    return templateName === 'browser' || templateName === 'client';
  }

  /**
   * Renders browser-specific templates
   */
  async render(
    grammar: Grammar, 
    templateName: string, 
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    this.logger.debug(`Rendering browser templates for ${grammar.name}`);
    
    const files: GeneratedFile[] = [];
    const templateData = this.prepareTemplateData(grammar, context);

    // Render each browser template
    for (const template of this.templates) {
      try {
        const content = await this.renderTemplate(template, templateData);
        if (content) {
          files.push({
            path: `browser/${this.getFileName(template)}`,
            content,
            encoding: 'utf-8'
          });
        }
      } catch (error) {
        this.logger.error(`Failed to render browser template: ${template}`, error as Error);
      }
    }

    // Generate model type definitions
    const modelTypes = await this.generateModelTypes(grammar, templateData);
    if (modelTypes) {
      files.push({
        path: 'browser/model-types.ts',
        content: modelTypes,
        encoding: 'utf-8'
      });
    }

    // Generate DI configuration
    const diConfig = await this.generateDIConfig(grammar, templateData);
    if (diConfig) {
      files.push({
        path: 'browser/di.config.ts',
        content: diConfig,
        encoding: 'utf-8'
      });
    }

    this.logger.info(`Generated ${files.length} browser files`);
    return files;
  }

  /**
   * Private helper methods
   */
  private prepareTemplateData(grammar: Grammar, context: TemplateContext): any {
    return {
      grammar,
      grammarName: grammar.name,
      modelTypes: this.extractModelTypes(grammar),
      commands: this.extractCommands(grammar),
      views: this.extractViews(grammar),
      ...context.data
    };
  }

  private extractModelTypes(grammar: Grammar): any[] {
    const types: any[] = [];
    
    // Extract from interfaces
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        types.push({
          name: iface.name,
          type: 'interface',
          properties: iface.attributes || [],
          superTypes: iface.superTypes?.map((st: any) => st.ref?.name) || []
        });
      }
    }
    
    // Extract from types
    if (grammar.types) {
      for (const type of grammar.types) {
        types.push({
          name: type.name,
          type: 'type',
          definition: type.type
        });
      }
    }
    
    return types;
  }

  private extractCommands(grammar: Grammar): any[] {
    // Extract commands from grammar annotations or conventions
    const commands: any[] = [];
    
    // Look for rules that might represent commands
    for (const rule of grammar.rules) {
      if (rule.name.toLowerCase().includes('command') || 
          rule.name.toLowerCase().includes('action')) {
        commands.push({
          id: `${(grammar.name || 'untitled').toLowerCase()}.${rule.name}`,
          label: this.humanize(rule.name),
          handler: `handle${rule.name}`
        });
      }
    }
    
    // Add default commands
    commands.push(
      {
        id: `${(grammar.name || 'untitled').toLowerCase()}.fit`,
        label: 'Fit to Screen',
        handler: 'handleFitToScreen'
      },
      {
        id: `${(grammar.name || 'untitled').toLowerCase()}.center`,
        label: 'Center',
        handler: 'handleCenter'
      },
      {
        id: `${(grammar.name || 'untitled').toLowerCase()}.export`,
        label: 'Export',
        handler: 'handleExport'
      }
    );
    
    return commands;
  }

  private extractViews(grammar: Grammar): any[] {
    // Extract view configurations
    return [
      {
        id: `${(grammar.name || 'untitled').toLowerCase()}DiagramWidget`,
        name: `${grammar.name || 'Untitled'} Diagram`,
        defaultView: true
      }
    ];
  }

  private async renderTemplate(templateName: string, data: any): Promise<string | null> {
    try {
      const templatePath = `browser/${templateName}.hbs`;
      const exists = await this.templateLoader.templateExists(templatePath);
      
      if (!exists) {
        this.logger.debug(`Template not found: ${templatePath}`);
        return null;
      }
      
      const template = await this.templateLoader.loadTemplate(templatePath);
      return this.renderer.renderTemplate(template, data);
    } catch (error) {
      this.logger.error(`Error rendering template ${templateName}`, error as Error);
      return null;
    }
  }

  private async generateModelTypes(grammar: Grammar, data: any): Promise<string> {
    const template = `import { GNode, GEdge, GGraph } from '@eclipse-glsp/client';

{{#each modelTypes}}
{{#if (eq type "interface")}}
export interface {{name}}{{#if superTypes}} extends {{join superTypes ", "}}{{/if}} {
  {{#each properties}}
  {{name}}{{#if optional}}?{{/if}}: {{getPropertyType this}};
  {{/each}}
}
{{/if}}
{{/each}}

{{#each modelTypes}}
{{#if (eq type "type")}}
export type {{name}} = {{getPropertyType definition}};
{{/if}}
{{/each}}

// Node type guards
{{#each modelTypes}}
{{#if (and (eq type "interface") (includes name "Node"))}}
export function is{{name}}(element: any): element is {{name}} {
  return element.type === '{{toLowerCase name}}';
}
{{/if}}
{{/each}}
`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private async generateDIConfig(grammar: Grammar, data: any): Promise<string> {
    const template = `import { ContainerModule } from 'inversify';
import { TYPES } from '@eclipse-glsp/client';
import { {{grammar.name}}DiagramConfiguration } from './diagram-configuration';
import { {{grammar.name}}CommandContribution } from './command-contribution';
import { {{grammar.name}}ToolPaletteContribution } from './tool-palette-contribution';

export const {{toLowerCase grammar.name}}Module = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind({{grammar.name}}DiagramConfiguration).toSelf().inSingletonScope();
    bind(TYPES.DiagramConfiguration).toService({{grammar.name}}DiagramConfiguration);
    
    bind({{grammar.name}}CommandContribution).toSelf().inSingletonScope();
    bind(TYPES.ICommandContribution).toService({{grammar.name}}CommandContribution);
    
    bind({{grammar.name}}ToolPaletteContribution).toSelf().inSingletonScope();
    bind(TYPES.IToolPaletteContribution).toService({{grammar.name}}ToolPaletteContribution);
});
`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private getFileName(template: string): string {
    return `${template}.ts`;
  }

  private humanize(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}