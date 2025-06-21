import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar, GrammarInterface, GrammarType } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface GuardGeneratorOptions {
    generateDiscriminatedUnions?: boolean;
    generateExhaustiveChecks?: boolean;
    generateArrayGuards?: boolean;
    generateNestedGuards?: boolean;
}

export class GuardGenerator {
    private template!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplate();
        this.registerHelpers();
    }
    
    private loadTemplate(): void {
        const templateContent = `/**
 * Type guard functions for {{projectName}}
 * @generated
 */

import type { {{#each interfaces}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} } from './{{projectName}}-types.js';
import { validators } from './{{projectName}}-validators.js';

// Basic type guards
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isArray<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
    return Array.isArray(value) && value.every(guard);
}

// Interface type guards
{{#each interfaces}}
export function is{{name}}(obj: unknown): obj is {{name}} {
    return validators.is{{name}}(obj).valid;
}

{{/each}}{{#if generateDiscriminatedUnions}}// Discriminated union type guards
export type {{unionTypeName}} = {{#each interfaces}}{{name}}{{#unless @last}} | {{/unless}}{{/each}};

export function is{{unionTypeName}}(obj: unknown): obj is {{unionTypeName}} {
    return {{#each interfaces}}is{{name}}(obj){{#unless @last}} || {{/unless}}{{/each}};
}

// Discriminated union narrowing
export function is{{unionTypeName}}Type<T extends {{unionTypeName}}['type']>(
    obj: {{unionTypeName}},
    type: T
): obj is Extract<{{unionTypeName}}, { type: T }> {
    return obj.type === type;
}

{{/if}}{{#if generateArrayGuards}}// Array type guards
{{#each interfaces}}
export function is{{name}}Array(value: unknown): value is {{name}}[] {
    return isArray(value, is{{name}});
}

{{/each}}{{/if}}{{#if generateNestedGuards}}// Nested type guards
{{#each interfaces}}
{{#each properties}}
{{#if (isCustomType type)}}
export function is{{../name}}_{{name}}(value: unknown): value is {{type}} {
    return is{{type}}(value);
}

{{/if}}
{{/each}}
{{/each}}{{/if}}// Type narrowing helpers
export function hasProperty<K extends PropertyKey>(
    obj: unknown,
    key: K
): obj is Record<K, unknown> {
    return isObject(obj) && key in obj;
}

export function hasProperties<K extends PropertyKey>(
    obj: unknown,
    ...keys: K[]
): obj is Record<K, unknown> {
    return isObject(obj) && keys.every(key => key in obj);
}

// Type assertion helpers
export function assert{{unionTypeName}}(obj: unknown): asserts obj is {{unionTypeName}} {
    if (!is{{unionTypeName}}(obj)) {
        throw new Error(\`Expected {{unionTypeName}}, got \${typeof obj}\`);
    }
}

{{#each interfaces}}
export function assert{{name}}(obj: unknown): asserts obj is {{name}} {
    if (!is{{name}}(obj)) {
        throw new Error(\`Expected {{name}}, got \${typeof obj}\`);
    }
}

{{/each}}{{#if generateExhaustiveChecks}}// Exhaustiveness checking
export function assertNever(value: never): never {
    throw new Error(\`Unexpected value: \${JSON.stringify(value)}\`);
}

export function exhaustiveCheck<T extends { type: string }>(
    obj: T,
    handlers: { [K in T['type']]: (value: Extract<T, { type: K }>) => void }
): void {
    const type = obj.type as T['type'];
    const handler = handlers[type];
    if (handler) {
        handler(obj as any);
    } else {
        assertNever(obj);
    }
}

{{/if}}// Utility type guards
export function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

export function isNotNull<T>(value: T | null): value is T {
    return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

// Type filtering
export function filterByType<T extends { type: string }, K extends T['type']>(
    items: T[],
    type: K
): Extract<T, { type: K }>[] {
    return items.filter((item): item is Extract<T, { type: K }> => item.type === type);
}

export function partitionByType<T extends { type: string }, K extends T['type']>(
    items: T[],
    type: K
): [Extract<T, { type: K }>[], Exclude<T, { type: K }>[]] {
    const matching: Extract<T, { type: K }>[] = [];
    const notMatching: Exclude<T, { type: K }>[] = [];
    
    items.forEach(item => {
        if (item.type === type) {
            matching.push(item as Extract<T, { type: K }>);
        } else {
            notMatching.push(item as Exclude<T, { type: K }>);
        }
    });
    
    return [matching, notMatching];
}`;

        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('isCustomType', (type: string) => {
            const primitives = ['string', 'number', 'boolean', 'ID'];
            return !primitives.includes(type) && !type.endsWith('[]');
        });
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: GuardGeneratorOptions = {}
    ): Promise<void> {
        const opts = {
            generateDiscriminatedUnions: true,
            generateExhaustiveChecks: true,
            generateArrayGuards: true,
            generateNestedGuards: true,
            ...options
        };
        
        const typesDir = path.join(outputDir, 'src', 'types');
        await fs.ensureDir(typesDir);
        
        // Prepare template data
        const data = {
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            unionTypeName: `${this.toPascalCase(grammar.projectName)}Node`,
            ...opts
        };
        
        // Generate guards file
        const content = this.template(data);
        const outputPath = path.join(typesDir, `${grammar.projectName}-guards.ts`);
        await fs.writeFile(outputPath, content);
    }
    
    private toPascalCase(str: string): string {
        return str
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
}