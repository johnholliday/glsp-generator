import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar, GrammarInterface, GrammarProperty, GrammarType } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface ZodGeneratorOptions {
    generateRefinements?: boolean;
    generateTransformers?: boolean;
    generateParsers?: boolean;
    generateBrandedSchemas?: boolean;
}

export class ZodGenerator {
    private template!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplate();
        this.registerHelpers();
    }
    
    private loadTemplate(): void {
        const templateContent = `/**
 * Zod schemas for {{projectName}}
 * @generated
 */

import { z } from 'zod';
{{#if generateBrandedSchemas}}

// Branded type schemas
export const NodeIdSchema = z.string().min(1).brand('NodeId');
{{#each brandedTypes}}
export const {{name}}Schema = z.{{zodType baseType}}(){{#if validation}}.{{validation}}{{/if}}.brand('{{name}}');
{{/each}}
{{/if}}

// Base schemas
const BaseObjectSchema = z.object({
    id: {{#if generateBrandedSchemas}}NodeIdSchema{{else}}z.string(){{/if}}
});

{{#each types}}
// {{name}} schema
export const {{name}}Schema = {{#if unionTypes}}z.union([
{{#each unionTypes}}    z.literal('{{this}}'){{#unless @last}},{{/unless}}
{{/each}}
]){{else}}z.string(){{/if}};

{{/each}}
// Interface schemas
{{#each interfaces}}
export const {{name}}Schema = {{#if superTypes.length}}BaseObjectSchema.extend({
{{else}}z.object({
{{/if}}{{#each properties}}
    {{name}}: {{> zodProperty property=this}}{{#unless @last}},{{/unless}}
{{/each}}
}){{#if ../generateRefinements}}.refine(
    (data) => {
        // Add custom validation logic here
        return true;
    },
    {
        message: "{{name}} validation failed"
    }
){{/if}};

{{/each}}
// Union schemas
export const {{unionTypeName}}Schema = z.discriminatedUnion('type', [
{{#each interfaces}}    {{name}}Schema{{#unless @last}},{{/unless}}
{{/each}}
]);

// Type inference
{{#each interfaces}}
export type {{name}} = z.infer<typeof {{name}}Schema>;
{{/each}}
export type {{unionTypeName}} = z.infer<typeof {{unionTypeName}}Schema>;

{{#if generateParsers}}// Parse functions
{{#each interfaces}}
export function parse{{name}}(data: unknown): {{name}} {
    return {{name}}Schema.parse(data);
}

export function safeParse{{name}}(data: unknown) {
    return {{name}}Schema.safeParse(data);
}

{{/each}}
// Union parse functions
export function parse{{unionTypeName}}(data: unknown): {{unionTypeName}} {
    return {{unionTypeName}}Schema.parse(data);
}

export function safeParse{{unionTypeName}}(data: unknown) {
    return {{unionTypeName}}Schema.safeParse(data);
}

{{/if}}{{#if generateTransformers}}// Transform functions
{{#each interfaces}}
export const {{name}}TransformSchema = {{name}}Schema.transform((data) => {
    // Add transformation logic here
    return {
        ...data,
        _type: '{{name}}' as const
    };
});

{{/each}}{{/if}}// Array schemas
{{#each interfaces}}
export const {{name}}ArraySchema = z.array({{name}}Schema);
{{/each}}

// Partial schemas
{{#each interfaces}}
export const Partial{{name}}Schema = {{name}}Schema.partial();
{{/each}}

// Deep partial schemas
{{#each interfaces}}
export const DeepPartial{{name}}Schema = {{name}}Schema.deepPartial();
{{/each}}

// Strict schemas (no extra properties)
{{#each interfaces}}
export const Strict{{name}}Schema = {{name}}Schema.strict();
{{/each}}

// Schema composition helpers
export function createUnionSchema<T extends z.ZodTypeAny>(...schemas: T[]): z.ZodUnion<T[]> {
    return z.union(schemas as any);
}

export function createIntersectionSchema<T extends z.ZodTypeAny>(...schemas: T[]): z.ZodIntersection<T, T> {
    return schemas.reduce((acc, schema) => acc.and(schema)) as any;
}

// Validation helpers
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
}

export function getValidationErrors(schema: z.ZodSchema, data: unknown): string[] {
    const result = schema.safeParse(data);
    if (!result.success) {
        return result.error.errors.map(e => \`\${e.path.join('.')}: \${e.message}\`);
    }
    return [];
}

{{#*inline "zodProperty"}}{{#if property.array}}z.array({{> zodType type=property.type}}){{else}}{{> zodType type=property.type}}{{/if}}{{#if property.optional}}.optional(){{/if}}{{/inline}}

{{#*inline "zodType"}}{{#if (eq type 'string')}}z.string(){{else if (eq type 'number')}}z.number(){{else if (eq type 'boolean')}}z.boolean(){{else if (eq type 'ID')}}{{#if ../generateBrandedSchemas}}NodeIdSchema{{else}}z.string(){{/if}}{{else}}{{type}}Schema{{/if}}{{/inline}}`;

        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        
        Handlebars.registerHelper('zodType', (type: string) => {
            const typeMap: Record<string, string> = {
                'string': 'string',
                'number': 'number',
                'boolean': 'boolean',
                'int': 'number',
                'float': 'number'
            };
            return typeMap[type] || 'string';
        });
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: ZodGeneratorOptions = {}
    ): Promise<void> {
        const opts = {
            generateRefinements: true,
            generateTransformers: true,
            generateParsers: true,
            generateBrandedSchemas: true,
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
            types: grammar.types,
            brandedTypes,
            unionTypeName: `${this.toPascalCase(grammar.projectName)}Node`,
            ...opts
        };
        
        // Generate schemas file
        const content = this.template(data);
        const outputPath = path.join(typesDir, `${grammar.projectName}-schemas.ts`);
        await fs.writeFile(outputPath, content);
        
        // Generate package.json update for zod dependency
        await this.updatePackageJson(outputDir);
    }
    
    private collectBrandedTypes(grammar: ParsedGrammar): Array<{ name: string; baseType: string; validation?: string }> {
        const brandedTypes: Array<{ name: string; baseType: string; validation?: string }> = [];
        
        grammar.interfaces.forEach(iface => {
            iface.properties.forEach(prop => {
                if (prop.name.endsWith('Id') || prop.name.endsWith('Reference')) {
                    const typeName = this.toPascalCase(prop.name);
                    if (!brandedTypes.some(bt => bt.name === typeName)) {
                        brandedTypes.push({
                            name: typeName,
                            baseType: 'string',
                            validation: 'min(1)'
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
                zodType: this.mapToZodType(prop.type)
            }))
        }));
    }
    
    private mapToZodType(type: string): string {
        const typeMap: Record<string, string> = {
            'string': 'z.string()',
            'number': 'z.number()',
            'boolean': 'z.boolean()',
            'ID': 'NodeIdSchema',
            'int': 'z.number().int()',
            'float': 'z.number()'
        };
        
        return typeMap[type] || `${type}Schema`;
    }
    
    private async updatePackageJson(outputDir: string): Promise<void> {
        const packageJsonPath = path.join(outputDir, 'package.json');
        
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            
            if (!packageJson.dependencies) {
                packageJson.dependencies = {};
            }
            
            if (!packageJson.dependencies.zod) {
                packageJson.dependencies.zod = '^3.22.4';
                await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
            }
        }
    }
    
    private toPascalCase(str: string): string {
        return str
            .replace(/([A-Z])/g, ' $1')
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
}