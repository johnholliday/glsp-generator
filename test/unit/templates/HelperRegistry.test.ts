/**
 * Unit tests for HelperRegistry
 * @module test/unit/templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HelperRegistry } from '../../../src/templates/services/HelperRegistry';
import { IHandlebarsEngine } from '../../../src/templates/interfaces/ITemplateEngine';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { MockLogger } from '../../mocks/mock-services';

describe('HelperRegistry', () => {
  let registry: HelperRegistry;
  let mockHandlebars: IHandlebarsEngine;
  let mockLogger: IStructuredLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockHandlebars = {
      compile: vi.fn(),
      registerHelper: vi.fn(),
      registerPartial: vi.fn(),
    };
    
    registry = new HelperRegistry(mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerHelpers', () => {
    it('should register all default helpers', () => {
      // Act
      registry.registerHelpers(mockHandlebars);

      // Assert
      const expectedHelpers = [
        'toLowerCase',
        'toUpperCase',
        'toPascalCase',
        'toCamelCase',
        'toKebabCase',
        'toSnakeCase',
        'capitalize',
        'pluralize',
        'singularize',
        'eq',
        'neq',
        'lt',
        'lte',
        'gt',
        'gte',
        'and',
        'or',
        'not',
        'includes',
        'hasElements',
        'isEmpty',
        'length',
        'first',
        'last',
        'join',
        'split',
        'replace',
        'trim',
        'substring',
        'padStart',
        'padEnd',
        'repeat',
        'defaultValue',
        'concat',
        'add',
        'subtract',
        'multiply',
        'divide',
        'mod',
        'round',
        'floor',
        'ceil',
        'abs',
        'min',
        'max',
        'json',
        'parseJSON',
        'keys',
        'values',
        'entries',
        'groupBy',
        'sortBy',
        'unique',
        'formatDate',
        'now',
        'timestamp',
      ];

      expect(mockHandlebars.registerHelper).toHaveBeenCalledTimes(expectedHelpers.length);
      
      for (const helperName of expectedHelpers) {
        expect(mockHandlebars.registerHelper).toHaveBeenCalledWith(
          helperName,
          expect.any(Function)
        );
      }
    });

    it('should log registration info', () => {
      // Act
      registry.registerHelpers(mockHandlebars);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Registered template helpers',
        expect.objectContaining({
          count: expect.any(Number),
        })
      );
    });
  });

  describe('string helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      
      // Extract helpers from mock calls
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should convert to lowercase', () => {
      expect(helpers.toLowerCase('HELLO WORLD')).toBe('hello world');
    });

    it('should convert to uppercase', () => {
      expect(helpers.toUpperCase('hello world')).toBe('HELLO WORLD');
    });

    it('should convert to PascalCase', () => {
      expect(helpers.toPascalCase('hello-world')).toBe('HelloWorld');
      expect(helpers.toPascalCase('hello_world')).toBe('HelloWorld');
      expect(helpers.toPascalCase('hello world')).toBe('HelloWorld');
      expect(helpers.toPascalCase('helloWorld')).toBe('HelloWorld');
    });

    it('should convert to camelCase', () => {
      expect(helpers.toCamelCase('hello-world')).toBe('helloWorld');
      expect(helpers.toCamelCase('hello_world')).toBe('helloWorld');
      expect(helpers.toCamelCase('hello world')).toBe('helloWorld');
      expect(helpers.toCamelCase('HelloWorld')).toBe('helloWorld');
    });

    it('should convert to kebab-case', () => {
      expect(helpers.toKebabCase('HelloWorld')).toBe('hello-world');
      expect(helpers.toKebabCase('helloWorld')).toBe('hello-world');
      expect(helpers.toKebabCase('hello_world')).toBe('hello-world');
      expect(helpers.toKebabCase('hello world')).toBe('hello-world');
    });

    it('should convert to snake_case', () => {
      expect(helpers.toSnakeCase('HelloWorld')).toBe('hello_world');
      expect(helpers.toSnakeCase('helloWorld')).toBe('hello_world');
      expect(helpers.toSnakeCase('hello-world')).toBe('hello_world');
      expect(helpers.toSnakeCase('hello world')).toBe('hello_world');
    });

    it('should capitalize first letter', () => {
      expect(helpers.capitalize('hello')).toBe('Hello');
      expect(helpers.capitalize('HELLO')).toBe('Hello');
      expect(helpers.capitalize('')).toBe('');
    });

    it('should pluralize words', () => {
      expect(helpers.pluralize('cat')).toBe('cats');
      expect(helpers.pluralize('dog')).toBe('dogs');
      expect(helpers.pluralize('entity')).toBe('entities');
      expect(helpers.pluralize('class')).toBe('classes');
      expect(helpers.pluralize('box')).toBe('boxes');
      expect(helpers.pluralize('church')).toBe('churches');
      expect(helpers.pluralize('leaf')).toBe('leaves');
      expect(helpers.pluralize('child')).toBe('children');
      expect(helpers.pluralize('person')).toBe('people');
      expect(helpers.pluralize('man')).toBe('men');
      expect(helpers.pluralize('woman')).toBe('women');
      expect(helpers.pluralize('mouse')).toBe('mice');
      expect(helpers.pluralize('tooth')).toBe('teeth');
      expect(helpers.pluralize('foot')).toBe('feet');
      expect(helpers.pluralize('goose')).toBe('geese');
    });

    it('should singularize words', () => {
      expect(helpers.singularize('cats')).toBe('cat');
      expect(helpers.singularize('dogs')).toBe('dog');
      expect(helpers.singularize('entities')).toBe('entity');
      expect(helpers.singularize('classes')).toBe('class');
      expect(helpers.singularize('boxes')).toBe('box');
      expect(helpers.singularize('churches')).toBe('church');
      expect(helpers.singularize('leaves')).toBe('leaf');
      expect(helpers.singularize('children')).toBe('child');
      expect(helpers.singularize('people')).toBe('person');
      expect(helpers.singularize('men')).toBe('man');
      expect(helpers.singularize('women')).toBe('woman');
      expect(helpers.singularize('mice')).toBe('mouse');
      expect(helpers.singularize('teeth')).toBe('tooth');
      expect(helpers.singularize('feet')).toBe('foot');
      expect(helpers.singularize('geese')).toBe('goose');
    });

    it('should handle string manipulation helpers', () => {
      expect(helpers.trim('  hello  ')).toBe('hello');
      expect(helpers.substring('hello world', 0, 5)).toBe('hello');
      expect(helpers.padStart('5', 3, '0')).toBe('005');
      expect(helpers.padEnd('hello', 8, '.')).toBe('hello...');
      expect(helpers.repeat('ha', 3)).toBe('hahaha');
      expect(helpers.replace('hello world', 'world', 'universe')).toBe('hello universe');
      expect(helpers.split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('comparison helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should handle equality comparisons', () => {
      expect(helpers.eq(5, 5)).toBe(true);
      expect(helpers.eq('hello', 'hello')).toBe(true);
      expect(helpers.eq(5, '5')).toBe(false);
      expect(helpers.neq(5, 3)).toBe(true);
      expect(helpers.neq('a', 'a')).toBe(false);
    });

    it('should handle numeric comparisons', () => {
      expect(helpers.lt(3, 5)).toBe(true);
      expect(helpers.lt(5, 3)).toBe(false);
      expect(helpers.lte(3, 3)).toBe(true);
      expect(helpers.lte(3, 2)).toBe(false);
      expect(helpers.gt(5, 3)).toBe(true);
      expect(helpers.gt(3, 5)).toBe(false);
      expect(helpers.gte(3, 3)).toBe(true);
      expect(helpers.gte(2, 3)).toBe(false);
    });

    it('should handle logical operations', () => {
      expect(helpers.and(true, true)).toBe(true);
      expect(helpers.and(true, false)).toBe(false);
      expect(helpers.and(1, 'yes')).toBe(true);
      expect(helpers.and(0, 'yes')).toBe(false);
      
      expect(helpers.or(true, false)).toBe(true);
      expect(helpers.or(false, false)).toBe(false);
      expect(helpers.or(0, '')).toBe(false);
      expect(helpers.or(0, 'yes')).toBe(true);
      
      expect(helpers.not(true)).toBe(false);
      expect(helpers.not(false)).toBe(true);
      expect(helpers.not('')).toBe(true);
      expect(helpers.not('value')).toBe(false);
    });

    it('should handle includes check', () => {
      expect(helpers.includes([1, 2, 3], 2)).toBe(true);
      expect(helpers.includes([1, 2, 3], 4)).toBe(false);
      expect(helpers.includes('hello world', 'world')).toBe(true);
      expect(helpers.includes('hello', 'world')).toBe(false);
    });
  });

  describe('array helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should check if array has elements', () => {
      expect(helpers.hasElements([1, 2, 3])).toBe(true);
      expect(helpers.hasElements([])).toBe(false);
      expect(helpers.hasElements(null)).toBe(false);
      expect(helpers.hasElements(undefined)).toBe(false);
    });

    it('should check if array is empty', () => {
      expect(helpers.isEmpty([])).toBe(true);
      expect(helpers.isEmpty([1])).toBe(false);
      expect(helpers.isEmpty('')).toBe(true);
      expect(helpers.isEmpty('hello')).toBe(false);
      expect(helpers.isEmpty({})).toBe(true);
      expect(helpers.isEmpty({ a: 1 })).toBe(false);
    });

    it('should get array length', () => {
      expect(helpers.length([1, 2, 3])).toBe(3);
      expect(helpers.length([])).toBe(0);
      expect(helpers.length('hello')).toBe(5);
      expect(helpers.length(null)).toBe(0);
    });

    it('should get first and last elements', () => {
      expect(helpers.first([1, 2, 3])).toBe(1);
      expect(helpers.first([])).toBeUndefined();
      expect(helpers.last([1, 2, 3])).toBe(3);
      expect(helpers.last([])).toBeUndefined();
    });

    it('should join array elements', () => {
      expect(helpers.join(['a', 'b', 'c'], '-')).toBe('a-b-c');
      expect(helpers.join(['hello'], ', ')).toBe('hello');
      expect(helpers.join([], ', ')).toBe('');
    });

    it('should handle array transformations', () => {
      expect(helpers.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(helpers.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      
      expect(helpers.sortBy([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
      expect(helpers.sortBy(['banana', 'apple', 'cherry'])).toEqual(['apple', 'banana', 'cherry']);
      
      const users = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 30 },
      ];
      
      const grouped = helpers.groupBy(users, 'age');
      expect(grouped[25]).toHaveLength(1);
      expect(grouped[30]).toHaveLength(2);
    });
  });

  describe('math helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should perform basic arithmetic', () => {
      expect(helpers.add(5, 3)).toBe(8);
      expect(helpers.subtract(10, 4)).toBe(6);
      expect(helpers.multiply(3, 7)).toBe(21);
      expect(helpers.divide(20, 4)).toBe(5);
      expect(helpers.mod(10, 3)).toBe(1);
    });

    it('should handle rounding operations', () => {
      expect(helpers.round(3.7)).toBe(4);
      expect(helpers.round(3.2)).toBe(3);
      expect(helpers.floor(3.9)).toBe(3);
      expect(helpers.ceil(3.1)).toBe(4);
    });

    it('should handle other math operations', () => {
      expect(helpers.abs(-5)).toBe(5);
      expect(helpers.abs(5)).toBe(5);
      expect(helpers.min(3, 7, 1, 9)).toBe(1);
      expect(helpers.max(3, 7, 1, 9)).toBe(9);
    });
  });

  describe('object helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should convert to/from JSON', () => {
      const obj = { name: 'John', age: 30 };
      const json = helpers.json(obj);
      expect(json).toBe('{"name":"John","age":30}');
      
      const parsed = helpers.parseJSON(json);
      expect(parsed).toEqual(obj);
    });

    it('should get object keys, values, and entries', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(helpers.keys(obj)).toEqual(['a', 'b', 'c']);
      expect(helpers.values(obj)).toEqual([1, 2, 3]);
      expect(helpers.entries(obj)).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });
  });

  describe('utility helpers', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should provide default values', () => {
      expect(helpers.defaultValue(null, 'default')).toBe('default');
      expect(helpers.defaultValue(undefined, 'default')).toBe('default');
      expect(helpers.defaultValue('', 'default')).toBe('default');
      expect(helpers.defaultValue('value', 'default')).toBe('value');
      expect(helpers.defaultValue(0, 'default')).toBe(0);
      expect(helpers.defaultValue(false, 'default')).toBe(false);
    });

    it('should concatenate values', () => {
      expect(helpers.concat('Hello', ' ', 'World')).toBe('Hello World');
      expect(helpers.concat('a', 'b', 'c', 'd')).toBe('abcd');
    });

    it('should handle date formatting', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(helpers.formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(helpers.formatDate(date, 'HH:mm:ss')).toMatch(/\d{2}:\d{2}:\d{2}/);
      
      const now = helpers.now();
      expect(now).toBeInstanceOf(Date);
      
      const timestamp = helpers.timestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('getHelper', () => {
    it('should retrieve registered helper', () => {
      // Arrange
      registry.registerHelpers(mockHandlebars);

      // Act
      const helper = registry.getHelper('toLowerCase');

      // Assert
      expect(helper).toBeDefined();
      expect(typeof helper).toBe('function');
      expect(helper('HELLO')).toBe('hello');
    });

    it('should return undefined for non-existent helper', () => {
      // Act
      const helper = registry.getHelper('nonExistent');

      // Assert
      expect(helper).toBeUndefined();
    });
  });

  describe('hasHelper', () => {
    it('should return true for registered helper', () => {
      // Arrange
      registry.registerHelpers(mockHandlebars);

      // Act & Assert
      expect(registry.hasHelper('toLowerCase')).toBe(true);
      expect(registry.hasHelper('toPascalCase')).toBe(true);
    });

    it('should return false for non-registered helper', () => {
      // Act & Assert
      expect(registry.hasHelper('nonExistent')).toBe(false);
    });
  });

  describe('getAllHelpers', () => {
    it('should return all registered helpers', () => {
      // Arrange
      registry.registerHelpers(mockHandlebars);

      // Act
      const allHelpers = registry.getAllHelpers();

      // Assert
      expect(Object.keys(allHelpers).length).toBeGreaterThan(50);
      expect(allHelpers).toHaveProperty('toLowerCase');
      expect(allHelpers).toHaveProperty('toPascalCase');
      expect(allHelpers).toHaveProperty('eq');
      expect(allHelpers).toHaveProperty('hasElements');
    });
  });

  describe('clearHelpers', () => {
    it('should clear all registered helpers', () => {
      // Arrange
      registry.registerHelpers(mockHandlebars);
      expect(registry.hasHelper('toLowerCase')).toBe(true);

      // Act
      registry.clearHelpers();

      // Assert
      expect(registry.hasHelper('toLowerCase')).toBe(false);
      expect(Object.keys(registry.getAllHelpers()).length).toBe(0);
    });
  });

  describe('edge cases', () => {
    let helpers: Record<string, Function>;

    beforeEach(() => {
      registry.registerHelpers(mockHandlebars);
      helpers = {};
      (mockHandlebars.registerHelper as any).mock.calls.forEach((call: any[]) => {
        helpers[call[0]] = call[1];
      });
    });

    it('should handle null and undefined gracefully', () => {
      expect(helpers.toLowerCase(null)).toBe('');
      expect(helpers.toLowerCase(undefined)).toBe('');
      expect(helpers.length(null)).toBe(0);
      expect(helpers.length(undefined)).toBe(0);
      expect(helpers.hasElements(null)).toBe(false);
      expect(helpers.hasElements(undefined)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(helpers.toPascalCase('')).toBe('');
      expect(helpers.toCamelCase('')).toBe('');
      expect(helpers.toKebabCase('')).toBe('');
      expect(helpers.capitalize('')).toBe('');
    });

    it('should handle edge case pluralization', () => {
      expect(helpers.pluralize('fish')).toBe('fish'); // Same singular and plural
      expect(helpers.pluralize('sheep')).toBe('sheep');
      expect(helpers.pluralize('series')).toBe('series');
      expect(helpers.pluralize('species')).toBe('species');
    });
  });
});