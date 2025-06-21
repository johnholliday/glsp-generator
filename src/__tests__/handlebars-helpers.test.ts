import { describe, test, expect } from '@jest/globals';
import Handlebars from 'handlebars';

// Re-register helpers for testing
Handlebars.registerHelper('toLowerCase', (str: string) => str.toLowerCase());
Handlebars.registerHelper('toPascalCase', (str: string) => 
  str.charAt(0).toUpperCase() + str.slice(1)
);
Handlebars.registerHelper('toCamelCase', (str: string) => 
  str.charAt(0).toLowerCase() + str.slice(1)
);
Handlebars.registerHelper('hasElements', (arr: any[]) => arr && arr.length > 0);
Handlebars.registerHelper('join', (arr: any[], separator: string) => 
  arr ? arr.join(separator) : ''
);
Handlebars.registerHelper('tsType', (type: string, optional: boolean, array: boolean) => {
  let tsType = type;
  if (array) tsType += '[]';
  if (optional) tsType += ' | undefined';
  return tsType;
});

describe('Handlebars Helpers', () => {
  test('toLowerCase helper should convert string to lowercase', () => {
    const template = Handlebars.compile('{{toLowerCase name}}');
    const result = template({ name: 'TestName' });
    expect(result).toBe('testname');
  });

  test('toPascalCase helper should convert string to PascalCase', () => {
    const template = Handlebars.compile('{{toPascalCase name}}');
    const result = template({ name: 'testName' });
    expect(result).toBe('TestName');
  });

  test('toCamelCase helper should convert string to camelCase', () => {
    const template = Handlebars.compile('{{toCamelCase name}}');
    const result = template({ name: 'TestName' });
    expect(result).toBe('testName');
  });

  test('hasElements helper should check if array has elements', () => {
    const template = Handlebars.compile('{{#if (hasElements items)}}has items{{else}}no items{{/if}}');
    
    const withItems = template({ items: ['a', 'b'] });
    expect(withItems).toBe('has items');
    
    const withoutItems = template({ items: [] });
    expect(withoutItems).toBe('no items');
    
    const nullItems = template({ items: null });
    expect(nullItems).toBe('no items');
  });

  test('join helper should join array elements', () => {
    const template = Handlebars.compile('{{join items ", "}}');
    const result = template({ items: ['a', 'b', 'c'] });
    expect(result).toBe('a, b, c');
  });

  test('tsType helper should generate TypeScript types', () => {
    const template = Handlebars.compile('{{tsType type optional array}}');
    
    // Basic type
    expect(template({ type: 'string', optional: false, array: false }))
      .toBe('string');
    
    // Optional type
    expect(template({ type: 'string', optional: true, array: false }))
      .toBe('string | undefined');
    
    // Array type
    expect(template({ type: 'string', optional: false, array: true }))
      .toBe('string[]');
    
    // Optional array type
    expect(template({ type: 'string', optional: true, array: true }))
      .toBe('string[] | undefined');
  });
});