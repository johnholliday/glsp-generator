/**
 * Unit tests for HandlebarsEngine
 * @module test/unit/templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HandlebarsEngine } from '../../../src/templates/services/HandlebarsEngine';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { MockLogger } from '../../mocks/mock-services';
import * as Handlebars from 'handlebars';

describe('HandlebarsEngine', () => {
  let engine: HandlebarsEngine;
  let mockLogger: IStructuredLogger;
  let originalHandlebars: typeof Handlebars;

  beforeEach(() => {
    mockLogger = new MockLogger();
    engine = new HandlebarsEngine(mockLogger);

    // Store original Handlebars to restore later
    originalHandlebars = { ...Handlebars };
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear any registered helpers/partials
    Handlebars.unregisterHelper('testHelper');
    Handlebars.unregisterPartial('testPartial');
  });

  describe('compile', () => {
    it('should compile a simple template', () => {
      // Arrange
      const template = 'Hello {{name}}!';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ name: 'World' });

      // Assert
      expect(result).toBe('Hello World!');
    });

    it('should compile template with conditionals', () => {
      // Arrange
      const template = '{{#if show}}Visible{{else}}Hidden{{/if}}';

      // Act
      const compiled = engine.compile(template);

      // Assert
      expect(compiled({ show: true })).toBe('Visible');
      expect(compiled({ show: false })).toBe('Hidden');
    });

    it('should compile template with loops', () => {
      // Arrange
      const template = '{{#each items}}{{this}},{{/each}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ items: ['a', 'b', 'c'] });

      // Assert
      expect(result).toBe('a,b,c,');
    });

    it('should handle nested objects', () => {
      // Arrange
      const template = '{{user.name}} - {{user.email}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      });

      // Assert
      expect(result).toBe('John - john@example.com');
    });

    it('should throw error for invalid template syntax', () => {
      // Arrange
      const invalidTemplate = '{{#if}}Missing condition{{/if}}';

      // Act & Assert
      expect(() => engine.compile(invalidTemplate)).toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to compile template',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should compile with custom options', () => {
      // Arrange
      const template = '{{! This is a comment }}{{name}}';
      const options = {
        noEscape: true,
        strict: true,
      };

      // Act
      const compiled = engine.compile(template, options);
      const result = compiled({ name: '<b>Bold</b>' });

      // Assert
      expect(result).toContain('<b>Bold</b>'); // Not escaped
    });

    it('should handle partial templates', () => {
      // Arrange
      engine.registerPartial('header', '<h1>{{title}}</h1>');
      const template = '{{> header}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ title: 'My Title' });

      // Assert
      expect(result).toBe('<h1>My Title</h1>');
    });

    it('should compile with block helpers', () => {
      // Arrange
      engine.registerHelper('bold', function(options: any) {
        return '<b>' + options.fn(this) + '</b>';
      });
      const template = '{{#bold}}Important{{/bold}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('<b>Important</b>');
    });
  });

  describe('registerHelper', () => {
    it('should register a simple helper', () => {
      // Arrange
      const helperFn = (value: string) => value.toUpperCase();

      // Act
      engine.registerHelper('uppercase', helperFn);

      // Assert
      const template = '{{uppercase name}}';
      const compiled = engine.compile(template);
      expect(compiled({ name: 'john' })).toBe('JOHN');
    });

    it('should register helper with multiple parameters', () => {
      // Arrange
      engine.registerHelper('concat', (a: string, b: string, c: string) => {
        return `${a}-${b}-${c}`;
      });

      // Act
      const template = '{{concat "one" "two" "three"}}';
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('one-two-three');
    });

    it('should register block helper', () => {
      // Arrange
      engine.registerHelper('repeat', function(times: number, options: any) {
        let result = '';
        for (let i = 0; i < times; i++) {
          result += options.fn({ index: i });
        }
        return result;
      });

      // Act
      const template = '{{#repeat 3}}Item {{index}}, {{/repeat}}';
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('Item 0, Item 1, Item 2, ');
    });

    it('should override existing helper', () => {
      // Arrange
      engine.registerHelper('test', () => 'first');
      engine.registerHelper('test', () => 'second');

      // Act
      const template = '{{test}}';
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('second');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Overriding existing helper',
        { name: 'test' }
      );
    });

    it('should handle helper errors gracefully', () => {
      // Arrange
      engine.registerHelper('failing', () => {
        throw new Error('Helper error');
      });

      // Act
      const template = '{{failing}}';
      const compiled = engine.compile(template);

      // Assert
      expect(() => compiled({})).toThrow('Helper error');
    });

    it('should access context in helper', () => {
      // Arrange
      engine.registerHelper('withContext', function(this: any) {
        return `${this.prefix}-${this.value}`;
      });

      // Act
      const template = '{{withContext}}';
      const compiled = engine.compile(template);
      const result = compiled({ prefix: 'PRE', value: 'VAL' });

      // Assert
      expect(result).toBe('PRE-VAL');
    });

    it('should register helper with options hash', () => {
      // Arrange
      engine.registerHelper('customTag', function(options: any) {
        const tag = options.hash.tag || 'div';
        const className = options.hash.class || '';
        return `<${tag} class="${className}">${options.fn(this)}</${tag}>`;
      });

      // Act
      const template = '{{#customTag tag="span" class="highlight"}}Content{{/customTag}}';
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('<span class="highlight">Content</span>');
    });
  });

  describe('registerPartial', () => {
    it('should register a simple partial', () => {
      // Arrange
      engine.registerPartial('greeting', 'Hello {{name}}!');

      // Act
      const template = '{{> greeting}}';
      const compiled = engine.compile(template);
      const result = compiled({ name: 'Alice' });

      // Assert
      expect(result).toBe('Hello Alice!');
    });

    it('should register partial with nested content', () => {
      // Arrange
      engine.registerPartial('user-card', `
<div class="user-card">
  <h3>{{user.name}}</h3>
  <p>{{user.bio}}</p>
</div>
`);

      // Act
      const template = '{{> user-card}}';
      const compiled = engine.compile(template);
      const result = compiled({
        user: {
          name: 'John Doe',
          bio: 'Software Developer',
        },
      });

      // Assert
      expect(result).toContain('<h3>John Doe</h3>');
      expect(result).toContain('<p>Software Developer</p>');
    });

    it('should use partial in loop', () => {
      // Arrange
      engine.registerPartial('item', '<li>{{name}}</li>');

      // Act
      const template = '<ul>{{#each items}}{{> item}}{{/each}}</ul>';
      const compiled = engine.compile(template);
      const result = compiled({
        items: [
          { name: 'Item 1' },
          { name: 'Item 2' },
          { name: 'Item 3' },
        ],
      });

      // Assert
      expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>');
    });

    it('should override existing partial', () => {
      // Arrange
      engine.registerPartial('test', 'First version');
      engine.registerPartial('test', 'Second version');

      // Act
      const template = '{{> test}}';
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('Second version');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Overriding existing partial',
        { name: 'test' }
      );
    });

    it('should handle missing partial gracefully', () => {
      // Arrange
      const template = '{{> nonexistent}}';

      // Act
      const compiled = engine.compile(template);

      // Assert
      expect(() => compiled({})).toThrow(/partial.*not.*found/i);
    });

    it('should support partial with parameters', () => {
      // Arrange
      engine.registerPartial('paramPartial', 'Hello {{greeting}}, {{name}}!');

      // Act
      const template = '{{> paramPartial greeting="Hi" name=username}}';
      const compiled = engine.compile(template);
      const result = compiled({ username: 'Bob' });

      // Assert
      expect(result).toBe('Hello Hi, Bob!');
    });

    it('should support dynamic partials', () => {
      // Arrange
      engine.registerPartial('partialA', 'This is A');
      engine.registerPartial('partialB', 'This is B');

      // Act
      const template = '{{> (lookup . "partialName")}}';
      const compiled = engine.compile(template);

      // Assert
      expect(compiled({ partialName: 'partialA' })).toBe('This is A');
      expect(compiled({ partialName: 'partialB' })).toBe('This is B');
    });
  });

  describe('built-in helpers', () => {
    it('should support if/else helper', () => {
      // Arrange
      const template = '{{#if loggedIn}}Welcome{{else}}Please login{{/if}}';

      // Act
      const compiled = engine.compile(template);

      // Assert
      expect(compiled({ loggedIn: true })).toBe('Welcome');
      expect(compiled({ loggedIn: false })).toBe('Please login');
    });

    it('should support unless helper', () => {
      // Arrange
      const template = '{{#unless error}}Success{{else}}Error: {{error}}{{/unless}}';

      // Act
      const compiled = engine.compile(template);

      // Assert
      expect(compiled({ error: null })).toBe('Success');
      expect(compiled({ error: 'Failed' })).toBe('Error: Failed');
    });

    it('should support each helper with array', () => {
      // Arrange
      const template = '{{#each colors}}{{@index}}: {{this}}, {{/each}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ colors: ['red', 'green', 'blue'] });

      // Assert
      expect(result).toBe('0: red, 1: green, 2: blue, ');
    });

    it('should support each helper with object', () => {
      // Arrange
      const template = '{{#each person}}{{@key}}: {{this}}, {{/each}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({
        person: {
          name: 'John',
          age: 30,
          city: 'NYC',
        },
      });

      // Assert
      expect(result).toContain('name: John');
      expect(result).toContain('age: 30');
      expect(result).toContain('city: NYC');
    });

    it('should support with helper', () => {
      // Arrange
      const template = '{{#with author}}By {{name}} ({{email}}){{/with}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({
        author: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      // Assert
      expect(result).toBe('By Jane Doe (jane@example.com)');
    });

    it('should support lookup helper', () => {
      // Arrange
      const template = '{{lookup items selectedIndex}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({
        items: ['First', 'Second', 'Third'],
        selectedIndex: 1,
      });

      // Assert
      expect(result).toBe('Second');
    });
  });

  describe('error handling', () => {
    it('should handle compilation errors', () => {
      // Arrange
      const invalidTemplate = '{{#each}}No collection{{/each}}';

      // Act & Assert
      expect(() => engine.compile(invalidTemplate)).toThrow();
    });

    it('should handle runtime errors in helpers', () => {
      // Arrange
      engine.registerHelper('errorHelper', () => {
        throw new Error('Runtime error');
      });
      const template = 'Before {{errorHelper}} After';

      // Act
      const compiled = engine.compile(template);

      // Assert
      expect(() => compiled({})).toThrow('Runtime error');
    });

    it('should handle undefined variables gracefully', () => {
      // Arrange
      const template = 'Hello {{undefinedVar}}!';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('Hello !'); // Empty string for undefined
    });

    it('should handle null values', () => {
      // Arrange
      const template = 'Value: {{nullValue}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ nullValue: null });

      // Assert
      expect(result).toBe('Value: ');
    });
  });

  describe('advanced features', () => {
    it('should support SafeString for raw HTML', () => {
      // Arrange
      engine.registerHelper('raw', (html: string) => {
        return new Handlebars.SafeString(html);
      });
      const template = '{{raw htmlContent}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ htmlContent: '<b>Bold</b>' });

      // Assert
      expect(result).toBe('<b>Bold</b>'); // Not escaped
    });

    it('should support data variables', () => {
      // Arrange
      const template = '{{#each items}}{{@index}}: {{this}} (First: {{@first}}, Last: {{@last}}){{#unless @last}}, {{/unless}}{{/each}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ items: ['A', 'B', 'C'] });

      // Assert
      expect(result).toBe('0: A (First: true, Last: false), 1: B (First: false, Last: false), 2: C (First: false, Last: true)');
    });

    it('should support nested helpers', () => {
      // Arrange
      engine.registerHelper('loud', (str: string) => str.toUpperCase());
      engine.registerHelper('exclaim', (str: string) => str + '!');
      
      const template = '{{loud (exclaim message)}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({ message: 'hello' });

      // Assert
      expect(result).toBe('HELLO!');
    });

    it('should support comments', () => {
      // Arrange
      const template = '{{! This is a comment }}Visible{{!-- This is also a comment --}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({});

      // Assert
      expect(result).toBe('Visible');
    });

    it('should support escaping', () => {
      // Arrange
      const template = '{{{unescaped}}} vs {{escaped}}';

      // Act
      const compiled = engine.compile(template);
      const result = compiled({
        unescaped: '<script>alert("XSS")</script>',
        escaped: '<script>alert("XSS")</script>',
      });

      // Assert
      expect(result).toContain('<script>alert("XSS")</script>'); // First is unescaped
      expect(result).toContain('&lt;script&gt;'); // Second is escaped
    });
  });
});