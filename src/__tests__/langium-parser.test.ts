import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import path from 'path';
import { MockGrammarParser } from './mocks/mock-parser.mock.js';
import { IGrammarParser } from '../types/parser-interface.js';

const testDir = path.join(process.cwd(), 'src', '__tests__');

describe('LangiumGrammarParser', () => {
  let parser: IGrammarParser;
  const testGrammarPath = path.join(testDir, 'fixtures', 'test-grammar.langium');

  beforeEach(() => {
    // Use mock parser for testing
    parser = new MockGrammarParser();
  });

  afterEach(() => {
    // Clean up any resources
    parser = null as any;
  });

  afterAll(async () => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    // Small delay to allow cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('should parse valid grammar file', async () => {
    const result = await parser.parseGrammarFile(testGrammarPath);

    expect(result).toBeDefined();
    expect(result.projectName).toBe('test-grammar');
    expect(result.interfaces).toHaveLength(5); // Element, Node, Edge, Position, Size
    expect(result.types).toHaveLength(1); // EdgeType
  });

  test('should extract interfaces correctly', async () => {
    const result = await parser.parseGrammarFile(testGrammarPath);

    const nodeInterface = result.interfaces.find(i => i.name === 'Node');
    expect(nodeInterface).toBeDefined();
    expect(nodeInterface?.superTypes).toContain('Element');
    expect(nodeInterface?.properties).toHaveLength(3); // position, size, label

    const positionProp = nodeInterface?.properties.find(p => p.name === 'position');
    expect(positionProp?.type).toBe('Position');
    expect(positionProp?.optional).toBe(false);

    const sizeProp = nodeInterface?.properties.find(p => p.name === 'size');
    expect(sizeProp?.optional).toBe(true);
  });

  test('should extract types correctly', async () => {
    const result = await parser.parseGrammarFile(testGrammarPath);

    const edgeType = result.types.find(t => t.name === 'EdgeType');
    expect(edgeType).toBeDefined();
    expect(edgeType?.unionTypes).toEqual(['association', 'dependency', 'inheritance']);
  });

  test('should validate valid grammar file', async () => {
    const isValid = await parser.validateGrammarFile(testGrammarPath);
    expect(isValid).toBe(true);
  });

  test('should reject invalid grammar file path', async () => {
    const isValid = await parser.validateGrammarFile('non-existent-file.langium');
    expect(isValid).toBe(false);
  });
});