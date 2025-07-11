import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface UtilityGeneratorOptions {
    generateFactories?: boolean;
    generateBuilders?: boolean;
    generateMappers?: boolean;
    generateComparers?: boolean;
}

export class UtilityGenerator {
    private template!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplate();
        this.registerHelpers();
    }
    
    private loadTemplate(): void {
        const templateContent = `/**
 * Type utility functions for {{projectName}}
 * @generated
 */

import type { {{#each interfaces}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} } from './{{projectName}}-types.js';
import { {{#each interfaces}}{{name}}Schema{{#unless @last}}, {{/unless}}{{/each}} } from './{{projectName}}-schemas.js';
import { z } from 'zod';

// Utility type definitions
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

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

export type DeepMutable<T> = {
    -readonly [P in keyof T]: T[P] extends (infer U)[]
        ? DeepMutable<U>[]
        : T[P] extends object
        ? DeepMutable<T[P]>
        : T[P];
};

export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickRequired<T> = Pick<T, RequiredKeys<T>>;
export type PickOptional<T> = Pick<T, OptionalKeys<T>>;

export type Diff<T, U> = T extends U ? never : T;
export type Filter<T, U> = T extends U ? T : never;

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

{{#if generateFactories}}// Factory functions
{{#each interfaces}}
export interface {{name}}Factory {
    create(partial?: Partial<{{name}}>): {{name}};
    createMany(count: number, partial?: Partial<{{name}}>): {{name}}[];
    createWithDefaults(): {{name}};
    validate(obj: unknown): obj is {{name}};
    parse(obj: unknown): {{name}};
}

export const {{camelCase name}}Factory: {{name}}Factory = {
    create(partial?: Partial<{{name}}>): {{name}} {
        const defaults = {
            id: \`{{lowercase name}}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
            type: '{{lowercase name}}',
{{#each properties}}
{{#unless optional}}
            {{name}}: {{> defaultValue type=type array=array}},
{{/unless}}
{{/each}}
        };
        
        const merged = { ...defaults, ...partial };
        return {{name}}Schema.parse(merged);
    },
    
    createMany(count: number, partial?: Partial<{{name}}>): {{name}}[] {
        return Array.from({ length: count }, (_, i) => 
            this.create({ ...partial, id: \`{{lowercase name}}_\${i}\` })
        );
    },
    
    createWithDefaults(): {{name}} {
        return this.create();
    },
    
    validate(obj: unknown): obj is {{name}} {
        return {{name}}Schema.safeParse(obj).success;
    },
    
    parse(obj: unknown): {{name}} {
        return {{name}}Schema.parse(obj);
    }
};

{{/each}}{{/if}}{{#if generateBuilders}}// Builder pattern
{{#each interfaces}}
export class {{name}}Builder {
    private data: Partial<{{name}}> = {};
    
    withId(id: string): this {
        this.data.id = id;
        return this;
    }
    
{{#each properties}}
    with{{pascalCase name}}(value: {{tsType type array}}{{#if optional}} | undefined{{/if}}): this {
        this.data.{{name}} = value{{#if array}} as any{{/if}};
        return this;
    }
    
{{/each}}
    build(): {{name}} {
        return {{camelCase name}}Factory.create(this.data);
    }
    
    buildMany(count: number): {{name}}[] {
        return Array.from({ length: count }, () => this.build());
    }
}

{{/each}}{{/if}}{{#if generateMappers}}// Mapper functions
{{#each interfaces}}
export const {{camelCase name}}Mapper = {
    toJSON(obj: {{name}}): string {
        return JSON.stringify(obj, null, 2);
    },
    
    fromJSON(json: string): {{name}} {
        return {{name}}Schema.parse(JSON.parse(json));
    },
    
    toPlainObject(obj: {{name}}): Record<string, any> {
        return { ...obj };
    },
    
    pick<K extends keyof {{name}}>(obj: {{name}}, keys: K[]): Pick<{{name}}, K> {
        const result = {} as Pick<{{name}}, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    
    omit<K extends keyof {{name}}>(obj: {{name}}, keys: K[]): Omit<{{name}}, K> {
        const result = { ...obj } as any;
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
    
    merge(target: {{name}}, ...sources: Partial<{{name}}>[]): {{name}} {
        return Object.assign({}, target, ...sources) as {{name}};
    }
};

{{/each}}{{/if}}{{#if generateComparers}}// Comparison functions
{{#each interfaces}}
export const {{camelCase name}}Comparer = {
    equals(a: {{name}}, b: {{name}}): boolean {
        return a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
    },
    
    shallowEquals(a: {{name}}, b: {{name}}): boolean {
        const keys = Object.keys(a) as (keyof {{name}})[];
        return keys.every(key => a[key] === b[key]);
    },
    
    diff(a: {{name}}, b: {{name}}): Partial<{{name}}> {
        const result: Partial<{{name}}> = {};
        const keys = Object.keys(b) as (keyof {{name}})[];
        
        keys.forEach(key => {
            if (a[key] !== b[key]) {
                result[key] = b[key] as any;
            }
        });
        
        return result;
    },
    
    patch(target: {{name}}, patch: Partial<{{name}}>): {{name}} {
        return { ...target, ...patch };
    }
};

{{/each}}{{/if}}// Clone utilities
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function shallowClone<T extends object>(obj: T): T {
    return { ...obj };
}

// Type assertion utilities
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
    if (value === undefined || value === null) {
        throw new Error(message || 'Value is not defined');
    }
}

export function assertType<T>(value: unknown, guard: (value: unknown) => value is T, message?: string): asserts value is T {
    if (!guard(value)) {
        throw new Error(message || 'Type assertion failed');
    }
}

// Transformation utilities
export function mapArray<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
    return array.map(mapper);
}

export function filterMap<T, U>(array: T[], mapper: (item: T, index: number) => U | undefined): U[] {
    return array.reduce<U[]>((acc, item, index) => {
        const mapped = mapper(item, index);
        if (mapped !== undefined) {
            acc.push(mapped);
        }
        return acc;
    }, []);
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

{{#*inline "defaultValue"}}{{#if array}}[]{{else}}{{#if (eq type 'string')}}'default'{{else if (eq type 'number')}}0{{else if (eq type 'boolean')}}false{{else}}undefined{{/if}}{{/if}}{{/inline}}

{{#*inline "tsType"}}{{type}}{{#if array}}[]{{/if}}{{/inline}}`;

        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });
        
        Handlebars.registerHelper('pascalCase', (str: string) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        });
        
        Handlebars.registerHelper('lowercase', (str: string) => {
            return str.toLowerCase();
        });
        
        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: UtilityGeneratorOptions = {}
    ): Promise<void> {
        const opts = {
            generateFactories: true,
            generateBuilders: true,
            generateMappers: true,
            generateComparers: true,
            ...options
        };
        
        const typesDir = path.join(outputDir, 'src', 'types');
        await fs.ensureDir(typesDir);
        
        // Prepare template data
        const data = {
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            ...opts
        };
        
        // Generate utilities file
        const content = this.template(data);
        const outputPath = path.join(typesDir, `${grammar.projectName}-utilities.ts`);
        await fs.writeFile(outputPath, content);
    }
}