/**
 * Handlebars helper registry implementation
 * @module templates/services
 */

import { injectable } from 'inversify';
import { IHelperRegistry } from '../../core/interfaces';

/**
 * Registry for Handlebars template helpers
 * Implements Single Responsibility: Helper function management
 */
@injectable()
export class HelperRegistry implements IHelperRegistry {
  private readonly helpers = new Map<string, (...args: any[]) => any>();

  constructor() {
    this.registerBuiltInHelpers();
  }

  /**
   * Registers a template helper
   */
  registerHelper(name: string, helper: (...args: any[]) => any): void {
    this.helpers.set(name, helper);
  }

  /**
   * Gets a registered helper
   */
  getHelper(name: string): ((...args: any[]) => any) | undefined {
    return this.helpers.get(name);
  }

  /**
   * Lists all registered helpers
   */
  listHelpers(): string[] {
    return Array.from(this.helpers.keys());
  }

  /**
   * Unregisters a helper
   */
  unregisterHelper(name: string): void {
    this.helpers.delete(name);
  }

  /**
   * Private helper methods
   */
  private registerBuiltInHelpers(): void {
    // String manipulation helpers
    this.registerHelper('toLowerCase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    this.registerHelper('toUpperCase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    this.registerHelper('toPascalCase', (str: string) => {
      if (typeof str !== 'string') return '';
      
      return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });

    this.registerHelper('toCamelCase', (str: string) => {
      if (typeof str !== 'string') return '';
      
      const pascal = str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
      
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    this.registerHelper('toKebabCase', (str: string) => {
      if (typeof str !== 'string') return '';
      
      return str
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/[-_\s]+/g, '-');
    });

    this.registerHelper('toSnakeCase', (str: string) => {
      if (typeof str !== 'string') return '';
      
      return str
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/[-_\s]+/g, '_');
    });

    // Collection helpers
    this.registerHelper('hasElements', (array: any[]) => {
      return Array.isArray(array) && array.length > 0;
    });

    this.registerHelper('join', (array: any[], separator: string) => {
      if (!Array.isArray(array)) return '';
      return array.join(separator || ', ');
    });

    this.registerHelper('first', (array: any[]) => {
      return Array.isArray(array) ? array[0] : undefined;
    });

    this.registerHelper('last', (array: any[]) => {
      return Array.isArray(array) ? array[array.length - 1] : undefined;
    });

    this.registerHelper('includes', (str: string, substring: string) => {
      if (typeof str !== 'string') return false;
      return str.includes(substring);
    });

    // Logical helpers
    this.registerHelper('eq', (a: any, b: any) => a === b);
    this.registerHelper('neq', (a: any, b: any) => a !== b);
    this.registerHelper('lt', (a: any, b: any) => a < b);
    this.registerHelper('lte', (a: any, b: any) => a <= b);
    this.registerHelper('gt', (a: any, b: any) => a > b);
    this.registerHelper('gte', (a: any, b: any) => a >= b);
    
    this.registerHelper('and', (...args: any[]) => {
      // Remove last argument (Handlebars options)
      const values = args.slice(0, -1);
      return values.every(v => !!v);
    });

    this.registerHelper('or', (...args: any[]) => {
      // Remove last argument (Handlebars options)
      const values = args.slice(0, -1);
      return values.some(v => !!v);
    });

    this.registerHelper('not', (value: any) => !value);

    // Type checking helpers
    this.registerHelper('isString', (value: any) => typeof value === 'string');
    this.registerHelper('isNumber', (value: any) => typeof value === 'number');
    this.registerHelper('isBoolean', (value: any) => typeof value === 'boolean');
    this.registerHelper('isArray', (value: any) => Array.isArray(value));
    this.registerHelper('isObject', (value: any) => 
      value !== null && typeof value === 'object' && !Array.isArray(value)
    );

    // Block helpers
    this.registerHelper('unless', function(this: any, condition: any, options: any) {
      if (!condition) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    this.registerHelper('with', function(this: any, context: any, options: any) {
      if (context) {
        return options.fn(context);
      }
      return options.inverse(this);
    });

    // Math helpers
    this.registerHelper('add', (a: number, b: number) => {
      return (Number(a) || 0) + (Number(b) || 0);
    });

    this.registerHelper('subtract', (a: number, b: number) => {
      return (Number(a) || 0) - (Number(b) || 0);
    });

    this.registerHelper('multiply', (a: number, b: number) => {
      return (Number(a) || 0) * (Number(b) || 0);
    });

    this.registerHelper('divide', (a: number, b: number) => {
      const divisor = Number(b) || 1;
      return (Number(a) || 0) / divisor;
    });

    // JSON helpers
    this.registerHelper('json', (obj: any) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return '{}';
      }
    });

    this.registerHelper('jsonInline', (obj: any) => {
      try {
        return JSON.stringify(obj);
      } catch {
        return '{}';
      }
    });

    // Date helpers
    this.registerHelper('year', () => new Date().getFullYear());
    this.registerHelper('date', () => new Date().toISOString());
    
    // GLSP-specific helpers
    this.registerHelper('glspNodeType', (name: string) => {
      return `node:${(name || '').toLowerCase()}`;
    });

    this.registerHelper('glspEdgeType', (name: string) => {
      return `edge:${(name || '').toLowerCase()}`;
    });

    this.registerHelper('glspIcon', (name: string) => {
      const iconMap: Record<string, string> = {
        'task': 'fa-tasks',
        'gateway': 'fa-code-branch',
        'event': 'fa-circle',
        'process': 'fa-cogs',
        'data': 'fa-database',
        'default': 'fa-square'
      };
      
      const key = (name || '').toLowerCase();
      return iconMap[key] || iconMap.default;
    });
  }
}