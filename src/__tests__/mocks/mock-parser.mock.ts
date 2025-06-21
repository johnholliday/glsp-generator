import { IGrammarParser } from '../../types/parser-interface.js';
import { ParsedGrammar } from '../../types/grammar.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Mock parser for testing
 * Returns predefined results for known test fixtures
 */
export class MockGrammarParser implements IGrammarParser {
  async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
    const grammarContent = await fs.readFile(grammarPath, 'utf-8');
    const projectName = this.sanitizeProjectName(path.basename(grammarPath, path.extname(grammarPath)));
    
    // Return test data for test-grammar.langium
    if (grammarPath.includes('test-grammar') || grammarContent.includes('grammar TestDomain')) {
      return {
        projectName,
        interfaces: [
          {
            name: 'Element',
            properties: [
              { name: 'name', type: 'string', optional: false, array: false }
            ],
            superTypes: []
          },
          {
            name: 'Node',
            properties: [
              { name: 'position', type: 'Position', optional: false, array: false },
              { name: 'size', type: 'Size', optional: true, array: false },
              { name: 'label', type: 'string', optional: true, array: false }
            ],
            superTypes: ['Element']
          },
          {
            name: 'Edge',
            properties: [
              { name: 'source', type: 'Node', optional: false, array: false },
              { name: 'target', type: 'Node', optional: false, array: false },
              { name: 'type', type: 'EdgeType', optional: false, array: false }
            ],
            superTypes: ['Element']
          },
          {
            name: 'Position',
            properties: [
              { name: 'x', type: 'number', optional: false, array: false },
              { name: 'y', type: 'number', optional: false, array: false }
            ],
            superTypes: []
          },
          {
            name: 'Size',
            properties: [
              { name: 'width', type: 'number', optional: false, array: false },
              { name: 'height', type: 'number', optional: false, array: false }
            ],
            superTypes: []
          }
        ],
        types: [
          {
            name: 'EdgeType',
            definition: "'association' | 'dependency' | 'inheritance'",
            unionTypes: ['association', 'dependency', 'inheritance']
          }
        ]
      };
    }
    
    // Default empty result
    return {
      projectName,
      interfaces: [],
      types: []
    };
  }

  async parseGrammar(grammarContent: string): Promise<any> {
    if (!grammarContent || grammarContent.trim().length === 0) {
      throw new Error('Empty grammar content');
    }
    
    return {
      $type: 'Grammar',
      name: 'MockGrammar',
      rules: [],
      interfaces: [],
      types: []
    };
  }

  async validateGrammarFile(grammarPath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(grammarPath, 'utf-8');
      return !!(content && content.trim().length > 0);
    } catch {
      return false;
    }
  }

  private sanitizeProjectName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }
}