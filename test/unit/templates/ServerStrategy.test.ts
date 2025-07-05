/**
 * Unit tests for ServerStrategy
 * @module test/unit/templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Grammar } from 'langium';
import { ServerStrategy } from '../../../src/templates/strategies/ServerStrategy';
import { IHandlebarsEngine } from '../../../src/templates/interfaces/ITemplateEngine';
import { IHelperRegistry } from '../../../src/templates/interfaces/IHelperRegistry';
import { IFileSystem } from '../../../src/infrastructure/filesystem/IFileSystem';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { GenerationConfig } from '../../../src/core/interfaces/IGenerator';
import { MockFileSystem, MockLogger } from '../../mocks/mock-services';

describe('ServerStrategy', () => {
  let strategy: ServerStrategy;
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

    // Create mock grammar with more complex structure
    mockGrammar = {
      $type: 'Grammar',
      name: 'ServerTestGrammar',
      rules: [
        {
          $type: 'ParserRule',
          name: 'Model',
          entry: true,
          definition: { $type: 'Alternatives', elements: [] },
        },
        {
          $type: 'ParserRule',
          name: 'Task',
          entry: false,
          definition: { 
            $type: 'Group',
            elements: [
              {
                $type: 'Assignment',
                feature: 'name',
                operator: '=',
                terminal: { $type: 'RuleCall', rule: { ref: 'ID' } },
              },
            ],
          },
        },
      ],
      interfaces: [
        {
          $type: 'Interface',
          name: 'Node',
          attributes: [
            {
              $type: 'Property',
              name: 'id',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
            {
              $type: 'Property',
              name: 'children',
              type: { 
                $type: 'ArrayType',
                elementType: { $type: 'SimpleType', primitiveType: 'Node' },
              },
              many: true,
            },
          ],
        },
        {
          $type: 'Interface',
          name: 'Edge',
          attributes: [
            {
              $type: 'Property',
              name: 'source',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
            {
              $type: 'Property',
              name: 'target',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
          ],
        },
      ],
      types: [
        {
          $type: 'Type',
          name: 'NodeType',
          type: {
            $type: 'UnionType',
            types: [
              { $type: 'StringLiteral', value: 'task' },
              { $type: 'StringLiteral', value: 'gateway' },
              { $type: 'StringLiteral', value: 'event' },
            ],
          },
        },
      ],
      imports: [],
    } as unknown as Grammar;

    // Create strategy
    strategy = new ServerStrategy(
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
      expect(strategy.getName()).toBe('server');
    });
  });

  describe('generate', () => {
    it('should generate server files successfully', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          packageName: 'test-server',
          serverPort: 5007,
        },
      };

      // Set up file system with templates
      const templates = new Map([
        ['/templates/server/model-factory.hbs', 'ModelFactory for {{projectName}}'],
        ['/templates/server/node-handlers.hbs', 'NodeHandlers for {{projectName}}'],
        ['/templates/server/server-module.hbs', 'ServerModule for {{projectName}}'],
        ['/templates/server/model-validator.hbs', 'ModelValidator for {{projectName}}'],
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
        '/output/server/model-factory.ts',
        '/output/server/node-handlers.ts',
        '/output/server/server-module.ts',
        '/output/server/model-validator.ts',
      ];

      for (const file of expectedFiles) {
        expect(await mockFileSystem.exists(file)).toBe(true);
      }

      // Verify content
      const factoryContent = await mockFileSystem.readFile('/output/server/model-factory.ts', 'utf-8');
      expect(factoryContent).toContain('ModelFactory for test-server');

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating server files',
        expect.objectContaining({
          outputDir: '/output/server',
          templateCount: 4,
        })
      );
    });

    it('should generate node factory with all interfaces', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      const factoryTemplate = `
import { GModelFactory } from '@eclipse-glsp/server';

export class {{projectName}}ModelFactory extends GModelFactory {
  {{#each interfaces}}
  create{{name}}(props: Partial<{{name}}>) {
    return this.create('{{toLowerCase name}}', props);
  }
  {{/each}}
}
`;

      await mockFileSystem.writeFile('/templates/server/model-factory.hbs', factoryTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = `import { GModelFactory } from '@eclipse-glsp/server';\n\n`;
          result += `export class ${context.projectName}ModelFactory extends GModelFactory {\n`;
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `  create${iface.name}(props: Partial<${iface.name}>) {\n`;
              result += `    return this.create('${iface.name.toLowerCase()}', props);\n`;
              result += `  }\n`;
            }
          }
          
          result += '}\n';
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/model-factory.ts', 'utf-8');
      expect(content).toContain('createNode(props: Partial<Node>)');
      expect(content).toContain('createEdge(props: Partial<Edge>)');
      expect(content).toContain("return this.create('node', props)");
      expect(content).toContain("return this.create('edge', props)");
    });

    it('should generate command handlers for rules', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          generateCommandHandlers: true,
        },
      };

      const handlersTemplate = `
{{#each rules}}
export class Create{{toPascalCase name}}Handler extends CreateNodeOperationHandler {
  readonly elementTypeIds = ['{{toLowerCase name}}'];
  
  createNode(operation: CreateNodeOperation): {{toPascalCase name}} {
    return {
      id: operation.elementId,
      type: '{{toLowerCase name}}',
      {{#if properties}}
      {{#each properties}}
      {{name}}: {{defaultValue type}},
      {{/each}}
      {{/if}}
    };
  }
}
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/server/command-handlers.hbs', handlersTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.rules) {
            for (const rule of context.rules) {
              result += `export class Create${rule.name}Handler extends CreateNodeOperationHandler {\n`;
              result += `  readonly elementTypeIds = ['${rule.name.toLowerCase()}'];\n`;
              result += `  \n`;
              result += `  createNode(operation: CreateNodeOperation): ${rule.name} {\n`;
              result += `    return {\n`;
              result += `      id: operation.elementId,\n`;
              result += `      type: '${rule.name.toLowerCase()}',\n`;
              result += `    };\n`;
              result += `  }\n`;
              result += `}\n`;
            }
          }
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/command-handlers.ts', 'utf-8');
      expect(content).toContain('export class CreateModelHandler');
      expect(content).toContain('export class CreateTaskHandler');
      expect(content).toContain("readonly elementTypeIds = ['model']");
      expect(content).toContain("readonly elementTypeIds = ['task']");
    });

    it('should generate server configuration with custom port', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          serverPort: 8080,
          websocketPath: '/custom-glsp',
        },
      };

      const configTemplate = `
export const SERVER_CONFIG = {
  port: {{serverPort}},
  websocketPath: '{{websocketPath}}',
  grammarName: '{{grammar.name}}',
};
`;

      await mockFileSystem.writeFile('/templates/server/config.hbs', configTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          return `export const SERVER_CONFIG = {
  port: ${context.serverPort || 5007},
  websocketPath: '${context.websocketPath || '/glsp'}',
  grammarName: '${context.grammar.name}',
};`;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/config.ts', 'utf-8');
      expect(content).toContain('port: 8080');
      expect(content).toContain("websocketPath: '/custom-glsp'");
      expect(content).toContain("grammarName: 'ServerTestGrammar'");
    });

    it('should generate validation rules', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          generateValidation: true,
        },
      };

      const validationTemplate = `
{{#each interfaces}}
export class {{name}}Validator {
  validate(node: {{name}}): ValidationMarker[] {
    const markers: ValidationMarker[] = [];
    
    {{#each attributes}}
    {{#if (eq type.primitiveType 'string')}}
    if (!node.{{name}} || node.{{name}}.trim() === '') {
      markers.push({
        severity: 'error',
        message: '{{name}} is required',
        elementId: node.id,
      });
    }
    {{/if}}
    {{/each}}
    
    return markers;
  }
}
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/server/validators.hbs', validationTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `export class ${iface.name}Validator {\n`;
              result += `  validate(node: ${iface.name}): ValidationMarker[] {\n`;
              result += `    const markers: ValidationMarker[] = [];\n`;
              result += `    \n`;
              
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  if (attr.type?.primitiveType === 'string') {
                    result += `    if (!node.${attr.name} || node.${attr.name}.trim() === '') {\n`;
                    result += `      markers.push({\n`;
                    result += `        severity: 'error',\n`;
                    result += `        message: '${attr.name} is required',\n`;
                    result += `        elementId: node.id,\n`;
                    result += `      });\n`;
                    result += `    }\n`;
                  }
                }
              }
              
              result += `    \n`;
              result += `    return markers;\n`;
              result += `  }\n`;
              result += `}\n`;
            }
          }
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/validators.ts', 'utf-8');
      expect(content).toContain('export class NodeValidator');
      expect(content).toContain('export class EdgeValidator');
      expect(content).toContain("message: 'id is required'");
      expect(content).toContain("message: 'source is required'");
    });

    it('should handle types in template context', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/server/types.hbs', 'Types: {{types.length}}');

      let capturedContext: any;
      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          capturedContext = context;
          return `Types: ${context.types?.length || 0}`;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(capturedContext.types).toHaveLength(1);
      expect(capturedContext.types[0].name).toBe('NodeType');
      expect(capturedContext.hasTypes).toBe(true);
      
      const content = await mockFileSystem.readFile('/output/server/types.ts', 'utf-8');
      expect(content).toBe('Types: 1');
    });

    it('should support DI container generation', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          useDependencyInjection: true,
          diFramework: 'inversify',
        },
      };

      const containerTemplate = `
import { Container } from 'inversify';

export function configureServerContainer(): Container {
  const container = new Container();
  
  {{#each interfaces}}
  container.bind('{{name}}Handler').to({{name}}Handler);
  {{/each}}
  
  return container;
}
`;

      await mockFileSystem.writeFile('/templates/server/di-config.hbs', containerTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = "import { Container } from 'inversify';\n\n";
          result += 'export function configureServerContainer(): Container {\n';
          result += '  const container = new Container();\n';
          result += '  \n';
          
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `  container.bind('${iface.name}Handler').to(${iface.name}Handler);\n`;
            }
          }
          
          result += '  \n';
          result += '  return container;\n';
          result += '}\n';
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/di-config.ts', 'utf-8');
      expect(content).toContain("import { Container } from 'inversify'");
      expect(content).toContain("container.bind('NodeHandler').to(NodeHandler)");
      expect(content).toContain("container.bind('EdgeHandler').to(EdgeHandler)");
    });

    it('should handle WebSocket configuration', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          enableWebSocket: true,
          corsOrigin: 'http://localhost:3000',
        },
      };

      const wsTemplate = `
export const WebSocketConfig = {
  enabled: {{enableWebSocket}},
  cors: {
    origin: '{{corsOrigin}}',
    credentials: true,
  },
};
`;

      await mockFileSystem.writeFile('/templates/server/websocket-config.hbs', wsTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          return `export const WebSocketConfig = {
  enabled: ${context.enableWebSocket || false},
  cors: {
    origin: '${context.corsOrigin || '*'}',
    credentials: true,
  },
};`;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/websocket-config.ts', 'utf-8');
      expect(content).toContain('enabled: true');
      expect(content).toContain("origin: 'http://localhost:3000'");
    });

    it('should generate layout engine configuration', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          layoutEngine: 'elk',
          layoutOptions: {
            algorithm: 'layered',
            direction: 'DOWN',
          },
        },
      };

      const layoutTemplate = `
export const LayoutConfig = {
  engine: '{{layoutEngine}}',
  {{#if layoutOptions}}
  options: {
    {{#each layoutOptions}}
    {{@key}}: '{{this}}',
    {{/each}}
  },
  {{/if}}
};
`;

      await mockFileSystem.writeFile('/templates/server/layout-config.hbs', layoutTemplate);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = 'export const LayoutConfig = {\n';
          result += `  engine: '${context.layoutEngine || 'manual'}',\n`;
          
          if (context.layoutOptions) {
            result += '  options: {\n';
            for (const [key, value] of Object.entries(context.layoutOptions)) {
              result += `    ${key}: '${value}',\n`;
            }
            result += '  },\n';
          }
          
          result += '};\n';
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/server/layout-config.ts', 'utf-8');
      expect(content).toContain("engine: 'elk'");
      expect(content).toContain("algorithm: 'layered'");
      expect(content).toContain("direction: 'DOWN'");
    });
  });

  describe('error handling', () => {
    it('should handle missing server templates gracefully', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Template directory not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate server files',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should continue generation if optional template fails', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          continueOnError: true,
        },
      };

      await mockFileSystem.writeFile('/templates/server/required.hbs', 'Required');
      await mockFileSystem.writeFile('/templates/server/optional.hbs', '{{invalid}}');

      let callCount = 0;
      mockHandlebars.compile.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Template error');
        }
        return (context: any) => 'Rendered';
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(await mockFileSystem.exists('/output/server/required.ts')).toBe(true);
      expect(await mockFileSystem.exists('/output/server/optional.ts')).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to process template',
        expect.objectContaining({
          template: 'optional.hbs',
        })
      );
    });
  });
});