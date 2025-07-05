/**
 * Common/shared template rendering strategy
 * @module templates/strategies
 */

import { injectable, inject } from 'inversify';
import { Grammar } from 'langium';
import { TYPES } from '../../infrastructure/di/symbols';
import { ITemplateStrategy, ITemplateLoader, ITemplateRenderer } from '../../core/interfaces';
import { GeneratedFile, TemplateContext } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';

/**
 * Strategy for rendering common/shared templates
 * Implements Strategy Pattern for template rendering
 */
@injectable()
export class CommonStrategy implements ITemplateStrategy {
  readonly name = 'common';

  private readonly templates = [
    'model-types',
    'protocol',
    'actions',
    'utils',
    'constants'
  ];

  constructor(
    @inject(TYPES.ITemplateLoader) private readonly templateLoader: ITemplateLoader,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger
  ) {
    this.logger.info('CommonStrategy initialized');
  }

  /**
   * Checks if this strategy can handle the template category
   */
  canHandle(templateName: string): boolean {
    return templateName === 'common' || templateName === 'shared';
  }

  /**
   * Renders common/shared templates
   */
  async render(
    grammar: Grammar, 
    templateName: string, 
    context: TemplateContext
  ): Promise<GeneratedFile[]> {
    this.logger.debug(`Rendering common templates for ${grammar.name}`);
    
    const files: GeneratedFile[] = [];
    const templateData = this.prepareTemplateData(grammar, context);

    // Render each common template
    for (const template of this.templates) {
      try {
        const content = await this.renderTemplate(template, templateData);
        if (content) {
          files.push({
            path: `common/${this.getFileName(template)}`,
            content,
            encoding: 'utf-8'
          });
        }
      } catch (error) {
        this.logger.error(`Failed to render common template: ${template}`, error as Error);
      }
    }

    // Generate model interfaces
    const modelInterfaces = await this.generateModelInterfaces(grammar, templateData);
    if (modelInterfaces) {
      files.push({
        path: 'common/model-types.ts',
        content: modelInterfaces,
        encoding: 'utf-8'
      });
    }

    // Generate protocol types
    const protocol = await this.generateProtocol(grammar, templateData);
    if (protocol) {
      files.push({
        path: 'common/protocol.ts',
        content: protocol,
        encoding: 'utf-8'
      });
    }

    // Generate action definitions
    const actions = await this.generateActions(grammar, templateData);
    if (actions) {
      files.push({
        path: 'common/actions.ts',
        content: actions,
        encoding: 'utf-8'
      });
    }

    this.logger.info(`Generated ${files.length} common files`);
    return files;
  }

  /**
   * Private helper methods
   */
  private prepareTemplateData(grammar: Grammar, context: TemplateContext): any {
    return {
      grammar,
      grammarName: grammar.name,
      interfaces: this.extractInterfaces(grammar),
      types: this.extractTypes(grammar),
      enums: this.extractEnums(grammar),
      constants: this.extractConstants(grammar),
      ...context.data
    };
  }

  private extractInterfaces(grammar: Grammar): any[] {
    const interfaces: any[] = [];
    
    if (grammar.interfaces) {
      for (const iface of grammar.interfaces) {
        interfaces.push({
          name: iface.name,
          properties: iface.attributes || [],
          superTypes: iface.superTypes?.map((st: any) => st.ref?.name) || [],
          isNode: this.isNodeType(iface.name),
          isEdge: this.isEdgeType(iface.name),
          documentation: this.extractDocumentation(iface)
        });
      }
    }
    
    return interfaces;
  }

  private extractTypes(grammar: Grammar): any[] {
    const types: any[] = [];
    
    if (grammar.types) {
      for (const type of grammar.types) {
        types.push({
          name: type.name,
          definition: type.type,
          isUnion: type.type?.$type === 'UnionType',
          isLiteral: type.type?.$type === 'SimpleType' && (type.type as any).primitiveType === 'string',
          documentation: this.extractDocumentation(type)
        });
      }
    }
    
    return types;
  }

  private extractEnums(grammar: Grammar): any[] {
    const enums: any[] = [];
    
    // Extract enum-like types (union of string literals)
    if (grammar.types) {
      for (const type of grammar.types) {
        if (type.type?.$type === 'UnionType') {
          const unionType = type.type as any;
          const allLiterals = unionType.types?.every((t: any) => 
            t.$type === 'StringType' || t.$type === 'LiteralType'
          );
          
          if (allLiterals) {
            enums.push({
              name: type.name,
              values: unionType.types.map((t: any) => ({
                name: this.toConstantCase(t.value || t.literal || 'UNKNOWN'),
                value: t.value || t.literal || 'unknown'
              }))
            });
          }
        }
      }
    }
    
    return enums;
  }

  private extractConstants(grammar: Grammar): any[] {
    const constants: any[] = [];
    
    // Extract common constants from grammar patterns
    constants.push({
      name: 'DEFAULT_NODE_SIZE',
      value: '{ width: 100, height: 50 }',
      type: 'Dimension'
    });
    
    constants.push({
      name: 'DEFAULT_EDGE_TYPE',
      value: `'edge:straight'`,
      type: 'string'
    });
    
    constants.push({
      name: 'DIAGRAM_TYPE',
      value: `'${(grammar.name || 'untitled').toLowerCase()}-diagram'`,
      type: 'string'
    });
    
    return constants;
  }

  private async renderTemplate(templateName: string, data: any): Promise<string | null> {
    try {
      const templatePath = `common/${templateName}.hbs`;
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

  private async generateModelInterfaces(grammar: Grammar, data: any): Promise<string> {
    const template = `/**
 * Model type definitions for {{grammar.name}}
 * @module common/model-types
 */

import { SModelElement, SNode, SEdge, SGraph } from '@eclipse-glsp/protocol';

// Base types
export const DIAGRAM_TYPE = '{{toLowerCase grammar.name}}-diagram';

{{#each interfaces}}
/**
 * {{#if documentation}}{{documentation}}{{else}}{{name}} interface{{/if}}
 */
export interface {{name}}{{#if superTypes}} extends {{join superTypes ", "}}{{else if isNode}} extends SNode{{else if isEdge}} extends SEdge{{/if}} {
  {{#if (and (not superTypes) (or isNode isEdge))}}
  type: '{{#if isNode}}node{{else}}edge{{/if}}:{{toLowerCase name}}';
  {{/if}}
  {{#each properties}}
  {{name}}{{#if (isOptional this)}}?{{/if}}: {{getPropertyType this}};
  {{/each}}
}

{{/each}}

{{#each types}}
/**
 * {{#if documentation}}{{documentation}}{{else}}{{name}} type{{/if}}
 */
export type {{name}} = {{getPropertyType definition}};

{{/each}}

{{#each enums}}
/**
 * {{name}} enumeration
 */
export enum {{name}} {
  {{#each values}}
  {{name}} = '{{value}}',
  {{/each}}
}

{{/each}}

// Type guards
{{#each interfaces}}
{{#if (or isNode isEdge)}}
export function is{{name}}(element: SModelElement): element is {{name}} {
  return element.type === '{{#if isNode}}node{{else}}edge{{/if}}:{{toLowerCase name}}';
}
{{/if}}

{{/each}}

// Model factory types
export interface {{grammar.name}}ModelFactory {
  {{#each interfaces}}
  {{#if isNode}}
  create{{name}}(properties?: Partial<{{name}}>): {{name}};
  {{/if}}
  {{/each}}
  {{#each interfaces}}
  {{#if isEdge}}
  create{{name}}(sourceId: string, targetId: string, properties?: Partial<{{name}}>): {{name}};
  {{/if}}
  {{/each}}
}`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private async generateProtocol(grammar: Grammar, data: any): Promise<string> {
    const template = `/**
 * Protocol definitions for {{grammar.name}}
 * @module common/protocol
 */

import { RequestAction, ResponseAction, Operation } from '@eclipse-glsp/protocol';

// Action kinds
export namespace {{grammar.name}}ActionKind {
  export const REQUEST_MODEL = '{{toLowerCase grammar.name}}.requestModel';
  export const SET_MODEL = '{{toLowerCase grammar.name}}.setModel';
  export const UPDATE_MODEL = '{{toLowerCase grammar.name}}.updateModel';
  export const VALIDATE_MODEL = '{{toLowerCase grammar.name}}.validateModel';
  export const SAVE_MODEL = '{{toLowerCase grammar.name}}.saveModel';
}

// Request actions
export interface Request{{grammar.name}}ModelAction extends RequestAction {
  kind: typeof {{grammar.name}}ActionKind.REQUEST_MODEL;
  options?: {
    needsClientLayout?: boolean;
    animate?: boolean;
  };
}

export interface Save{{grammar.name}}ModelAction extends RequestAction {
  kind: typeof {{grammar.name}}ActionKind.SAVE_MODEL;
  fileUri?: string;
}

// Response actions
export interface Set{{grammar.name}}ModelAction extends ResponseAction {
  kind: typeof {{grammar.name}}ActionKind.SET_MODEL;
  model: any; // SGraph
  revision?: number;
}

// Operations
{{#each interfaces}}
{{#if isNode}}
export interface Create{{name}}Operation extends Operation {
  kind: 'create{{name}}';
  containerId?: string;
  location?: { x: number; y: number };
  properties?: Partial<{{name}}>;
}
{{/if}}
{{/each}}

{{#each interfaces}}
{{#if isEdge}}
export interface Create{{name}}Operation extends Operation {
  kind: 'create{{name}}';
  sourceId: string;
  targetId: string;
  properties?: Partial<{{name}}>;
}
{{/if}}
{{/each}}`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private async generateActions(grammar: Grammar, data: any): Promise<string> {
    const template = `/**
 * Action definitions for {{grammar.name}}
 * @module common/actions
 */

import { Action } from '@eclipse-glsp/protocol';
import { {{grammar.name}}ActionKind } from './protocol';

// Action creators
export function requestModel(options?: { needsClientLayout?: boolean; animate?: boolean }): Action {
  return {
    kind: {{grammar.name}}ActionKind.REQUEST_MODEL,
    options
  };
}

export function saveModel(fileUri?: string): Action {
  return {
    kind: {{grammar.name}}ActionKind.SAVE_MODEL,
    fileUri
  };
}

// Tool palette actions
export const {{grammar.name}}Tools = {
  {{#each interfaces}}
  {{#if isNode}}
  {{toUpperCase (toSnakeCase name)}}: 'tool:create-{{toKebabCase name}}',
  {{/if}}
  {{/each}}
  {{#each interfaces}}
  {{#if isEdge}}
  {{toUpperCase (toSnakeCase name)}}: 'tool:create-{{toKebabCase name}}',
  {{/if}}
  {{/each}}
  DELETE: 'tool:delete',
  MARQUEE: 'tool:marquee'
};

// Menu actions
export const {{grammar.name}}MenuActions = {
  NEW_FILE: '{{toLowerCase grammar.name}}.file.new',
  OPEN_FILE: '{{toLowerCase grammar.name}}.file.open',
  SAVE_FILE: '{{toLowerCase grammar.name}}.file.save',
  DELETE_ELEMENT: '{{toLowerCase grammar.name}}.edit.delete',
  UNDO: '{{toLowerCase grammar.name}}.edit.undo',
  REDO: '{{toLowerCase grammar.name}}.edit.redo',
  FIT_TO_SCREEN: '{{toLowerCase grammar.name}}.view.fit',
  CENTER_SELECTION: '{{toLowerCase grammar.name}}.view.center',
  EXPORT_SVG: '{{toLowerCase grammar.name}}.export.svg'
};`;
    
    return this.renderer.renderTemplate(template, data);
  }

  private isNodeType(name: string): boolean {
    const lowered = name.toLowerCase();
    return lowered.includes('node') || 
           lowered.includes('element') || 
           lowered.includes('shape') ||
           lowered.includes('vertex');
  }

  private isEdgeType(name: string): boolean {
    const lowered = name.toLowerCase();
    return lowered.includes('edge') || 
           lowered.includes('connection') || 
           lowered.includes('link') ||
           lowered.includes('relationship') ||
           lowered.includes('association');
  }

  private extractDocumentation(node: any): string | undefined {
    // TODO: Extract documentation from Langium AST nodes
    return undefined;
  }

  private getFileName(template: string): string {
    return `${template}.ts`;
  }

  private toConstantCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '')
      .replace(/[\s-]+/g, '_');
  }
}