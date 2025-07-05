/**
 * Handlebars template engine implementation
 * @module templates/services
 */

import { injectable, inject, multiInject } from 'inversify';
import Handlebars from 'handlebars';
import { Grammar } from 'langium';
import { TYPES, SERVICE_IDENTIFIER } from '../../infrastructure/di/symbols';
import { 
  ITemplateEngine, 
  ITemplateLoader, 
  IHelperRegistry, 
  ITemplateStrategy,
  ITemplateCache,
  CompiledTemplate
} from '../../core/interfaces';
import { GeneratedFile, TemplateContext, RenderOptions } from '../../core/models';
import { IStructuredLogger, IPerformanceLogger } from '../../infrastructure/logging/ILogger';
import { TemplateError } from '../../infrastructure/errors/ErrorHierarchy';

/**
 * Handlebars-based template engine
 * Implements Single Responsibility: Template rendering using Handlebars
 */
@injectable()
export class HandlebarsEngine implements ITemplateEngine {
  private readonly handlebars: typeof Handlebars;

  constructor(
    @inject(TYPES.ITemplateLoader) private readonly templateLoader: ITemplateLoader,
    @inject(TYPES.IHelperRegistry) private readonly helperRegistry: IHelperRegistry,
    @inject(TYPES.ITemplateCache) private readonly cache: ITemplateCache,
    @multiInject(TYPES.ITemplateStrategy) private readonly strategies: ITemplateStrategy[],
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(TYPES.IPerformanceLogger) private readonly perfLogger: IPerformanceLogger
  ) {
    this.handlebars = Handlebars.create();
    this.initializeHelpers();
    this.logger.info('HandlebarsEngine initialized', {
      strategies: strategies.map(s => s.name)
    });
  }

  /**
   * Renders templates for a Langium Grammar
   */
  async render(
    grammar: Grammar, 
    context: TemplateContext, 
    options?: RenderOptions
  ): Promise<GeneratedFile[]> {
    const stopTimer = this.perfLogger.startTimer('template.render');
    
    try {
      this.logger.info('Starting template rendering', {
        grammar: grammar.name,
        targetDir: context.targetDir,
        templates: context.templates
      });

      const files: GeneratedFile[] = [];
      const templateCategories = context.templates || ['browser', 'server', 'common'];

      // Process each template category
      for (const category of templateCategories) {
        const strategy = this.findStrategy(category);
        if (!strategy) {
          this.logger.warn(`No strategy found for template category: ${category}`);
          continue;
        }

        const categoryFiles = await this.renderCategory(
          grammar,
          category,
          strategy,
          context,
          options
        );
        
        files.push(...categoryFiles);
      }

      // Render root-level files (package.json, etc.)
      const rootFiles = await this.renderRootFiles(grammar, context, options);
      files.push(...rootFiles);

      stopTimer();
      
      this.logger.info('Template rendering completed', {
        filesGenerated: files.length
      });

      return files;

    } catch (error) {
      stopTimer();
      throw new TemplateError(
        `Template rendering failed: ${(error as Error).message}`,
        'unknown',
        error as Error
      );
    }
  }

  /**
   * Private helper methods
   */
  private initializeHelpers(): void {
    // Register all helpers from the registry
    const helpers = this.helperRegistry.listHelpers();
    for (const name of helpers) {
      const helper = this.helperRegistry.getHelper(name);
      if (helper) {
        this.handlebars.registerHelper(name, helper);
      }
    }

    // Register built-in helpers for Langium Grammar processing
    this.registerGrammarHelpers();
  }

  private registerGrammarHelpers(): void {
    // Helper to get interface features (properties)
    this.handlebars.registerHelper('getFeatures', (iface: any) => {
      return iface.features || [];
    });

    // Helper to get property type as string
    this.handlebars.registerHelper('getPropertyType', (property: any) => {
      if (!property.type) return 'any';
      
      // Handle different type representations in Langium
      if (typeof property.type === 'string') {
        return property.type;
      }
      
      if (property.type.$type) {
        // Handle complex types
        switch (property.type.$type) {
          case 'SimpleType':
            return property.type.typeRef?.ref?.name || 'any';
          case 'ArrayType':
            return `${this.getTypeString(property.type.elementType)}[]`;
          case 'UnionType':
            return property.type.types
              .map((t: any) => this.getTypeString(t))
              .join(' | ');
          default:
            return 'any';
        }
      }
      
      return 'any';
    });

    // Helper to check if property is optional
    this.handlebars.registerHelper('isOptional', (property: any) => {
      return property.optional || false;
    });

    // Helper to check if property is an array
    this.handlebars.registerHelper('isArray', (property: any) => {
      return property.type?.$type === 'ArrayType';
    });

    // Helper to check if property is a reference
    this.handlebars.registerHelper('isReference', (property: any) => {
      return property.type?.$type === 'CrossReference';
    });

    // Helper to get rule return type
    this.handlebars.registerHelper('getRuleType', (rule: any) => {
      if (rule.returnType) {
        return this.getTypeString(rule.returnType);
      }
      if (rule.infers) {
        return rule.infers.name;
      }
      return rule.name;
    });

    // Helper to filter entry rules
    this.handlebars.registerHelper('entryRules', (rules: any[]) => {
      return rules.filter(r => r.entry);
    });

    // Helper to get super interfaces
    this.handlebars.registerHelper('getSuperTypes', (iface: any) => {
      if (!iface.superTypes || iface.superTypes.length === 0) {
        return [];
      }
      return iface.superTypes.map((st: any) => st.ref?.name || st).filter(Boolean);
    });
  }

  private getTypeString(type: any): string {
    if (!type) return 'any';
    
    if (typeof type === 'string') return type;
    
    switch (type.$type) {
      case 'SimpleType':
        return type.typeRef?.ref?.name || 'any';
      case 'ArrayType':
        return `${this.getTypeString(type.elementType)}[]`;
      case 'UnionType':
        return type.types.map((t: any) => this.getTypeString(t)).join(' | ');
      case 'CrossReference':
        return type.type?.ref?.name || 'any';
      default:
        return 'any';
    }
  }

  private findStrategy(category: string): ITemplateStrategy | undefined {
    return this.strategies.find(s => s.canHandle(category));
  }

  private async renderCategory(
    grammar: Grammar,
    category: string,
    strategy: ITemplateStrategy,
    context: TemplateContext,
    options?: RenderOptions
  ): Promise<GeneratedFile[]> {
    try {
      const files = await strategy.render(grammar, category, context);
      
      // Apply render options
      if (options) {
        return files.map(file => this.applyRenderOptions(file, options));
      }
      
      return files;
    } catch (error) {
      throw new TemplateError(
        `Failed to render ${category} templates: ${(error as Error).message}`,
        category,
        error as Error
      );
    }
  }

  private async renderRootFiles(
    grammar: Grammar,
    context: TemplateContext,
    options?: RenderOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // Render package.json
    const packageJson = await this.renderTemplate(
      'package.json',
      {
        name: `@${context.data?.scope || 'example'}/${(grammar.name || 'untitled').toLowerCase()}-glsp`,
        displayName: `${grammar.name || 'Untitled'} GLSP Extension`,
        grammar,
        ...context.data
      }
    );
    
    if (packageJson) {
      files.push({
        path: 'package.json',
        content: packageJson,
        encoding: 'utf-8'
      });
    }
    
    // Render tsconfig.json
    const tsconfig = await this.renderTemplate('tsconfig.json', { grammar });
    if (tsconfig) {
      files.push({
        path: 'tsconfig.json',
        content: tsconfig,
        encoding: 'utf-8'
      });
    }
    
    // Render README.md
    const readme = await this.renderTemplate('README.md', { 
      grammar,
      name: grammar.name,
      ...context.data
    });
    if (readme) {
      files.push({
        path: 'README.md',
        content: readme,
        encoding: 'utf-8'
      });
    }
    
    return files.map(file => 
      options ? this.applyRenderOptions(file, options) : file
    );
  }

  private async renderTemplate(
    templateName: string, 
    data: any
  ): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = `template:${templateName}`;
      let compiled = this.cache.get(cacheKey);
      
      if (!compiled) {
        // Load and compile template
        const templateContent = await this.templateLoader.loadTemplate(templateName);
        const template = this.handlebars.compile(templateContent, {
          noEscape: false,
          strict: true
        });
        
        // Create compiled template wrapper
        compiled = {
          render: (context: any) => template(context)
        };
        
        // Cache the compiled template
        this.cache.set(cacheKey, compiled);
      }
      
      // Render the template
      return compiled.render(data);
      
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}`, error as Error);
      return null;
    }
  }

  private applyRenderOptions(
    file: GeneratedFile, 
    options: RenderOptions
  ): GeneratedFile {
    let content = file.content;
    
    // Apply pretty printing
    if (options.prettyPrint && file.path.endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        content = JSON.stringify(parsed, null, options.indent || 2);
      } catch {
        // Not valid JSON, skip pretty printing
      }
    }
    
    // Apply line endings
    if (options.lineEndings && options.lineEndings !== 'auto') {
      const lineEnding = options.lineEndings === 'crlf' ? '\r\n' : '\n';
      content = content.replace(/\r?\n/g, lineEnding);
    }
    
    return {
      ...file,
      content
    };
  }
}