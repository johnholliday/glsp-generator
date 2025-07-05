/**
 * Server-specific template rendering strategy
 * @module templates/strategies
 */

import { injectable, inject } from 'inversify';
import { Grammar } from 'langium';
import { TYPES } from '../../infrastructure/di/symbols';
import { ITemplateStrategy, ITemplateLoader, ITemplateRenderer } from '../../core/interfaces';
import { GeneratedFile, TemplateContext } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';

/**
 * Strategy for rendering server-side templates
 * Implements Strategy Pattern for template rendering
 */
@injectable()
export class ServerStrategy implements ITemplateStrategy {
  readonly name = 'server';

  private readonly templates = [
    'server-module',
    'model-factory',
    'model-serializer',
    'command-handler',
    'operation-handler',
    'model-validator',
    'layout-engine',
    'model-index'
  ];

  constructor(
    @inject(TYPES.ITemplateLoader) private readonly templateLoader: ITemplateLoader,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger
  ) {
    this.logger.info('ServerStrategy initialized');
  }

  /**
   * Checks if this strategy can handle the template category
   */
  canHandle(templateName: string): boolean {
    return templateName === 'server' || templateName === 'backend';
  }

  /**
   * Renders server-specific templates
   */
  async render(
    grammar: Grammar, 
    templateName: string, 
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    this.logger.debug(`Rendering server templates for ${grammar.name}`);
    
    const files: GeneratedFile[] = [];
    const templateData = this.prepareTemplateData(grammar, context);

    // Render each server template
    for (const template of this.templates) {
      try {
        const content = await this.renderTemplate(template, templateData);
        if (content) {
          files.push({
            path: `server/${this.getFileName(template)}`,
            content,
            encoding: 'utf-8'
          });
        }
      } catch (error) {
        this.logger.error(`Failed to render server template: ${template}`, error as Error);
      }
    }

    // Generate node handlers for each node type
    const nodeHandlers = await this.generateNodeHandlers(grammar, templateData);
    files.push(...nodeHandlers);

    // Generate edge handlers for each edge type
    const edgeHandlers = await this.generateEdgeHandlers(grammar, templateData);
    files.push(...edgeHandlers);

    // Generate server-side DI configuration
    const diConfig = await this.generateDIConfig(grammar, templateData);
    if (diConfig) {
      files.push({
        path: 'server/di.config.ts',
        content: diConfig,
        encoding: 'utf-8'
      });
    }

    this.logger.info(`Generated ${files.length} server files`);
    return files;
  }

  /**
   * Private helper methods
   */
  private prepareTemplateData(grammar: Grammar, context: TemplateContext): any {
    return {
      grammar,
      grammarName: grammar.name,
      nodeTypes: this.extractNodeTypes(grammar),
      edgeTypes: this.extractEdgeTypes(grammar),
      operations: this.extractOperations(grammar),
      ...context.data
    };
  }

  private extractNodeTypes(grammar: Grammar): any[] {
    const nodeTypes: any[] = [];
    
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        if (iface.name.toLowerCase().includes('node') || 
            iface.name.toLowerCase().includes('element')) {
          nodeTypes.push({
            name: iface.name,
            typeName: `node:${iface.name.toLowerCase()}`,
            properties: iface.attributes || [],
            superTypes: iface.superTypes?.map((st: any) => st.ref?.name) || [],
            hasChildren: iface.attributes?.some((f: any) => 
              f.name === 'children' || f.type?.$type === 'ArrayType'
            )
          });
        }
      }
    }
    
    return nodeTypes;
  }

  private extractEdgeTypes(grammar: Grammar): any[] {
    const edgeTypes: any[] = [];
    
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        if (iface.name.toLowerCase().includes('edge') || 
            iface.name.toLowerCase().includes('connection') ||
            iface.name.toLowerCase().includes('link')) {
          edgeTypes.push({
            name: iface.name,
            typeName: `edge:${iface.name.toLowerCase()}`,
            properties: iface.attributes || [],
            superTypes: iface.superTypes?.map((st: any) => st.ref?.name) || []
          });
        }
      }
    }
    
    return edgeTypes;
  }

  private extractOperations(grammar: Grammar): any[] {
    const operations: any[] = [];
    
    // Standard GLSP operations
    operations.push(
      { name: 'CreateNode', type: 'create' },
      { name: 'CreateEdge', type: 'create' },
      { name: 'DeleteElement', type: 'delete' },
      { name: 'ChangeContainer', type: 'move' },
      { name: 'ChangeBounds', type: 'resize' },
      { name: 'ReconnectEdge', type: 'reconnect' },
      { name: 'LayoutOperation', type: 'layout' }
    );
    
    // Look for custom operations in grammar
    for (const rule of grammar.rules) {
      if (rule.name.toLowerCase().includes('operation') || 
          rule.name.toLowerCase().includes('command')) {
        operations.push({
          name: rule.name,
          type: 'custom'
        });
      }
    }
    
    return operations;
  }

  private async renderTemplate(templateName: string, data: any): Promise<string | null> {
    try {
      const templatePath = `server/${templateName}.hbs`;
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

  private async generateNodeHandlers(grammar: Grammar, data: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const template = `import { injectable } from 'inversify';
import { CreateNodeOperation } from '@eclipse-glsp/server';
import { {{name}} } from '../model';
import { ModelFactory } from './model-factory';

@injectable()
export class Create{{name}}Handler extends CreateNodeOperationHandler {
    readonly elementTypeIds = ['{{typeName}}'];

    execute(operation: CreateNodeOperation): void {
        const {{camelCase name}} = ModelFactory.create{{name}}({
            id: this.modelState.index.createId('{{toLowerCase name}}'),
            position: operation.location,
            {{#each properties}}
            {{#unless (isReference this)}}
            {{name}}: {{#if (eq (getPropertyType this) "string")}}''{{else if (eq (getPropertyType this) "number")}}0{{else if (eq (getPropertyType this) "boolean")}}false{{else}}undefined{{/if}},
            {{/unless}}
            {{/each}}
        });

        this.modelState.index.add({{camelCase name}});
        
        {{#if hasChildren}}
        if (operation.containerId) {
            const container = this.modelState.index.findParent(operation.containerId);
            if (container && 'children' in container) {
                container.children.push({{camelCase name}}.id);
            }
        }
        {{/if}}
    }
}`;

    for (const nodeType of data.nodeTypes) {
      const content = this.renderer.renderTemplate(template, nodeType);
      files.push({
        path: `server/handlers/create-${this.toKebabCase(nodeType.name)}-handler.ts`,
        content,
        encoding: 'utf-8'
      });
    }

    return files;
  }

  private async generateEdgeHandlers(grammar: Grammar, data: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const template = `import { injectable } from 'inversify';
import { CreateEdgeOperation } from '@eclipse-glsp/server';
import { {{name}} } from '../model';
import { ModelFactory } from './model-factory';

@injectable()
export class Create{{name}}Handler extends CreateEdgeOperationHandler {
    readonly elementTypeIds = ['{{typeName}}'];

    execute(operation: CreateEdgeOperation): void {
        const {{camelCase name}} = ModelFactory.create{{name}}({
            id: this.modelState.index.createId('{{toLowerCase name}}'),
            sourceId: operation.sourceElementId,
            targetId: operation.targetElementId,
            {{#each properties}}
            {{#unless (or (eq name "sourceId") (eq name "targetId"))}}
            {{name}}: {{#if (eq (getPropertyType this) "string")}}''{{else if (eq (getPropertyType this) "number")}}0{{else if (eq (getPropertyType this) "boolean")}}false{{else}}undefined{{/if}},
            {{/unless}}
            {{/each}}
        });

        this.modelState.index.add({{camelCase name}});
    }
}`;

    for (const edgeType of data.edgeTypes) {
      const content = this.renderer.renderTemplate(template, edgeType);
      files.push({
        path: `server/handlers/create-${this.toKebabCase(edgeType.name)}-handler.ts`,
        content,
        encoding: 'utf-8'
      });
    }

    return files;
  }

  private async generateDIConfig(grammar: Grammar, data: any): Promise<string> {
    const template = `import { ContainerModule } from 'inversify';
import { TYPES } from '@eclipse-glsp/server';
import { {{grammar.name}}ModelFactory } from './model-factory';
import { {{grammar.name}}ModelValidator } from './model-validator';
import { {{grammar.name}}LayoutEngine } from './layout-engine';
{{#each nodeTypes}}
import { Create{{name}}Handler } from './handlers/create-{{toKebabCase name}}-handler';
{{/each}}
{{#each edgeTypes}}
import { Create{{name}}Handler } from './handlers/create-{{toKebabCase name}}-handler';
{{/each}}

export const {{toLowerCase grammar.name}}ServerModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    // Model services
    bind({{grammar.name}}ModelFactory).toSelf().inSingletonScope();
    bind(TYPES.IModelFactory).toService({{grammar.name}}ModelFactory);
    
    bind({{grammar.name}}ModelValidator).toSelf().inSingletonScope();
    bind(TYPES.IModelValidator).toService({{grammar.name}}ModelValidator);
    
    bind({{grammar.name}}LayoutEngine).toSelf().inSingletonScope();
    bind(TYPES.ILayoutEngine).toService({{grammar.name}}LayoutEngine);
    
    // Operation handlers
    {{#each nodeTypes}}
    bind(Create{{name}}Handler).toSelf().inSingletonScope();
    bind(TYPES.IOperationHandler).toService(Create{{name}}Handler);
    {{/each}}
    
    {{#each edgeTypes}}
    bind(Create{{name}}Handler).toSelf().inSingletonScope();
    bind(TYPES.IOperationHandler).toService(Create{{name}}Handler);
    {{/each}}
});`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private getFileName(template: string): string {
    return `${template}.ts`;
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
}