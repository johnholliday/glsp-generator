/**
 * Unit tests for BrowserStrategy
 * @module test/unit/templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'inversify';
import { Grammar } from 'langium';
import { BrowserStrategy } from '../../../src/templates/strategies/BrowserStrategy';
import { IHandlebarsEngine } from '../../../src/templates/interfaces/ITemplateEngine';
import { IHelperRegistry } from '../../../src/templates/interfaces/IHelperRegistry';
import { IFileSystem } from '../../../src/infrastructure/filesystem/IFileSystem';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { GenerationConfig } from '../../../src/core/interfaces/IGenerator';
import { TYPES } from '../../../src/infrastructure/di/symbols';
import { MockFileSystem, MockLogger } from '../../mocks/mock-services';
import { TestFramework } from '../../utils/test-framework';
import { SIMPLE_GRAMMAR } from '../../fixtures/grammar-fixtures';
import * as path from 'path';

describe('BrowserStrategy', () => {
  let container: Container;
  let strategy: BrowserStrategy;
  let mockHandlebars: IHandlebarsEngine;
  let mockHelperRegistry: IHelperRegistry;
  let mockFileSystem: IFileSystem;
  let mockLogger: IStructuredLogger;
  let mockGrammar: Grammar;

  beforeEach(() => {
    // Create test container
    container = new TestFramework.TestBuilder()
      .withMockParser()
      .withMockLogger()
      .build();

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
      name: 'TestGrammar',
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
          name: 'Node',
          attributes: [
            {
              $type: 'Property',
              name: 'id',
              type: { $type: 'SimpleType', primitiveType: 'string' },
            },
          ],
        },
      ],
      types: [],
      imports: [],
    } as unknown as Grammar;

    // Bind mocks
    container.bind(TYPES.IHandlebarsEngine).toConstantValue(mockHandlebars);
    container.bind(TYPES.IHelperRegistry).toConstantValue(mockHelperRegistry);
    container.bind(TYPES.IFileSystem).toConstantValue(mockFileSystem);
    container.bind(TYPES.IStructuredLogger).toConstantValue(mockLogger);

    // Create strategy
    strategy = new BrowserStrategy(
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
      expect(strategy.getName()).toBe('browser');
    });
  });

  describe('generate', () => {
    it('should generate browser files successfully', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          packageName: 'test-extension',
          validate: true,
        },
      };

      // Set up file system with templates
      const templates = new Map([
        ['/templates/browser/command-contribution.hbs', '{{projectName}} Commands'],
        ['/templates/browser/diagram-configuration.hbs', '{{projectName}} Diagram'],
        ['/templates/browser/frontend-module.hbs', '{{projectName}} Module'],
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
        '/output/browser/command-contribution.ts',
        '/output/browser/diagram-configuration.ts',
        '/output/browser/frontend-module.ts',
      ];

      for (const file of expectedFiles) {
        expect(await mockFileSystem.exists(file)).toBe(true);
      }

      // Verify content
      const commandContent = await mockFileSystem.readFile('/output/browser/command-contribution.ts', 'utf-8');
      expect(commandContent).toContain('test-extension Commands');

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating browser files',
        expect.objectContaining({
          outputDir: '/output/browser',
          templateCount: 3,
        })
      );
    });

    it('should handle template with interfaces', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      const template = `
{{#each interfaces}}
export interface {{name}}GLSPNode {
  {{#each attributes}}
  {{name}}: {{type}};
  {{/each}}
}
{{/each}}
`;

      await mockFileSystem.writeFile('/templates/browser/model-types.hbs', template);

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          let result = '';
          if (context.interfaces) {
            for (const iface of context.interfaces) {
              result += `export interface ${iface.name}GLSPNode {\n`;
              if (iface.attributes) {
                for (const attr of iface.attributes) {
                  result += `  ${attr.name}: ${attr.type?.primitiveType || 'any'};\n`;
                }
              }
              result += '}\n';
            }
          }
          return result;
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/browser/model-types.ts', 'utf-8');
      expect(content).toContain('export interface NodeGLSPNode');
      expect(content).toContain('id: string;');
    });

    it('should create output directory if not exists', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/new-output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/test.hbs', 'test');

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(await mockFileSystem.exists('/new-output/browser')).toBe(true);
    });

    it('should handle missing templates directory', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      // Don't create any templates

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Template directory not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate browser files',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should handle template compilation errors', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/error.hbs', '{{invalid}}');

      mockHandlebars.compile.mockImplementation(() => {
        throw new Error('Invalid template syntax');
      });

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Invalid template syntax');
    });

    it('should skip non-handlebars files', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/README.md', 'Documentation');
      await mockFileSystem.writeFile('/templates/browser/test.hbs', 'Template');

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(await mockFileSystem.exists('/output/browser/README.md')).toBe(false);
      expect(await mockFileSystem.exists('/output/browser/test.ts')).toBe(true);
    });

    it('should apply custom file extension mapping', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          fileExtensions: {
            'config.hbs': '.json',
            'schema.hbs': '.graphql',
          },
        },
      };

      await mockFileSystem.writeFile('/templates/browser/config.hbs', '{}');
      await mockFileSystem.writeFile('/templates/browser/schema.hbs', 'type Query {}');
      await mockFileSystem.writeFile('/templates/browser/normal.hbs', 'code');

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(await mockFileSystem.exists('/output/browser/config.json')).toBe(true);
      expect(await mockFileSystem.exists('/output/browser/schema.graphql')).toBe(true);
      expect(await mockFileSystem.exists('/output/browser/normal.ts')).toBe(true);
    });

    it('should provide comprehensive template context', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          packageName: 'my-extension',
          namespace: 'com.example',
          version: '2.0.0',
        },
      };

      await mockFileSystem.writeFile('/templates/browser/test.hbs', 'test');

      let capturedContext: any;
      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          capturedContext = context;
          return 'rendered';
        };
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(capturedContext).toMatchObject({
        grammar: mockGrammar,
        projectName: 'my-extension',
        namespace: 'com.example',
        version: '2.0.0',
        interfaces: expect.any(Array),
        rules: expect.any(Array),
        hasInterfaces: true,
        hasTypes: false,
        entryRule: expect.objectContaining({ name: 'Model' }),
      });
    });

    it('should handle deep template directory structure', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/components/views/diagram.hbs', 'diagram');
      await mockFileSystem.writeFile('/templates/browser/components/toolbar.hbs', 'toolbar');
      await mockFileSystem.writeFile('/templates/browser/index.hbs', 'index');

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      expect(await mockFileSystem.exists('/output/browser/components/views/diagram.ts')).toBe(true);
      expect(await mockFileSystem.exists('/output/browser/components/toolbar.ts')).toBe(true);
      expect(await mockFileSystem.exists('/output/browser/index.ts')).toBe(true);
    });

    it('should handle empty grammar gracefully', async () => {
      // Arrange
      const emptyGrammar = {
        $type: 'Grammar',
        name: 'EmptyGrammar',
        rules: [],
        interfaces: [],
        types: [],
        imports: [],
      } as unknown as Grammar;

      const config: GenerationConfig = {
        grammarPath: '/test/empty.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/test.hbs', 'Empty: {{hasInterfaces}}');

      let capturedContext: any;
      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => {
          capturedContext = context;
          return `Empty: ${context.hasInterfaces}`;
        };
      });

      // Act
      await strategy.generate(emptyGrammar, config);

      // Assert
      expect(capturedContext.hasInterfaces).toBe(false);
      expect(capturedContext.hasTypes).toBe(false);
      expect(capturedContext.entryRule).toBeUndefined();
      
      const content = await mockFileSystem.readFile('/output/browser/test.ts', 'utf-8');
      expect(content).toBe('Empty: false');
    });

    it('should support custom template variables', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {
          templateVariables: {
            author: 'Test Author',
            license: 'MIT',
            customField: { nested: 'value' },
          },
        },
      };

      await mockFileSystem.writeFile('/templates/browser/header.hbs', '// Author: {{author}}, License: {{license}}');

      mockHandlebars.compile.mockImplementation(() => {
        return (context: any) => `// Author: ${context.author}, License: ${context.license}`;
      });

      // Act
      await strategy.generate(mockGrammar, config);

      // Assert
      const content = await mockFileSystem.readFile('/output/browser/header.ts', 'utf-8');
      expect(content).toBe('// Author: Test Author, License: MIT');
    });
  });

  describe('error handling', () => {
    it('should handle file write errors', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '/output',
        options: {},
      };

      await mockFileSystem.writeFile('/templates/browser/test.hbs', 'content');

      // Make writeFile fail
      mockFileSystem.writeFile = vi.fn().mockRejectedValue(new Error('Disk full'));

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow('Disk full');
    });

    it('should handle invalid output directory', async () => {
      // Arrange
      const config: GenerationConfig = {
        grammarPath: '/test/grammar.langium',
        outputDir: '', // Invalid
        options: {},
      };

      // Act & Assert
      await expect(strategy.generate(mockGrammar, config)).rejects.toThrow();
    });
  });
});