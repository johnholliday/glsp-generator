/**
 * Simple template renderer implementation
 * @module templates/services
 */

import { injectable } from 'inversify';
import Handlebars from 'handlebars';
import { ITemplateRenderer, CompiledTemplate } from '../../core/interfaces';

/**
 * Simple Handlebars template renderer
 * Implements Single Responsibility: Template compilation and rendering
 */
@injectable()
export class SimpleTemplateRenderer implements ITemplateRenderer {
  private readonly handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
  }

  /**
   * Renders a template with data
   */
  renderTemplate(template: string, data: any): string {
    try {
      const compiled = this.handlebars.compile(template, {
        noEscape: false,
        strict: false,
        preventIndent: true
      });
      
      return compiled(data);
    } catch (error) {
      throw new Error(`Template rendering failed: ${(error as Error).message}`);
    }
  }

  /**
   * Compiles a template for reuse
   */
  compileTemplate(template: string): CompiledTemplate {
    const compiled = this.handlebars.compile(template, {
      noEscape: false,
      strict: false,
      preventIndent: true
    });

    return {
      render: (data: any) => {
        try {
          return compiled(data);
        } catch (error) {
          throw new Error(`Compiled template rendering failed: ${(error as Error).message}`);
        }
      }
    };
  }

  /**
   * Registers a helper function
   */
  registerHelper(name: string, helper: (...args: any[]) => any): void {
    this.handlebars.registerHelper(name, helper);
  }

  /**
   * Registers a partial template
   */
  registerPartial(name: string, partial: string): void {
    this.handlebars.registerPartial(name, partial);
  }

  /**
   * Unregisters a helper
   */
  unregisterHelper(name: string): void {
    this.handlebars.unregisterHelper(name);
  }

  /**
   * Unregisters a partial
   */
  unregisterPartial(name: string): void {
    this.handlebars.unregisterPartial(name);
  }
}