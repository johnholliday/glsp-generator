import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, GrammarInterface } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface FactoryGeneratorOptions {
    generateModelFactories?: boolean;
    generateBuilders?: boolean;
    generateMothers?: boolean;
    includeEdgeCases?: boolean;
}

export class FactoryGenerator {
    private factoryTemplate!: HandlebarsTemplateDelegate;
    private builderTemplate!: HandlebarsTemplateDelegate;
    private motherTemplate!: HandlebarsTemplateDelegate;
    private indexTemplate!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplates();
        this.registerHelpers();
    }

    private loadTemplates(): void {
        this.factoryTemplate = Handlebars.compile(`import { {{interfaceName}}, {{interfaceName}}Id } from '../../../src/common/{{projectName}}-model';
import { v4 as uuid } from 'uuid';
import * as faker from '@faker-js/faker';

export class {{interfaceName}}Factory {
    private static counter = 0;

    /**
     * Creates a valid {{interfaceName}} instance with default values
     */
    static create(overrides?: Partial<{{interfaceName}}>): {{interfaceName}} {
        const id = overrides?.id || {{interfaceName}}Factory.createId();
        
        const defaults: {{interfaceName}} = {
            id,
            type: '{{camelCase interfaceName}}',
{{#each properties}}
            {{name}}: {{#if (eq type 'string')}}faker.lorem.word(){{else if (eq type 'number')}}faker.number.int({ min: 1, max: 100 }){{else if (eq type 'boolean')}}faker.datatype.boolean(){{else if array}}[]{{else}}'{{type}}-' + id{{/if}}{{#if optional}} as any{{/if}},
{{/each}}
        };
        
        return { ...defaults, ...overrides };
    }

    /**
     * Creates multiple valid {{interfaceName}} instances
     */
    static createMany(count: number, overrides?: Partial<{{interfaceName}}>): {{interfaceName}}[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    /**
     * Creates a valid {{interfaceName}} ID
     */
    static createId(): {{interfaceName}}Id {
        return \`{{camelCase interfaceName}}-\${++this.counter}\` as {{interfaceName}}Id;
    }

    /**
     * Creates an invalid {{interfaceName}} instance for testing validation
     */
    static createInvalid(): any {
        return {
            // Missing required id
            type: '{{camelCase interfaceName}}',
{{#each requiredProperties}}
            // Missing required {{name}}
{{/each}}
        };
    }

    /**
     * Creates a {{interfaceName}} with minimal required fields only
     */
    static createMinimal(): {{interfaceName}} {
        return {
            id: this.createId(),
            type: '{{camelCase interfaceName}}',
{{#each requiredProperties}}
            {{name}}: {{#if (eq type 'string')}}'min-{{name}}'{{else if (eq type 'number')}}0{{else if (eq type 'boolean')}}false{{else if array}}[]{{else}}'{{type}}-minimal'{{/if}},
{{/each}}
        };
    }

    /**
     * Creates a {{interfaceName}} with all fields populated
     */
    static createComplete(): {{interfaceName}} {
        return {
            id: this.createId(),
            type: '{{camelCase interfaceName}}',
{{#each properties}}
            {{name}}: {{#if (eq type 'string')}}faker.lorem.sentence(){{else if (eq type 'number')}}faker.number.int({ min: 1, max: 1000 }){{else if (eq type 'boolean')}}true{{else if array}}[faker.lorem.word(), faker.lorem.word()]{{else}}'{{type}}-complete'{{/if}},
{{/each}}
        };
    }

{{#if hasArrayProperties}}
    /**
     * Creates a {{interfaceName}} with large arrays for performance testing
     */
    static createWithLargeArrays(arraySize: number = 1000): {{interfaceName}} {
        return {
            ...this.create(),
{{#each arrayProperties}}
            {{name}}: Array.from({ length: arraySize }, (_, i) => \`{{name}}-item-\${i}\`),
{{/each}}
        };
    }
{{/if}}

{{#if hasStringProperties}}
    /**
     * Creates a {{interfaceName}} with edge case string values
     */
    static createWithEdgeCaseStrings(): {{interfaceName}} {
        const edgeCases = ['', ' ', '\\n', '\\t', '\\0', 'null', 'undefined', '<script>alert("xss")</script>'];
        let index = 0;
        
        return {
            ...this.create(),
{{#each stringProperties}}
            {{name}}: edgeCases[index++ % edgeCases.length],
{{/each}}
        };
    }
{{/if}}

{{#if hasNumberProperties}}
    /**
     * Creates a {{interfaceName}} with edge case number values
     */
    static createWithEdgeCaseNumbers(): {{interfaceName}} {
        const edgeCases = [0, -1, 1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, NaN, Infinity, -Infinity];
        let index = 0;
        
        return {
            ...this.create(),
{{#each numberProperties}}
            {{name}}: edgeCases[index++ % edgeCases.length],
{{/each}}
        };
    }
{{/if}}

{{#if hasReferences}}
    /**
     * Creates a {{interfaceName}} with valid references to other entities
     */
    static createWithReferences(references: {
{{#each referenceProperties}}
        {{name}}?: {{type}};
{{/each}}
    } = {}): {{interfaceName}} {
        return {
            ...this.create(),
{{#each referenceProperties}}
            {{name}}: references.{{name}} || '{{type}}-ref-' + uuid(),
{{/each}}
        };
    }

    /**
     * Creates a {{interfaceName}} with invalid references for testing
     */
    static createWithInvalidReferences(): {{interfaceName}} {
        return {
            ...this.create(),
{{#each referenceProperties}}
            {{name}}: 'invalid-{{name}}-reference' as any,
{{/each}}
        };
    }
{{/if}}

    /**
     * Creates a {{interfaceName}} for snapshot testing
     */
    static createForSnapshot(): {{interfaceName}} {
        // Use fixed values for consistent snapshots
        return {
            id: '{{camelCase interfaceName}}-snapshot-1' as {{interfaceName}}Id,
            type: '{{camelCase interfaceName}}',
{{#each properties}}
            {{name}}: {{#if (eq type 'string')}}'snapshot-{{name}}'{{else if (eq type 'number')}}42{{else if (eq type 'boolean')}}true{{else if array}}['item1', 'item2']{{else}}'{{type}}-snapshot'{{/if}},
{{/each}}
        };
    }

    /**
     * Reset the factory state (useful for tests)
     */
    static reset(): void {
        this.counter = 0;
    }
}
`);

        this.builderTemplate = Handlebars.compile(`import { {{interfaceName}}, {{interfaceName}}Id } from '../../../src/common/{{projectName}}-model';
import { {{interfaceName}}Factory } from './{{kebabCase interfaceName}}-factory';

/**
 * Builder pattern for creating {{interfaceName}} instances
 */
export class {{interfaceName}}Builder {
    private instance: Partial<{{interfaceName}}> = {};

    constructor(id?: {{interfaceName}}Id) {
        this.instance.id = id || {{interfaceName}}Factory.createId();
        this.instance.type = '{{camelCase interfaceName}}';
    }

    /**
     * Start building a new {{interfaceName}}
     */
    static new(id?: {{interfaceName}}Id): {{interfaceName}}Builder {
        return new {{interfaceName}}Builder(id);
    }

{{#each properties}}
    /**
     * Set the {{name}} property
     */
    with{{pascalCase name}}(value: {{#if array}}{{type}}[]{{else}}{{type}}{{/if}}): {{../interfaceName}}Builder {
        this.instance.{{name}} = value;
        return this;
    }

{{/each}}
{{#each arrayProperties}}
    /**
     * Add a single item to {{name}}
     */
    add{{singularize (pascalCase name)}}(item: {{type}}): {{../interfaceName}}Builder {
        if (!this.instance.{{name}}) {
            this.instance.{{name}} = [];
        }
        this.instance.{{name}}!.push(item);
        return this;
    }

    /**
     * Add multiple items to {{name}}
     */
    add{{pascalCase name}}(...items: {{type}}[]): {{../interfaceName}}Builder {
        if (!this.instance.{{name}}) {
            this.instance.{{name}} = [];
        }
        this.instance.{{name}}!.push(...items);
        return this;
    }

{{/each}}
    /**
     * Set multiple properties at once
     */
    with(props: Partial<{{interfaceName}}>): {{interfaceName}}Builder {
        Object.assign(this.instance, props);
        return this;
    }

    /**
     * Build the {{interfaceName}} instance
     */
    build(): {{interfaceName}} {
        // Ensure all required fields are present
{{#each requiredProperties}}
        if (!this.instance.{{name}}) {
            throw new Error('{{interfaceName}}Builder: required field "{{name}}" is missing');
        }
{{/each}}
        
        return this.instance as {{interfaceName}};
    }

    /**
     * Build with defaults for any missing required fields
     */
    buildWithDefaults(): {{interfaceName}} {
        const defaults = {{interfaceName}}Factory.createMinimal();
        return { ...defaults, ...this.instance } as {{interfaceName}};
    }

    /**
     * Create a copy of the current builder state
     */
    copy(): {{interfaceName}}Builder {
        const newBuilder = new {{interfaceName}}Builder();
        newBuilder.instance = { ...this.instance };
        return newBuilder;
    }
}
`);

        this.motherTemplate = Handlebars.compile(`import { {{interfaceName}} } from '../../../src/common/{{projectName}}-model';
import { {{interfaceName}}Factory } from './{{kebabCase interfaceName}}-factory';
import { {{interfaceName}}Builder } from './{{kebabCase interfaceName}}-builder';

/**
 * Object Mother pattern for creating {{interfaceName}} test objects
 * Provides semantic methods for creating objects in specific states
 */
export class {{interfaceName}}Mother {
    /**
     * Creates a simple, valid {{interfaceName}}
     */
    static simple(): {{interfaceName}} {
        return {{interfaceName}}Factory.createMinimal();
    }

    /**
     * Creates a {{interfaceName}} in a complex state
     */
    static complex(): {{interfaceName}} {
        return {{interfaceName}}Factory.createComplete();
    }

{{#if hasStatusProperty}}
    /**
     * Creates a {{interfaceName}} in active state
     */
    static active(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withStatus('active')
            .buildWithDefaults();
    }

    /**
     * Creates a {{interfaceName}} in inactive state
     */
    static inactive(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withStatus('inactive')
            .buildWithDefaults();
    }

    /**
     * Creates a {{interfaceName}} in error state
     */
    static withError(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withStatus('error')
            .withErrorMessage('Test error')
            .buildWithDefaults();
    }
{{/if}}

{{#if hasNameProperty}}
    /**
     * Creates a {{interfaceName}} with a specific name
     */
    static named(name: string): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withName(name)
            .buildWithDefaults();
    }

    /**
     * Creates a {{interfaceName}} with a long name for testing limits
     */
    static withLongName(): {{interfaceName}} {
        const longName = 'A'.repeat(255);
        return {{interfaceName}}Builder.new()
            .withName(longName)
            .buildWithDefaults();
    }
{{/if}}

{{#if hasCreationTimestamp}}
    /**
     * Creates a recently created {{interfaceName}}
     */
    static new(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withCreatedAt(new Date())
            .withUpdatedAt(new Date())
            .buildWithDefaults();
    }

    /**
     * Creates an old {{interfaceName}}
     */
    static old(): {{interfaceName}} {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        return {{interfaceName}}Builder.new()
            .withCreatedAt(oneYearAgo)
            .withUpdatedAt(oneYearAgo)
            .buildWithDefaults();
    }
{{/if}}

{{#if hasChildrenProperty}}
    /**
     * Creates a {{interfaceName}} with children
     */
    static withChildren(count: number = 3): {{interfaceName}} {
        const children = {{interfaceName}}Factory.createMany(count);
        return {{interfaceName}}Builder.new()
            .withChildren(children.map(c => c.id))
            .buildWithDefaults();
    }

    /**
     * Creates a {{interfaceName}} without children
     */
    static leaf(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withChildren([])
            .buildWithDefaults();
    }
{{/if}}

{{#if hasOwnerProperty}}
    /**
     * Creates a {{interfaceName}} owned by a specific user
     */
    static ownedBy(userId: string): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .withOwner(userId)
            .buildWithDefaults();
    }

    /**
     * Creates an unowned {{interfaceName}}
     */
    static orphaned(): {{interfaceName}} {
        return {{interfaceName}}Builder.new()
            .buildWithDefaults();
    }
{{/if}}

    /**
     * Creates a {{interfaceName}} for testing validation failures
     */
    static invalid(): any {
        return {{interfaceName}}Factory.createInvalid();
    }

    /**
     * Creates a {{interfaceName}} in a specific test scenario
     */
    static forScenario(scenario: string): {{interfaceName}} {
        switch (scenario) {
            case 'empty':
                return this.simple();
            case 'full':
                return this.complex();
{{#if hasStatusProperty}}
            case 'error':
                return this.withError();
{{/if}}
{{#if hasNameProperty}}
            case 'long-name':
                return this.withLongName();
{{/if}}
            default:
                return {{interfaceName}}Factory.create();
        }
    }
}
`);

        this.indexTemplate = Handlebars.compile(`// Test Data Factories
{{#each interfaces}}
export { {{name}}Factory } from './{{kebabCase name}}-factory';
{{/each}}

// Test Data Builders
{{#each interfaces}}
export { {{name}}Builder } from './{{kebabCase name}}-builder';
{{/each}}

// Test Data Mothers
{{#each interfaces}}
export { {{name}}Mother } from './{{kebabCase name}}-mother';
{{/each}}

// Utility functions
export * from './test-data-utils';
export * from './performance-data';
`);
    }

    private registerHelpers(): void {
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });

        Handlebars.registerHelper('pascalCase', (str: string) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        });

        Handlebars.registerHelper('kebabCase', (str: string) => {
            return str
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
        });

        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

        Handlebars.registerHelper('singularize', (str: string) => {
            // Simple singularization
            if (str.endsWith('ies')) {
                return str.slice(0, -3) + 'y';
            } else if (str.endsWith('es')) {
                return str.slice(0, -2);
            } else if (str.endsWith('s')) {
                return str.slice(0, -1);
            }
            return str;
        });
    }

    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: FactoryGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateModelFactories: true,
            generateBuilders: true,
            generateMothers: true,
            includeEdgeCases: true,
            ...options
        };

        const generatedFiles: string[] = [];

        // Create test data directories
        const factoryDir = path.join(outputDir, 'src', 'test', 'test-data', 'factories');
        await fs.ensureDir(factoryDir);

        // Generate factories, builders, and mothers for each interface
        for (const iface of grammar.interfaces) {
            if (opts.generateModelFactories) {
                const factoryPath = path.join(factoryDir, `${this.kebabCase(iface.name)}-factory.ts`);
                const content = this.generateFactory(iface, grammar);
                await fs.writeFile(factoryPath, content);
                generatedFiles.push(factoryPath);
            }

            if (opts.generateBuilders) {
                const builderPath = path.join(factoryDir, `${this.kebabCase(iface.name)}-builder.ts`);
                const content = this.generateBuilder(iface, grammar);
                await fs.writeFile(builderPath, content);
                generatedFiles.push(builderPath);
            }

            if (opts.generateMothers) {
                const motherPath = path.join(factoryDir, `${this.kebabCase(iface.name)}-mother.ts`);
                const content = this.generateMother(iface, grammar);
                await fs.writeFile(motherPath, content);
                generatedFiles.push(motherPath);
            }
        }

        // Generate index file
        const indexPath = path.join(factoryDir, 'index.ts');
        const indexContent = this.generateIndex(grammar);
        await fs.writeFile(indexPath, indexContent);
        generatedFiles.push(indexPath);

        // Generate utility files
        await this.generateUtilityFiles(factoryDir, grammar);
        generatedFiles.push(path.join(factoryDir, 'test-data-utils.ts'));
        generatedFiles.push(path.join(factoryDir, 'performance-data.ts'));

        return generatedFiles;
    }

    private generateFactory(iface: GrammarInterface, grammar: ParsedGrammar): string {
        const requiredProperties = iface.properties.filter(p => !p.optional);
        const arrayProperties = iface.properties.filter(p => p.array);
        const stringProperties = iface.properties.filter(p => p.type === 'string' && !p.array);
        const numberProperties = iface.properties.filter(p => p.type === 'number' && !p.array);
        const referenceProperties = iface.properties.filter(p =>
            !['string', 'number', 'boolean'].includes(p.type) && !p.array
        );

        const data = {
            projectName: grammar.projectName,
            interfaceName: iface.name,
            properties: iface.properties,
            requiredProperties,
            arrayProperties,
            stringProperties,
            numberProperties,
            referenceProperties,
            hasArrayProperties: arrayProperties.length > 0,
            hasStringProperties: stringProperties.length > 0,
            hasNumberProperties: numberProperties.length > 0,
            hasReferences: referenceProperties.length > 0
        };

        return this.factoryTemplate(data);
    }

    private generateBuilder(iface: GrammarInterface, grammar: ParsedGrammar): string {
        const requiredProperties = iface.properties.filter(p => !p.optional);
        const arrayProperties = iface.properties.filter(p => p.array);

        const data = {
            projectName: grammar.projectName,
            interfaceName: iface.name,
            properties: iface.properties,
            requiredProperties,
            arrayProperties
        };

        return this.builderTemplate(data);
    }

    private generateMother(iface: GrammarInterface, grammar: ParsedGrammar): string {
        const hasProperty = (name: string) =>
            iface.properties.some(p => p.name.toLowerCase() === name.toLowerCase());

        const data = {
            projectName: grammar.projectName,
            interfaceName: iface.name,
            hasStatusProperty: hasProperty('status'),
            hasNameProperty: hasProperty('name'),
            hasCreationTimestamp: hasProperty('createdAt') || hasProperty('created'),
            hasChildrenProperty: hasProperty('children'),
            hasOwnerProperty: hasProperty('owner') || hasProperty('ownerId')
        };

        return this.motherTemplate(data);
    }

    private generateIndex(grammar: ParsedGrammar): string {
        return this.indexTemplate({
            interfaces: grammar.interfaces
        });
    }

    private async generateUtilityFiles(factoryDir: string, grammar: ParsedGrammar): Promise<void> {
        // Generate test-data-utils.ts
        const utilsContent = `import { ${grammar.interfaces.map(i => i.name).join(', ')} } from '../../../src/common/${grammar.projectName}-model';
${grammar.interfaces.map(i => `import { ${i.name}Factory } from './${this.kebabCase(i.name)}-factory';`).join('\n')}

/**
 * Utility functions for working with test data
 */

/**
 * Create a complete model graph with interconnected elements
 */
export function createModelGraph(options: {
    nodeCount?: number;
    edgeCount?: number;
    depth?: number;
} = {}): { nodes: any[], edges: any[] } {
    const { nodeCount = 5, edgeCount = 4, depth = 3 } = options;
    
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        // Use first interface type or default
        const node = ${grammar.interfaces[0]?.name || 'Node'}Factory.create({
            id: \`node-\${i}\`,
            position: { x: i * 100, y: Math.floor(i / 3) * 100 }
        });
        nodes.push(node);
    }
    
    // Create edges
    for (let i = 0; i < edgeCount && i < nodeCount - 1; i++) {
        const edge = {
            id: \`edge-\${i}\`,
            type: 'edge',
            sourceId: nodes[i].id,
            targetId: nodes[i + 1].id
        };
        edges.push(edge);
    }
    
    return { nodes, edges };
}

/**
 * Create test data for a specific scenario
 */
export function createScenarioData(scenario: string): any[] {
    switch (scenario) {
        case 'empty':
            return [];
        
        case 'single':
            return [${grammar.interfaces[0]?.name || 'Node'}Factory.create()];
        
        case 'small':
            return createModelGraph({ nodeCount: 3, edgeCount: 2 }).nodes;
        
        case 'medium':
            return createModelGraph({ nodeCount: 10, edgeCount: 8 }).nodes;
        
        case 'large':
            return createModelGraph({ nodeCount: 100, edgeCount: 80 }).nodes;
        
        default:
            return [];
    }
}

/**
 * Generate random test data of mixed types
 */
export function generateMixedData(count: number): any[] {
    const result: any[] = [];
    const factories = [
${grammar.interfaces.map(i => `        ${i.name}Factory,`).join('\n')}
    ];
    
    for (let i = 0; i < count; i++) {
        const Factory = factories[i % factories.length];
        result.push(Factory.create());
    }
    
    return result;
}

/**
 * Clear all test data (useful for cleanup)
 */
export function resetAllFactories(): void {
${grammar.interfaces.map(i => `    ${i.name}Factory.reset();`).join('\n')}
}
`;

        await fs.writeFile(path.join(factoryDir, 'test-data-utils.ts'), utilsContent);

        // Generate performance-data.ts
        const perfContent = `import { createModelGraph, generateMixedData } from './test-data-utils';

/**
 * Generate data for performance testing
 */

/**
 * Generate a large dataset for stress testing
 */
export function generateLargeDataset(size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium'): any[] {
    const sizes = {
        small: 100,
        medium: 1000,
        large: 10000,
        xlarge: 100000
    };
    
    return generateMixedData(sizes[size]);
}

/**
 * Generate deeply nested data structures
 */
export function generateDeeplyNested(depth: number = 10): any {
    let current: any = { id: 'leaf', type: 'node', children: [] };
    
    for (let i = 0; i < depth; i++) {
        current = {
            id: \`level-\${i}\`,
            type: 'node',
            children: [current]
        };
    }
    
    return current;
}

/**
 * Generate data with many relationships
 */
export function generateHighlyConnected(nodeCount: number = 20): { nodes: any[], edges: any[] } {
    const graph = createModelGraph({ nodeCount, edgeCount: 0 });
    
    // Create edges between all nodes (fully connected)
    const edges: any[] = [];
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            edges.push({
                id: \`edge-\${i}-\${j}\`,
                type: 'edge',
                sourceId: graph.nodes[i].id,
                targetId: graph.nodes[j].id
            });
        }
    }
    
    return { nodes: graph.nodes, edges };
}

/**
 * Generate data for memory leak testing
 */
export function* generateContinuousData(): Generator<any[], void, unknown> {
    let batch = 0;
    while (true) {
        yield generateMixedData(100).map(item => ({
            ...item,
            batch,
            timestamp: new Date()
        }));
        batch++;
    }
}

/**
 * Performance test utilities
 */
export const performanceUtils = {
    /**
     * Measure operation time
     */
    async measureTime<T>(operation: () => T | Promise<T>): Promise<{ result: T, duration: number }> {
        const start = performance.now();
        const result = await operation();
        const duration = performance.now() - start;
        return { result, duration };
    },
    
    /**
     * Run operation multiple times and collect statistics
     */
    async benchmark<T>(
        operation: () => T | Promise<T>,
        iterations: number = 100
    ): Promise<{
        min: number,
        max: number,
        avg: number,
        median: number,
        p95: number,
        p99: number
    }> {
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            const { duration } = await this.measureTime(operation);
            times.push(duration);
        }
        
        times.sort((a, b) => a - b);
        
        return {
            min: times[0],
            max: times[times.length - 1],
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            median: times[Math.floor(times.length / 2)],
            p95: times[Math.floor(times.length * 0.95)],
            p99: times[Math.floor(times.length * 0.99)]
        };
    }
};
`;

        await fs.writeFile(path.join(factoryDir, 'performance-data.ts'), perfContent);
    }

    private kebabCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');
    }
}