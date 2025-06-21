import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar, GrammarInterface, GrammarProperty, GrammarType } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface DeclarationGeneratorOptions {
    generateBrandedTypes?: boolean;
    generateNamespaces?: boolean;
    generateUtilityTypes?: boolean;
    generateJSDoc?: boolean;
}

export class DeclarationGenerator {
    private template!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplate();
        this.registerHelpers();
    }
    
    private loadTemplate(): void {
        const templateContent = `{{#if generateJSDoc}}/**
 * Type definitions for {{projectName}}
 * @generated
 * @module {{projectName}}-types
 */

{{/if}}{{#if generateBrandedTypes}}// Branded type definitions
export type NodeId = string & { readonly __brand: unique symbol };
{{#each brandedTypes}}
export type {{name}} = {{baseType}} & { readonly __{{camelCase name}}: unique symbol };
{{/each}}

{{/if}}// Interface definitions
{{#each interfaces}}
{{#if ../generateJSDoc}}/**
 * {{#if description}}{{description}}{{else}}{{name}} interface{{/if}}
 */
{{/if}}export interface {{name}}{{#if superTypes.length}} extends {{#each superTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}} {
{{#each properties}}
{{#if ../../generateJSDoc}}    /**
     * {{#if description}}{{description}}{{else}}{{name}} property{{/if}}
     */
{{/if}}    {{#if readonly}}readonly {{/if}}{{name}}{{#if optional}}?{{/if}}: {{tsType type array}};
{{/each}}
}

{{#if ../generateNamespaces}}export namespace {{name}} {
    export type Create = Omit<{{name}}, 'id'> & { id?: NodeId };
    export type Update = DeepPartial<Omit<{{name}}, 'id'>>;
    export type Patch = Partial<Update>;
}

{{/if}}{{/each}}// Type definitions
{{#each types}}
{{#if ../generateJSDoc}}/**
 * {{#if description}}{{description}}{{else}}{{name}} type{{/if}}
 */
{{/if}}export type {{name}} = {{definition}};

{{/each}}{{#if generateUtilityTypes}}// Utility types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[]
        ? ReadonlyArray<DeepReadonly<U>>
        : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

export type Diff<T, U> = T extends U ? never : T;
export type Filter<T, U> = T extends U ? T : never;

{{/if}}{{#if generateBrandedTypes}}// Branded type constructors
export const NodeId = {
    create(id: string): NodeId {
        return id as NodeId;
    },
    validate(id: unknown): id is NodeId {
        return typeof id === 'string' && id.length > 0;
    }
};

{{#each brandedTypes}}
export const {{name}} = {
    create(value: {{baseType}}): {{name}} {
        return value as {{name}};
    },
    validate(value: unknown): value is {{name}} {
        return {{typeValidation baseType}};
    }
};

{{/each}}{{/if}}// Type predicates
{{#each interfaces}}
export function is{{name}}(obj: unknown): obj is {{name}} {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        '{{discriminatorField}}' in obj &&
        (obj as any).{{discriminatorField}} === '{{discriminatorValue}}'
    );
}

{{/each}}`;

        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('tsType', (type: string, isArray: boolean) => {
            const baseType = this.mapToTsType(type);
            return isArray ? `${baseType}[]` : baseType;
        });
        
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });
        
        Handlebars.registerHelper('typeValidation', (type: string) => {
            switch (type) {
                case 'string': return "typeof value === 'string'";
                case 'number': return "typeof value === 'number'";
                case 'boolean': return "typeof value === 'boolean'";
                default: return 'true';
            }
        });
    }
    
    private mapToTsType(type: string): string {
        const typeMap: Record<string, string> = {
            'ID': 'NodeId',
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'int': 'number',
            'float': 'number'
        };
        
        return typeMap[type] || type;
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: DeclarationGeneratorOptions = {}
    ): Promise<void> {
        const opts = {
            generateBrandedTypes: true,
            generateNamespaces: true,
            generateUtilityTypes: true,
            generateJSDoc: true,
            ...options
        };
        
        const typesDir = path.join(outputDir, 'src', 'types');
        await fs.ensureDir(typesDir);
        
        // Collect branded types
        const brandedTypes = this.collectBrandedTypes(grammar);
        
        // Prepare template data
        const data = {
            projectName: grammar.projectName,
            interfaces: this.prepareInterfaces(grammar.interfaces),
            types: this.prepareTypes(grammar.types),
            brandedTypes,
            discriminatorField: 'type',
            ...opts
        };
        
        // Generate declaration file
        const content = this.template(data);
        const outputPath = path.join(typesDir, `${grammar.projectName}-types.d.ts`);
        await fs.writeFile(outputPath, content);
        
        // Generate index file
        await this.generateIndexFile(grammar.projectName, typesDir);
    }
    
    private collectBrandedTypes(grammar: ParsedGrammar): Array<{ name: string; baseType: string }> {
        const brandedTypes: Array<{ name: string; baseType: string }> = [];
        
        // Look for ID-like properties that should be branded
        grammar.interfaces.forEach(iface => {
            iface.properties.forEach(prop => {
                if (prop.name.endsWith('Id') || prop.name.endsWith('Reference')) {
                    const typeName = this.toPascalCase(prop.name);
                    if (!brandedTypes.some(bt => bt.name === typeName)) {
                        brandedTypes.push({
                            name: typeName,
                            baseType: 'string'
                        });
                    }
                }
            });
        });
        
        return brandedTypes;
    }
    
    private prepareInterfaces(interfaces: GrammarInterface[]): any[] {
        return interfaces.map(iface => ({
            ...iface,
            properties: iface.properties.map(prop => ({
                ...prop,
                readonly: prop.name === 'id' || prop.name.endsWith('Id'),
                tsType: this.mapToTsType(prop.type)
            })),
            discriminatorValue: iface.name.toLowerCase()
        }));
    }
    
    private prepareTypes(types: GrammarType[]): any[] {
        return types.map(type => ({
            ...type,
            definition: this.formatTypeDefinition(type)
        }));
    }
    
    private formatTypeDefinition(type: GrammarType): string {
        if (type.unionTypes && type.unionTypes.length > 0) {
            return type.unionTypes
                .map(t => `'${t}'`)
                .join(' | ');
        }
        return type.definition || 'unknown';
    }
    
    private async generateIndexFile(projectName: string, outputDir: string): Promise<void> {
        const indexContent = `// Type definitions index
export * from './${projectName}-types.js';
export * from './${projectName}-validators.js';
export * from './${projectName}-guards.js';
export * from './${projectName}-schemas.js';
`;
        
        await fs.writeFile(path.join(outputDir, 'index.ts'), indexContent);
    }
    
    private toPascalCase(str: string): string {
        return str
            .replace(/([A-Z])/g, ' $1')
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
}