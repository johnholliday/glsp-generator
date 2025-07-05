/**
 * Template engine interfaces following Interface Segregation Principle
 * @module core/interfaces
 * @remarks
 * This module provides interfaces for the template rendering system.
 * All template operations work directly with Langium Grammar AST objects.
 */

import { Grammar } from 'langium';
import { GeneratedFile, TemplateContext, RenderOptions } from '../models';

/**
 * Core template engine interface
 * @interface ITemplateEngine
 * @public
 * @remarks
 * The main interface for template rendering operations.
 * Implementations should support multiple template strategies
 * and work directly with Langium Grammar objects.
 */
export interface ITemplateEngine {
  /**
   * Renders templates for a Langium Grammar
   * @param grammar - Langium Grammar AST to render templates for
   * @param context - Template context containing configuration and metadata
   * @param options - Optional rendering configuration
   * @returns Promise resolving to array of generated files
   * 
   * @remarks
   * This method orchestrates the entire template rendering process:
   * - Loads appropriate templates based on context
   * - Prepares template data from the Grammar AST
   * - Renders templates using the configured engine
   * - Returns file content ready to be written
   * 
   * @example
   * Basic rendering:
   * ```typescript
   * const files = await engine.render(grammar, {
   *   targetDir: './output',
   *   templates: ['browser', 'server']
   * });
   * 
   * // Write files to disk
   * for (const file of files) {
   *   await fs.writeFile(file.path, file.content);
   * }
   * ```
   * 
   * @example
   * Advanced rendering with options:
   * ```typescript
   * const files = await engine.render(grammar, 
   *   {
   *     targetDir: './generated',
   *     templates: ['browser', 'server', 'common'],
   *     packageName: '@company/my-glsp-extension',
   *     version: '1.0.0'
   *   },
   *   {
   *     skipValidation: false,
   *     useCache: true,
   *     helpers: customHelpers
   *   }
   * );
   * ```
   */
  render(grammar: Grammar, context: TemplateContext, options?: RenderOptions): Promise<GeneratedFile[]>;
}

/**
 * Template loader interface for template file management
 * @interface ITemplateLoader
 * @public
 * @remarks
 * Handles loading and discovery of template files.
 * Implementations may load from filesystem, embedded resources,
 * or remote sources.
 */
export interface ITemplateLoader {
  /**
   * Loads a template by name
   * @param name - Template name or path
   * @returns Promise resolving to template content
   * @throws {@link TemplateNotFoundError} When template doesn't exist
   * 
   * @remarks
   * Template names can be:
   * - Simple names: 'model-factory' (resolved from template directory)
   * - Category paths: 'browser/frontend-module'
   * - Full paths: '/custom/templates/my-template.hbs'
   * 
   * @example
   * ```typescript
   * // Load by name
   * const template = await loader.loadTemplate('model-factory');
   * 
   * // Load from category
   * const browserTemplate = await loader.loadTemplate('browser/diagram-config');
   * ```
   */
  loadTemplate(name: string): Promise<string>;

  /**
   * Lists available templates
   * @param category - Optional category to filter by
   * @returns Promise resolving to array of template names
   * 
   * @remarks
   * Categories typically include:
   * - 'browser' - Client-side templates
   * - 'server' - Server-side templates
   * - 'common' - Shared templates
   * 
   * @example
   * ```typescript
   * // List all templates
   * const all = await loader.listTemplates();
   * 
   * // List browser templates only
   * const browserTemplates = await loader.listTemplates('browser');
   * console.log(browserTemplates);
   * // ['diagram-config', 'frontend-module', 'command-contribution']
   * ```
   */
  listTemplates(category?: string): Promise<string[]>;

  /**
   * Checks if template exists
   * @param name - Template name to check
   * @returns Promise resolving to true if template exists
   * 
   * @example
   * ```typescript
   * if (await loader.templateExists('custom-template')) {
   *   const content = await loader.loadTemplate('custom-template');
   * }
   * ```
   */
  templateExists(name: string): Promise<boolean>;
}

/**
 * Template renderer interface for actual rendering
 * @interface ITemplateRenderer
 * @public
 * @remarks
 * Handles the actual template rendering process.
 * Implementations typically wrap template engines like Handlebars,
 * EJS, or custom template systems.
 */
export interface ITemplateRenderer {
  /**
   * Renders a template with data
   * @param template - Template content string
   * @param data - Data object to render with
   * @returns Rendered content as string
   * 
   * @remarks
   * This method performs one-time rendering.
   * For repeated rendering of the same template,
   * use {@link compileTemplate} for better performance.
   * 
   * @example
   * ```typescript
   * const template = '{{#each interfaces}}interface {{name}} { }{{/each}}';
   * const rendered = renderer.renderTemplate(template, {
   *   interfaces: [
   *     { name: 'Node' },
   *     { name: 'Edge' }
   *   ]
   * });
   * // Result: 'interface Node { }interface Edge { }'
   * ```
   */
  renderTemplate(template: string, data: any): string;

  /**
   * Compiles a template for reuse
   * @param template - Template content to compile
   * @returns Compiled template for repeated rendering
   * 
   * @remarks
   * Compilation parses the template once and creates
   * an optimized function for repeated rendering.
   * Use this when rendering the same template multiple times.
   * 
   * @example
   * ```typescript
   * const template = 'Hello {{name}}!';
   * const compiled = renderer.compileTemplate(template);
   * 
   * // Render multiple times efficiently
   * console.log(compiled.render({ name: 'Alice' })); // 'Hello Alice!'
   * console.log(compiled.render({ name: 'Bob' }));   // 'Hello Bob!'
   * ```
   */
  compileTemplate(template: string): CompiledTemplate;
}

/**
 * Compiled template interface
 * @interface CompiledTemplate
 * @public
 * @remarks
 * Represents a pre-compiled template ready for efficient rendering.
 * Implementations cache the parsed template structure for performance.
 */
export interface CompiledTemplate {
  /**
   * Renders the compiled template with data
   * @param data - Data object to render with
   * @returns Rendered content as string
   * 
   * @example
   * ```typescript
   * const result = compiledTemplate.render({
   *   title: 'My Page',
   *   items: ['one', 'two', 'three']
   * });
   * ```
   */
  render(data: any): string;
}

/**
 * Template helper registry interface
 * @interface IHelperRegistry
 * @public
 * @remarks
 * Manages template helper functions that extend template functionality.
 * Helpers are functions available within templates for data transformation
 * and logic.
 */
export interface IHelperRegistry {
  /**
   * Registers a template helper
   * @param name - Helper name used in templates
   * @param helper - Helper function implementation
   * 
   * @remarks
   * Helpers can be:
   * - Simple functions: Transform values
   * - Block helpers: Control template flow
   * - Async helpers: Perform async operations (if supported)
   * 
   * @example
   * Simple helper:
   * ```typescript
   * registry.registerHelper('uppercase', (str: string) => {
   *   return str.toUpperCase();
   * });
   * // Template: {{uppercase name}}
   * ```
   * 
   * @example
   * Block helper:
   * ```typescript
   * registry.registerHelper('repeat', function(times: number, options: any) {
   *   let result = '';
   *   for (let i = 0; i < times; i++) {
   *     result += options.fn(this);
   *   }
   *   return result;
   * });
   * // Template: {{#repeat 3}}Hello! {{/repeat}}
   * ```
   */
  registerHelper(name: string, helper: (...args: any[]) => any): void;

  /**
   * Gets a registered helper
   * @param name - Helper name to retrieve
   * @returns Helper function or undefined if not found
   * 
   * @example
   * ```typescript
   * const uppercase = registry.getHelper('uppercase');
   * if (uppercase) {
   *   console.log(uppercase('hello')); // 'HELLO'
   * }
   * ```
   */
  getHelper(name: string): ((...args: any[]) => any) | undefined;

  /**
   * Lists all registered helpers
   * @returns Array of registered helper names
   * 
   * @example
   * ```typescript
   * const helpers = registry.listHelpers();
   * console.log(helpers);
   * // ['uppercase', 'lowercase', 'pluralize', 'formatDate', ...]
   * ```
   */
  listHelpers(): string[];

  /**
   * Unregisters a helper
   * @param name - Helper name to remove
   * 
   * @example
   * ```typescript
   * registry.unregisterHelper('deprecated-helper');
   * ```
   */
  unregisterHelper(name: string): void;
}

/**
 * Template strategy interface for different rendering strategies
 * @interface ITemplateStrategy
 * @public
 * @remarks
 * Implements the Strategy pattern for template rendering.
 * Different strategies handle different types of templates
 * (e.g., browser, server, common).
 */
export interface ITemplateStrategy {
  /**
   * Strategy name
   * @remarks
   * Should be unique and descriptive (e.g., 'browser', 'server', 'common')
   */
  readonly name: string;

  /**
   * Checks if strategy can handle the template
   * @param templateName - Template name to check
   * @returns True if this strategy can handle the template
   * 
   * @remarks
   * Typically checks template name patterns or categories.
   * This enables automatic strategy selection.
   * 
   * @example
   * ```typescript
   * class BrowserStrategy implements ITemplateStrategy {
   *   canHandle(templateName: string): boolean {
   *     return templateName.startsWith('browser/') ||
   *            templateName === 'frontend-module';
   *   }
   * }
   * ```
   */
  canHandle(templateName: string): boolean;

  /**
   * Renders using this strategy
   * @param grammar - Langium Grammar AST
   * @param templateName - Template name to render
   * @param context - Template context with configuration
   * @returns Promise resolving to generated files
   * 
   * @remarks
   * Each strategy implements its own rendering logic:
   * - Load appropriate templates
   * - Prepare template data from Grammar
   * - Apply strategy-specific transformations
   * - Return generated file content
   * 
   * @example
   * ```typescript
   * async render(grammar: Grammar, templateName: string, context: TemplateContext) {
   *   const template = await this.loadTemplate(templateName);
   *   const data = this.prepareData(grammar, context);
   *   const content = this.renderTemplate(template, data);
   *   
   *   return [{
   *     path: path.join(context.targetDir, 'browser', 'output.ts'),
   *     content
   *   }];
   * }
   * ```
   */
  render(grammar: Grammar, templateName: string, context: TemplateContext): Promise<GeneratedFile[]>;
}

/**
 * Template cache interface for performance
 * @interface ITemplateCache
 * @public
 * @remarks
 * Provides caching for compiled templates to avoid repeated compilation.
 * Significantly improves performance when rendering many files with
 * the same templates.
 */
export interface ITemplateCache {
  /**
   * Gets cached compiled template
   * @param key - Cache key (typically template path or name)
   * @returns Cached compiled template or null if not found
   * 
   * @example
   * ```typescript
   * const cached = cache.get('browser/model-factory');
   * if (cached) {
   *   return cached.render(data); // Use cached compilation
   * }
   * ```
   */
  get(key: string): CompiledTemplate | null;

  /**
   * Sets compiled template in cache
   * @param key - Cache key for retrieval
   * @param template - Compiled template to cache
   * 
   * @example
   * ```typescript
   * const compiled = renderer.compileTemplate(templateContent);
   * cache.set('browser/model-factory', compiled);
   * ```
   */
  set(key: string, template: CompiledTemplate): void;

  /**
   * Clears cache
   * 
   * @remarks
   * Use when:
   * - Templates have been modified
   * - Memory pressure requires cleanup
   * - Configuration changes require recompilation
   * 
   * @example
   * ```typescript
   * // Clear cache on template directory change
   * watcher.on('change', () => {
   *   cache.clear();
   * });
   * ```
   */
  clear(): void;
}