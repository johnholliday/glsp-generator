/**
 * Unit tests for CommonStrategy
 * @module test/unit/templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Grammar } from 'langium';
import { CommonStrategy } from '../../../src/templates/strategies/CommonStrategy';
import { IHandlebarsEngine } from '../../../src/templates/interfaces/ITemplateEngine';
import { IHelperRegistry } from '../../../src/templates/interfaces/IHelperRegistry';
import { IFileSystem } from '../../../src/infrastructure/filesystem/IFileSystem';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { GenerationConfig } from '../../../src/core/interfaces/IGenerator';
import { MockFileSystem, MockLogger } from '../../mocks/mock-services';

describe('CommonStrategy', () => {
  let strategy: CommonStrategy;
  let mockHandlebars: IHandlebarsEngine;
  let mockHelperRegistry: IHelperRegistry;
  let mockFileSystem: IFileSystem;
  let mockLogger: IStructuredLogger;
  let mockGrammar: Grammar;

  beforeEach(() => {
    // Create mocks
    mockHandlebars = {
      compile: vi.fn().mockReturnValue((context: any) => `Rendered: ${JSON.stringify(context)}`),
      registerHelper: vi.fn(),
      registerPartial: vi.fn(),
    };

    mockHelperRegistry = {
      registerHelpers: vi.fn(),
      getHelper: vi.fn(),
      getAllHelpers: vi.fn().mockReturnValue({}),
      hasHelper: vi.fn().mockReturnValue(false),
      clearHelpers: vi.fn(),
    };

    mockFileSystem = new MockFileSystem();
    mockLogger = new MockLogger();

    // Create mock grammar
    mockGrammar = {
      $type: 'Grammar',
      name: 'CommonTestGrammar',
      rules: [
        {
          $type: 'ParserRule',
          name: 'Model',
          entry: true,
          definition: { $type: 'Alternatives', elements: [] },
        },
      ],
      interfaces: [
        {
          $type: 'Interface',
          name: 'BaseNode',
          attributes: [
            {
              $type: 'Property',
              name: 'id',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
            {
              $type: 'Property',
              name: 'type',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
          ],
        },
        {
          $type: 'Interface',
          name: 'NamedElement',
          superTypes: [{ ref: 'BaseNode' }],
          attributes: [
            {
              $type: 'Property',
              name: 'name',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
            {
              $type: 'Property',
              name: 'description',
              type: { $type: 'SimpleType', primitiveType: 'string' },
              optional: true,
            },
          ],
        },
      ],
      types: [
        {
          $type: 'Type',
          name: 'ElementType',
          type: {
            $type: 'UnionType',
            types: [
              { $type: 'StringLiteral', value: 'node' },
              { $type: 'StringLiteral', value: 'edge' },
              { $type: 'StringLiteral', value: 'port' },
            ],
          },
        },
      ],
      imports: [],
    } as unknown as Grammar;

    // Create strategy
    strategy = new CommonStrategy(
      mockHandlebars,
      mockHelperRegistry,
      mockFileSystem,
      mockLogger
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getName', () => {
    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('common');
    });
  });

  describe('generate', () => {
    it('should generate common files successfully', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          packageName: 'test-common',
        },
      };

      // Set up file system with templates
      const templates = new Map([
        ['/templates/common/model-types.hbs', 'ModelTypes for {{projectName}}'],
        ['/templates/common/protocol.hbs', 'Protocol for {{projectName}}'],
        ['/templates/common/constants.hbs', 'Constants for {{projectName}}'],
        ['/templates/common/utils.hbs', 'Utils for {{projectName}}'],
      ]);

      for (const [templatePath, content] of templates) {
        await mockFileSystem.writeFile(templatePath, content);
      }

      // Mock template compilation
      mockHandlebars.compile.mockImplementation((template: string) => {
        return (context: any) => template.replace('{{projectName}}', context.projectName);
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(mockHelperRegistry.registerHelpers).toHaveBeenCalledWith(mockHandlebars);

      // Verify files were generated
      const expectedFiles = [
        '/output/common/model-types.ts',
        '/output/common/protocol.ts',
        '/output/common/constants.ts',
        '/output/common/utils.ts',
      ];

      for (const file of expectedFiles) {
        expect(await mockFileSystem.exists(file)).toBe(true);
      }

      // Verify content
      const typesContent = await mockFileSystem.readFile('/output/common/model-types.ts', 'utf-8');
      expect(typesContent).toContain('ModelTypes for test-common');

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating common files',
        expect.objectContaining({
          outputDir: '/output/common',
          templateCount: 4,
        })
      );
    });

    it('should generate TypeScript interfaces from grammar', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      const interfaceTemplate = `
{{#each interfaces}}
export interface {{name}} {{#if superTypes}}extends {{#each superTypes}}{{this.ref}}{{#unless @last}}, {{/unless}}{{/each}} {{/if}}{
  {{#each attributes}}
  {{name}}{{#if optional}}?{{/if}}: {{type.primitiveType}}{{#if many}}[]{{/if}};
  {{/each}}
}
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/common/interfaces.hbs', interfaceTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `export interface ${iface.name} `;
              
              if (iface.superTypes && iface.superTypes.length > 0) {
                result += 'extends ';
                result += iface.superTypes.map((st: any) => st.ref).join(', ');
                result += ' ';
              }
              
              result += '{\n';
              
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  result += `  ${attr.name}`;
                  if (attr.optional) result += '?';
                  result += `: ${attr.type?.primitiveType || 'any'}`;
                  if (attr.many) result += '[]';
                  result += ';\n';
                }
              }
              
              result += '}\n\n';
            }
          }
          return result.trim();
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/interfaces.ts', 'utf-8');
      expect(content).toContain('export interface BaseNode {');
      expect(content).toContain('id: string;');
      expect(content).toContain('type: string;');
      expect(content).toContain('export interface NamedElement extends BaseNode {');
      expect(content).toContain('name: string;');
      expect(content).toContain('description?: string;');
    });

    it('should generate type aliases from grammar types', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      const typeTemplate = `
{{#each types}}
export type {{name}} = {{#if type.types}}{{#each type.types}}'{{value}}'{{#unless @last}} | {{/unless}}{{/each}}{{/if}};
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/common/types.hbs', typeTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.types) {
            for (const type of context.types) {
              result += `export type ${type.name} = `;
              
              if (type.type?.types) {
                result += type.type.types
                  .map((t: any) => `'${t.value}'`)
                  .join(' | ');
              }
              
              result += ';\n';
            }
          }
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/types.ts', 'utf-8');
      expect(content).toContain("export type ElementType = 'node' | 'edge' | 'port';");
    });

    it('should generate protocol constants', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          protocolVersion: '1.0.0',
          namespace: 'com.example.glsp',
        },
      };

      const protocolTemplate = `
export const PROTOCOL_VERSION = '{{protocolVersion}}';
export const NAMESPACE = '{{namespace}}';

export const ActionTypes = {
  {{#each interfaces}}
  CREATE_{{toUpperCase name}}: '{{namespace}}.create{{name}}',
  UPDATE_{{toUpperCase name}}: '{{namespace}}.update{{name}}',
  DELETE_{{toUpperCase name}}: '{{namespace}}.delete{{name}}',
  {{/each}}
} as const;
`;

      await mockFileSystem.writeFile('/templates/common/protocol.hbs', protocolTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = `export const PROTOCOL_VERSION = '${context.protocolVersion || '0.1.0'}';\n`;
          result += `export const NAMESPACE = '${context.namespace || context.projectName}';\n\n`;
          result += 'export const ActionTypes = {\n';
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              const upperName = iface.name.toUpperCase();
              const ns = context.namespace || context.projectName;
              result += `  CREATE_${upperName}: '${ns}.create${iface.name}',\n`;
              result += `  UPDATE_${upperName}: '${ns}.update${iface.name}',\n`;
              result += `  DELETE_${upperName}: '${ns}.delete${iface.name}',\n`;
            }
          }
          
          result += '} as const;\n';
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/protocol.ts', 'utf-8');
      expect(content).toContain("export const PROTOCOL_VERSION = '1.0.0'");
      expect(content).toContain("export const NAMESPACE = 'com.example.glsp'");
      expect(content).toContain("CREATE_BASENODE: 'com.example.glsp.createBaseNode'");
      expect(content).toContain("UPDATE_NAMEDELEMENT: 'com.example.glsp.updateNamedElement'");
    });

    it('should generate utility functions', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          generateUtils: true,
        },
      };

      const utilsTemplate = `
{{#each interfaces}}
export function is{{name}}(element: any): element is {{name}} {
  return element && element.type === '{{toLowerCase name}}';
}

export function create{{name}}(props: Partial<{{name}}>): {{name}} {
  return {
    id: props.id || generateId(),
    type: '{{toLowerCase name}}',
    {{#each attributes}}
    {{#unless (eq name 'id')}}
    {{#unless (eq name 'type')}}
    {{name}}: props.{{name}}{{#if optional}} || undefined{{else}} || {{#if (eq type.primitiveType 'string')}}'default'{{else if (eq type.primitiveType 'number')}}0{{else if (eq type.primitiveType 'boolean')}}false{{else}}null{{/if}}{{/if}},
    {{/unless}}
    {{/unless}}
    {{/each}}
  };
}
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/common/utils.hbs', utilsTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              // Type guard
              result += `export function is${iface.name}(element: any): element is ${iface.name} {\n`;
              result += `  return element && element.type === '${iface.name.toLowerCase()}';\n`;
              result += '}\n\n';
              
              // Factory function
              result += `export function create${iface.name}(props: Partial<${iface.name}>): ${iface.name} {\n`;
              result += '  return {\n';
              result += '    id: props.id || generateId(),\n';
              result += `    type: '${iface.name.toLowerCase()}',\n`;
              
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  if (attr.name !== 'id' && attr.name !== 'type') {
                    result += `    ${attr.name}: props.${attr.name}`;
                    if (attr.optional) {
                      result += ' || undefined';
                    } else {
                      const type = attr.type?.primitiveType;
                      if (type === 'string') result += " || 'default'";
                      else if (type === 'number') result += ' || 0';
                      else if (type === 'boolean') result += ' || false';
                      else result += ' || null';
                    }
                    result += ',\n';
                  }
                }
              }
              
              result += '  };\n';
              result += '}\n\n';
            }
          }
          return result.trim();
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/utils.ts', 'utf-8');
      expect(content).toContain('export function isBaseNode(element: any): element is BaseNode');
      expect(content).toContain("return element && element.type === 'basenode'");
      expect(content).toContain('export function createNamedElement(props: Partial<NamedElement>)');
      expect(content).toContain("name: props.name || 'default'");
      expect(content).toContain('description: props.description || undefined');
    });

    it('should generate shared constants', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          generateConstants: true,
        },
      };

      const constantsTemplate = `
export const {{toUpperCase grammar.name}}_CONSTANTS = {
  GRAMMAR_NAME: '{{grammar.name}}',
  VERSION: '{{version}}',
  
  // Element types
  ELEMENT_TYPES: {
    {{#each interfaces}}
    {{toUpperCase name}}: '{{toLowerCase name}}',
    {{/each}}
  },
  
  // Type literals
  {{#each types}}
  {{toUpperCase name}}_VALUES: [{{#each type.types}}'{{value}}'{{#unless @last}}, {{/unless}}{{/each}}] as const,
  {{/each}}
  
  // Default values
  DEFAULTS: {
    {{#each interfaces}}
    {{toLowerCase name}}: {
      {{#each attributes}}
      {{name}}: {{#if (eq type.primitiveType 'string')}}'default-{{name}}'{{else if (eq type.primitiveType 'number')}}0{{else if (eq type.primitiveType 'boolean')}}false{{else}}null{{/if}},
      {{/each}}
    },
    {{/each}}
  },
};
`;

      await mockFileSystem.writeFile('/templates/common/constants.hbs', constantsTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          const grammarName = context.grammar.name.toUpperCase();
          let result = `export const ${grammarName}_CONSTANTS = {\n`;
          result += `  GRAMMAR_NAME: '${context.grammar.name}',\n`;
          result += `  VERSION: '${context.version || '0.1.0'}',\n`;
          result += '  \n';
          result += '  // Element types\n';
          result += '  ELEMENT_TYPES: {\n';
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `    ${iface.name.toUpperCase()}: '${iface.name.toLowerCase()}',\n`;
            }
          }
          
          result += '  },\n';
          result += '  \n';
          result += '  // Type literals\n';
          
          if (context.types) {
            for (const type of context.types) {
              result += `  ${type.name.toUpperCase()}_VALUES: [`;
              if (type.type?.types) {
                result += type.type.types.map((t: any) => `'${t.value}'`).join(', ');
              }
              result += '] as const,\n';
            }
          }
          
          result += '  \n';
          result += '  // Default values\n';
          result += '  DEFAULTS: {\n';
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `    ${iface.name.toLowerCase()}: {\n`;
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  result += `      ${attr.name}: `;
                  const type = attr.type?.primitiveType;
                  if (type === 'string') result += `'default-${attr.name}'`;
                  else if (type === 'number') result += '0';
                  else if (type === 'boolean') result += 'false';
                  else result += 'null';
                  result += ',\n';
                }
              }
              result += '    },\n';
            }
          }
          
          result += '  },\n';
          result += '};\n';
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/constants.ts', 'utf-8');
      expect(content).toContain('export const COMMONTESTGRAMMAR_CONSTANTS');
      expect(content).toContain("GRAMMAR_NAME: 'CommonTestGrammar'");
      expect(content).toContain("BASENODE: 'basenode'");
      expect(content).toContain("ELEMENTTYPE_VALUES: ['node', 'edge', 'port'] as const");
      expect(content).toContain("id: 'default-id'");
    });

    it('should generate validation schemas', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          generateValidationSchemas: true,
          validationLibrary: 'zod',
        },
      };

      const schemaTemplate = `
import { z } from 'zod';

{{#each interfaces}}
export const {{name}}Schema = z.object({
  {{#each attributes}}
  {{name}}: z.{{type.primitiveType}}(){{#if optional}}.optional(){{/if}}{{#if many}}.array(){{/if}},
  {{/each}}
});

export type {{name}} = z.infer<typeof {{name}}Schema>;
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/common/schemas.hbs', schemaTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = "import { z } from 'zod';\n\n";
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `export const ${iface.name}Schema = z.object({\n`;
              
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  result += `  ${attr.name}: z.${attr.type?.primitiveType || 'unknown'}()`;
                  if (attr.optional) result += '.optional()';
                  if (attr.many) result += '.array()';
                  result += ',\n';
                }
              }
              
              result += '});\n\n';
              result += `export type ${iface.name} = z.infer<typeof ${iface.name}Schema>;\n\n`;
            }
          }
          
          return result.trim();
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/schemas.ts', 'utf-8');
      expect(content).toContain("import { z } from 'zod'");
      expect(content).toContain('export const BaseNodeSchema = z.object({');
      expect(content).toContain('id: z.string(),');
      expect(content).toContain('description: z.string().optional(),');
      expect(content).toContain('export type BaseNode = z.infer<typeof BaseNodeSchema>');
    });

    it('should handle package.json generation', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          packageName: '@example/glsp-common',
          version: '1.2.3',
          author: 'Test Author',
          license: 'MIT',
        },
      };

      const packageTemplate = `{
  "name": "{{packageName}}",
  "version": "{{version}}",
  "description": "Common types and utilities for {{grammar.name}}",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "author": "{{author}}",
  "license": "{{license}}",
  "files": [
    "lib/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rimraf lib"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "rimraf": "^5.0.0"
  }
}`;

      await mockFileSystem.writeFile('/templates/common/package.json.hbs', packageTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          const pkg = {
            name: context.packageName || 'glsp-common',
            version: context.version || '0.1.0',
            description: `Common types and utilities for ${context.grammar.name}`,
            main: 'lib/index.js',
            types: 'lib/index.d.ts',
            author: context.author || '',
            license: context.license || 'MIT',
            files: ['lib/**/*'],
            scripts: {
              build: 'tsc',
              clean: 'rimraf lib',
            },
            devDependencies: {
              typescript: '^5.0.0',
              rimraf: '^5.0.0',
            },
          };
          return JSON.stringify(pkg, null, 2);
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/common/package.json', 'utf-8');
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe('@example/glsp-common');
      expect(pkg.version).toBe('1.2.3');
      expect(pkg.author).toBe('Test Author');
      expect(pkg.license).toBe('MIT');
      expect(pkg.description).toContain('CommonTestGrammar');
    });

    it('should generate index exports', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      // Create multiple template files
      await mockFileSystem.writeFile('/templates/common/types.hbs', 'types');
      await mockFileSystem.writeFile('/templates/common/interfaces.hbs', 'interfaces');
      await mockFileSystem.writeFile('/templates/common/utils.hbs', 'utils');
      await mockFileSystem.writeFile('/templates/common/index.hbs', `
// Auto-generated index file
export * from './types';
export * from './interfaces';
export * from './utils';
`);

      mockHandlebars.compile.mockImplementation((template: string) => {
        if (template.includes('Auto-generated')) {
          return () => `// Auto-generated index file
export * from './types';
export * from './interfaces';
export * from './utils';`;
        }
        return () => 'content';
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const indexContent = await mockFileSystem.readFile('/output/common/index.ts', 'utf-8');
      expect(indexContent).toContain('// Auto-generated index file');
      expect(indexContent).toContain("export * from './types'");
      expect(indexContent).toContain("export * from './interfaces'");
      expect(indexContent).toContain("export * from './utils'");
    });
  });

  describe('error handling', () => {
    it('should handle template directory not found', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Template directory not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate common files',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should handle invalid template content gracefully', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          strictTemplates: false,
        },
      };

      await mockFileSystem.writeFile('/templates/common/invalid.hbs', '{{#each}}'); // Invalid syntax

      mockHandlebars.compile.mockImplementation(() => {
        throw new Error('Parse error: missing closing tag');
      });

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Parse error');
    });

    it('should validate output directory permissions', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/readonly',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/common/test.hbs', 'test');

      // Make directory read-only
      mockFileSystem.mkdir = vi.fn().mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Permission denied');
    });
  });
});