import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar, GrammarInterface } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface ValidationGeneratorOptions {
    generateHelpers?: boolean;
    generateDetailedErrors?: boolean;
    validateReferences?: boolean;
}

export interface ValidationError {
    path: string;
    message: string;
    value?: unknown;
}

export interface ValidationResult<T> {
    valid: boolean;
    value?: T;
    errors?: ValidationError[];
}

export class ValidationGenerator {
    private template!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplate();
        this.registerHelpers();
    }

    private loadTemplate(): void {
        const templateContent = `/**
 * Runtime validation functions for {{projectName}}
 * @generated
 */

{{#if generateHelpers}}// Validation helpers
function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

{{/if}}export interface ValidationError {
    path: string;
    message: string;
    value?: unknown;
}

export interface ValidationResult<T> {
    valid: boolean;
    value?: T;
    errors?: ValidationError[];
}

// Validation functions
export const validators = {
{{#each interfaces}}
    is{{name}}(obj: unknown): ValidationResult<{{name}}> {
        const errors: ValidationError[] = [];
        
        if (!isObject(obj)) {
            return { 
                valid: false, 
                errors: [{ 
                    path: '', 
                    message: 'Expected object, got ' + typeof obj{{#if ../generateDetailedErrors}},
                    value: obj{{/if}}
                }] 
            };
        }
        
{{#each properties}}
        // Validate {{name}}
{{#if optional}}
        if ('{{name}}' in obj) {
{{else}}
        if (!('{{name}}' in obj)) {
            errors.push({ 
                path: '{{name}}', 
                message: 'Required property missing'{{#if ../../generateDetailedErrors}},
                value: undefined{{/if}}
            });
        } else {
{{/if}}
            const {{name}}Value = obj.{{name}};
{{#if array}}
            if (!isArray({{name}}Value)) {
                errors.push({ 
                    path: '{{name}}', 
                    message: 'Expected array, got ' + typeof {{name}}Value{{#if ../../generateDetailedErrors}},
                    value: {{name}}Value{{/if}}
                });
            } else {
                {{name}}Value.forEach((item, index) => {
                    {{> validateType type=type path=(concat name '[' index ']') value='item' indent='                    '}}
                });
            }
{{else}}
            {{> validateType type=type path=name value=(concat name 'Value') indent='            '}}
{{/if}}
        }
{{#unless optional}}        }{{/unless}}
        
{{/each}}
{{#if ../validateReferences}}
        // Validate references
        {{> validateReferences interface=this}}
{{/if}}
        
        return errors.length === 0 
            ? { valid: true, value: obj as {{name}} }
            : { valid: false, errors };
    },
    
{{/each}}
};

// Batch validation
export function validateMany<T>(
    items: unknown[],
    validator: (item: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
    const results: T[] = [];
    const errors: ValidationError[] = [];
    
    items.forEach((item, index) => {
        const result = validator(item);
        if (result.valid && result.value) {
            results.push(result.value);
        } else if (result.errors) {
            errors.push(...result.errors.map(e => ({
                ...e,
                path: \`[\${index}]\${e.path ? '.' + e.path : ''}\`
            })));
        }
    });
    
    return errors.length === 0
        ? { valid: true, value: results }
        : { valid: false, errors };
}

// Deep validation
export function validateDeep<T>(
    obj: unknown,
    validator: (item: unknown) => ValidationResult<T>
): ValidationResult<T> {
    const result = validator(obj);
    if (!result.valid) {
        return result;
    }
    
    // Additional deep validation logic here
    return result;
}

{{#*inline "validateType"}}
{{#if (eq type 'string')}}
if (!isString({{value}})) {
    errors.push({ 
        path: '{{path}}', 
        message: 'Expected string, got ' + typeof {{value}}{{#if ../../generateDetailedErrors}},
        value: {{value}}{{/if}}
    });
}
{{else if (eq type 'number')}}
if (!isNumber({{value}})) {
    errors.push({ 
        path: '{{path}}', 
        message: 'Expected number, got ' + typeof {{value}}{{#if ../../generateDetailedErrors}},
        value: {{value}}{{/if}}
    });
}
{{else if (eq type 'boolean')}}
if (!isBoolean({{value}})) {
    errors.push({ 
        path: '{{path}}', 
        message: 'Expected boolean, got ' + typeof {{value}}{{#if ../../generateDetailedErrors}},
        value: {{value}}{{/if}}
    });
}
{{else}}
// Custom type validation for {{type}}
const {{type}}Result = validators.is{{type}}({{value}});
if (!{{type}}Result.valid && {{type}}Result.errors) {
    errors.push(...{{type}}Result.errors.map(e => ({
        ...e,
        path: '{{path}}' + (e.path ? '.' + e.path : '')
    })));
}
{{/if}}
{{/inline}}

{{#*inline "validateReferences"}}
// Reference validation for {{interface.name}}
{{#each interface.properties}}
{{#if (isReference type)}}
if (obj.{{name}} && typeof obj.{{name}} === 'string') {
    // TODO: Add reference validation logic
    // This would check if the referenced ID exists
}
{{/if}}
{{/each}}
{{/inline}}`;

        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }

    private registerHelpers(): void {
        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

        Handlebars.registerHelper('concat', (...args: any[]) => {
            args.pop(); // Remove Handlebars options
            return args.join('');
        });

        Handlebars.registerHelper('isReference', (type: string) => {
            return type.endsWith('Id') || type.endsWith('Reference') || type.endsWith('Ref');
        });
    }

    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: ValidationGeneratorOptions = {}
    ): Promise<void> {
        const opts = {
            generateHelpers: true,
            generateDetailedErrors: true,
            validateReferences: true,
            ...options
        };

        const typesDir = path.join(outputDir, 'src', 'types');
        await fs.ensureDir(typesDir);

        // Prepare template data
        const data = {
            projectName: grammar.projectName,
            interfaces: this.prepareInterfaces(grammar.interfaces),
            ...opts
        };

        // Generate validators file
        const content = this.template(data);
        const outputPath = path.join(typesDir, `${grammar.projectName}-validators.ts`);
        await fs.writeFile(outputPath, content);
    }

    private prepareInterfaces(interfaces: GrammarInterface[]): any[] {
        return interfaces.map(iface => ({
            ...iface,
            properties: iface.properties.map(prop => ({
                ...prop,
                type: this.mapType(prop.type),
                array: prop.array || false,
                optional: prop.optional || false
            }))
        }));
    }

    private mapType(type: string): string {
        const primitiveTypes = ['string', 'number', 'boolean', 'ID'];
        return primitiveTypes.includes(type) ? type : type;
    }
}