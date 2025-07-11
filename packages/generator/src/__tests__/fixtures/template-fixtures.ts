/**
 * Template test fixtures
 * @module test/fixtures
 */

/**
 * Browser template fixtures
 */
export const BROWSER_TEMPLATES = {
  modelTypes: `{{#each interfaces}}
export interface {{toPascalCase name}}Node extends GNode {
  {{#each properties}}
  {{#if isOptional}}{{name}}?: {{type}};{{else}}{{name}}: {{type}};{{/if}}
  {{/each}}
}
{{/each}}`,

  diagramConfig: `export class {{toPascalCase projectName}}DiagramConfiguration implements DiagramConfiguration {
    typeMapping = {
      {{#each interfaces}}
      '{{name}}': {{toPascalCase name}}Node,
      {{/each}}
    };
}`,

  commandContribution: `@injectable()
export class {{toPascalCase projectName}}CommandContribution implements CommandContribution {
    registerCommands(registry: CommandRegistry): void {
        {{#each commands}}
        registry.registerCommand({{../projectName}}.commands.{{name}}, {
            execute: () => this.handle{{toPascalCase name}}()
        });
        {{/each}}
    }
}`,
};

/**
 * Server template fixtures
 */
export const SERVER_TEMPLATES = {
  modelFactory: `@injectable()
export class {{toPascalCase projectName}}ModelFactory implements ModelFactory {
    {{#each interfaces}}
    create{{toPascalCase name}}(args: any): {{toPascalCase name}}Node {
        return {
            type: '{{name}}',
            id: args.id || generateId(),
            {{#each properties}}
            {{name}}: args.{{name}}{{#unless isOptional}} || {{defaultValue type}}{{/unless}},
            {{/each}}
        };
    }
    {{/each}}
}`,

  nodeHandler: `@injectable()
export class {{toPascalCase name}}NodeHandler implements NodeHandler {
    handle(node: {{toPascalCase name}}Node, context: HandlerContext): void {
        // Validation
        {{#each properties}}
        {{#unless isOptional}}
        if (!node.{{name}}) {
            throw new Error('{{name}} is required for {{../name}}');
        }
        {{/unless}}
        {{/each}}
        
        // Processing
        context.process(node);
    }
}`,

  serverModule: `export default new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    
    // Model Factory
    configureModelFactory(context);
    
    // Node Handlers
    {{#each interfaces}}
    bind(TYPES.NodeHandler).to({{toPascalCase name}}NodeHandler).whenTargetNamed('{{name}}');
    {{/each}}
    
    // Server
    bind(TYPES.GLSPServer).to({{toPascalCase projectName}}GLSPServer).inSingletonScope();
});`,
};

/**
 * Common template fixtures
 */
export const COMMON_TEMPLATES = {
  protocol: `export namespace {{toPascalCase projectName}}Protocol {
    export const VERSION = '1.0.0';
    
    {{#each interfaces}}
    export interface Create{{toPascalCase name}}Args {
        {{#each properties}}
        {{name}}{{#if isOptional}}?{{/if}}: {{type}};
        {{/each}}
    }
    {{/each}}
    
    export const Actions = {
        {{#each actions}}
        {{name}}: '{{projectName}}.{{name}}',
        {{/each}}
    };
}`,

  modelTypes: `{{#each types}}
export type {{name}} = {{#if isUnion}}{{join values ' | '}}{{else}}'{{value}}'{{/if}};
{{/each}}

{{#each interfaces}}
export interface {{name}}{{#if extends}} extends {{extends}}{{/if}} {
    {{#each properties}}
    {{name}}{{#if isOptional}}?{{/if}}: {{type}};
    {{/each}}
}
{{/each}}`,
};

/**
 * Package.json template
 */
export const PACKAGE_JSON_TEMPLATE = `{
  "name": "@example/{{toLowerCase projectName}}-glsp",
  "version": "0.1.0",
  "description": "GLSP extension for {{projectName}}",
  "main": "lib/common/index.js",
  "types": "lib/common/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf lib coverage",
    "lint": "eslint src --ext .ts",
    "test": "jest",
    "prepare": "yarn clean && yarn build"
  },
  "dependencies": {
    "@eclipse-glsp/server": "^1.0.0",
    "@eclipse-glsp/client": "^1.0.0",
    "@eclipse-glsp/protocol": "^1.0.0",
    "@theia/core": "^1.30.0",
    "inversify": "^6.0.0"
  },
  "devDependencies": {
    "@types/jest": "^28.0.0",
    "@types/node": "^16.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "jest": "^28.0.0",
    "rimraf": "^3.0.0",
    "ts-jest": "^28.0.0",
    "typescript": "^4.8.0"
  }
}`;

/**
 * Test template context
 */
export function createTestTemplateContext(overrides?: any): any {
  return {
    projectName: 'TestProject',
    grammar: {
      name: 'TestGrammar',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', isOptional: false },
            { name: 'name', type: 'string', isOptional: false },
            { name: 'description', type: 'string', isOptional: true },
          ],
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'string', isOptional: false },
            { name: 'source', type: 'string', isOptional: false },
            { name: 'target', type: 'string', isOptional: false },
            { name: 'label', type: 'string', isOptional: true },
          ],
        },
      ],
      types: [
        { name: 'NodeType', isUnion: true, values: ['task', 'gateway', 'event'] },
        { name: 'EdgeType', isUnion: true, values: ['sequence', 'message', 'association'] },
      ],
    },
    config: {
      extension: {
        name: 'test-project-glsp',
        version: '0.1.0',
      },
    },
    ...overrides,
  };
}

/**
 * Expected template outputs
 */
export const EXPECTED_OUTPUTS = {
  modelTypes: `export interface NodeNode extends GNode {
  id: string;
  name: string;
  description?: string;
}

export interface EdgeNode extends GNode {
  id: string;
  source: string;
  target: string;
  label?: string;
}`,

  diagramConfig: `export class TestProjectDiagramConfiguration implements DiagramConfiguration {
    typeMapping = {
      'Node': NodeNode,
      'Edge': EdgeNode,
    };
}`,

  protocol: `export namespace TestProjectProtocol {
    export const VERSION = '1.0.0';
    
    export interface CreateNodeArgs {
        id: string;
        name: string;
        description?: string;
    }
    
    export interface CreateEdgeArgs {
        id: string;
        source: string;
        target: string;
        label?: string;
    }
    
    export const Actions = {
        
    };
}`,
};

/**
 * Template error cases
 */
export const TEMPLATE_ERROR_CASES = [
  {
    name: 'Missing helper',
    template: '{{unknownHelper value}}',
    context: { value: 'test' },
    expectedError: /unknownHelper/,
  },
  {
    name: 'Invalid syntax',
    template: '{{#if condition}}unclosed',
    context: { condition: true },
    expectedError: /Parse error/,
  },
  {
    name: 'Undefined property',
    template: '{{deeply.nested.undefined.property}}',
    context: {},
    expectedError: null, // Handlebars returns empty string for undefined
    expectedOutput: '',
  },
];

/**
 * Complex template with all features
 */
export const COMPLEX_TEMPLATE = `{{!-- Complex template with all Handlebars features --}}
{{#if config.generateHeader}}
/**
 * Generated from {{grammar.name}}
 * @date {{formatDate timestamp}}
 */
{{/if}}

{{#each grammar.interfaces as |interface|}}
{{#unless @first}}

{{/unless}}
{{> interfacePartial interface=interface projectName=../projectName}}
{{/each}}

{{#with config.extension}}
export const EXTENSION_CONFIG = {
    name: '{{name}}',
    version: '{{version}}',
    {{#if ../config.features}}
    features: [
        {{#each ../config.features}}
        '{{this}}'{{#unless @last}},{{/unless}}
        {{/each}}
    ],
    {{/if}}
};
{{/with}}

{{!-- Helper usage examples --}}
{{#each grammar.types}}
// {{toPascalCase name}} - {{toLowerCase name}} - {{toCamelCase name}}
{{/each}}

{{!-- Conditional helpers --}}
{{#if (and config.generateTypes (hasElements grammar.types))}}
// Types section
{{/if}}

{{#unless (or config.skipValidation config.noValidation)}}
// Validation enabled
{{/unless}}

{{!-- Custom block helper --}}
{{#eq config.mode 'production'}}
// Production mode
{{else}}
// Development mode
{{/eq}}`;

/**
 * Template partials
 */
export const TEMPLATE_PARTIALS = {
  interfacePartial: `export interface {{toPascalCase interface.name}} {
    {{#each interface.properties}}
    {{name}}{{#if isOptional}}?{{/if}}: {{type}};
    {{/each}}
}`,
  
  headerPartial: `/**
 * @generated
 * @project {{projectName}}
 * @version {{version}}
 */`,
};