import { GLSPGenerator } from '../../src/generator';
import { vi } from 'vitest';
import { ILogger } from '../../src/utils/logger';

/**
 * Create a mock GLSPGenerator with all required dependencies
 */
export function createMockGLSPGenerator() {
  const mockLogger: ILogger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis()
  };
  
  const mockServices = {
    parser: {
      parseGrammarFile: vi.fn().mockResolvedValue({
        projectName: 'test-grammar',
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
            definition: 'association | dependency | inheritance',
            unionTypes: ['association', 'dependency', 'inheritance']
          }
        ]
      }),
      parseGrammar: vi.fn().mockResolvedValue({}),
      validateGrammarFile: vi.fn().mockResolvedValue(true)
    },
    linter: {
      lintGrammar: vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      }),
      formatResults: vi.fn().mockReturnValue('')
    },
    reporter: {
      generateHtmlReport: vi.fn().mockResolvedValue(undefined),
      generateMarkdownReport: vi.fn().mockResolvedValue(undefined)
    },
    documentationGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    typeSafetyGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    testGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    cicdGenerator: {
      generate: vi.fn().mockResolvedValue({
        success: true,
        filesGenerated: []
      })
    },
    templateSystem: {
      initialize: vi.fn().mockResolvedValue({
        resolveTemplates: vi.fn().mockReturnValue([
          {
            templateName: 'model',
            outputPath: 'src/common/test-grammar-model.ts',
            template: {
              template: vi.fn().mockReturnValue(`// Generated model file
export interface Element {
  name: string;
}

export interface Node extends Element {
  position: Position;
  size?: Size;
  label?: string;
}

export interface Edge extends Element {
  source: Node;
  target: Node;
  type: EdgeType;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type EdgeType = 'association' | 'dependency' | 'inheritance';

// Type hierarchy for GLSP
export const TypeHierarchy = {
  node: 'node:Node',
  edge: 'edge:Edge',
  element: 'element:Element',
  position: 'position:Position',
  size: 'size:Size'
};`)
            }
          },
          {
            templateName: 'package.json',
            outputPath: 'package.json',
            template: {
              template: vi.fn().mockReturnValue(JSON.stringify({
                name: 'test-grammar-glsp-extension',
                version: '1.0.0',
                displayName: 'Test Grammar GLSP Extension',
                description: 'GLSP extension for Test Grammar',
                dependencies: {
                  '@eclipse-glsp/server': '^1.0.0'
                }
              }, null, 2))
            }
          }
        ])
      })
    },
    performanceOptimizer: {
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn().mockResolvedValue(undefined),
      getProgress: vi.fn().mockReturnValue({
        start: vi.fn(),
        startPhase: vi.fn(),
        completePhase: vi.fn(),
        complete: vi.fn(),
        abort: vi.fn(),
        updateProgress: vi.fn()
      }),
      shouldOptimize: vi.fn().mockReturnValue(false),
      getStreamingParser: vi.fn(),
      getCacheManager: vi.fn(),
      getParallelProcessor: vi.fn(),
      getOptimizationRecommendations: vi.fn().mockReturnValue([])
    }
  };
  
  // Create generator with mocked dependencies
  const generator = new GLSPGenerator(
    mockLogger,
    mockServices.parser,
    mockServices.linter,
    mockServices.reporter,
    mockServices.documentationGenerator,
    mockServices.typeSafetyGenerator,
    mockServices.testGenerator,
    mockServices.cicdGenerator,
    mockServices.templateSystem,
    mockServices.performanceOptimizer
  );
  
  return {
    generator,
    mockLogger,
    mockServices
  };
}
