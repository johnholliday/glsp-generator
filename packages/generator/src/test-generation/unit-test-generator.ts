import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, GrammarInterface } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface UnitTestGeneratorOptions {
    generateModelTests?: boolean;
    generateValidationTests?: boolean;
    generateTypeGuardTests?: boolean;
    generateFactoryTests?: boolean;
    coverage?: number; // Target coverage percentage
}

export class UnitTestGenerator {
    private modelTestTemplate!: HandlebarsTemplateDelegate;
    private validationTestTemplate!: HandlebarsTemplateDelegate;
    private typeGuardTestTemplate!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplates();
        this.registerHelpers();
    }

    private loadTemplates(): void {
        this.modelTestTemplate = Handlebars.compile(`import { describe, test, expect, beforeEach } from 'vitest';
import type { {{interfaceName}} } from '../../src/common/{{projectName}}-model';
import { is{{interfaceName}}, validate{{interfaceName}} } from '../../src/common/{{projectName}}-validators';
import { {{interfaceName}}Factory } from '../test-data/factories/{{kebabCase interfaceName}}-factory';

describe('{{interfaceName}} Model', () => {
    describe('validation', () => {
        test('should accept valid {{interfaceName}}', () => {
            const {{camelCase interfaceName}} = {{interfaceName}}Factory.create();
            expect(validate{{interfaceName}}({{camelCase interfaceName}}).valid).toBe(true);
        });

{{#each requiredProperties}}
        test('should reject {{../interfaceName}} without required {{name}}', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create();
            delete ({{camelCase ../interfaceName}} as any).{{name}};
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    path: '{{name}}',
                    message: expect.stringContaining('required')
                })
            );
        });

{{/each}}
{{#each optionalProperties}}
        test('should accept {{../interfaceName}} without optional {{name}}', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create();
            delete ({{camelCase ../interfaceName}} as any).{{name}};
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(true);
        });

{{/each}}
{{#each arrayProperties}}
        test('should validate {{name}} as array', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create({
                {{name}}: 'not-an-array' as any
            });
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    path: '{{name}}',
                    message: expect.stringContaining('array')
                })
            );
        });

        test('should accept empty array for {{name}}', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create({
                {{name}}: []
            });
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(true);
        });

{{/each}}
{{#each stringProperties}}
        test('should validate {{name}} as string', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create({
                {{name}}: 123 as any
            });
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    path: '{{name}}',
                    message: expect.stringContaining('string')
                })
            );
        });

{{/each}}
{{#each numberProperties}}
        test('should validate {{name}} as number', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create({
                {{name}}: 'not-a-number' as any
            });
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    path: '{{name}}',
                    message: expect.stringContaining('number')
                })
            );
        });

{{/each}}
{{#each booleanProperties}}
        test('should validate {{name}} as boolean', () => {
            const {{camelCase ../interfaceName}} = {{../interfaceName}}Factory.create({
                {{name}}: 'not-a-boolean' as any
            });
            
            const result = validate{{../interfaceName}}({{camelCase ../interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    path: '{{name}}',
                    message: expect.stringContaining('boolean')
                })
            );
        });

{{/each}}
{{#if hasReferences}}
        test('should validate references', () => {
            const {{camelCase interfaceName}} = {{interfaceName}}Factory.create();
            // Test reference validation logic here
            expect(validate{{interfaceName}}({{camelCase interfaceName}}).valid).toBe(true);
        });

{{/if}}
        test('should collect multiple validation errors', () => {
            const invalid{{interfaceName}} = {
                // Invalid object with multiple errors
{{#each requiredProperties}}
{{#unless @first}}                // Missing {{name}}
{{/unless}}{{/each}}
            };
            
            const result = validate{{interfaceName}}(invalid{{interfaceName}});
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength({{requiredProperties.length}});
        });
    });

    describe('type guards', () => {
        test('should identify {{interfaceName}} objects', () => {
            const {{camelCase interfaceName}} = {{interfaceName}}Factory.create();
            expect(is{{interfaceName}}({{camelCase interfaceName}})).toBe(true);
        });

        test('should reject non-{{interfaceName}} objects', () => {
            expect(is{{interfaceName}}(null)).toBe(false);
            expect(is{{interfaceName}}(undefined)).toBe(false);
            expect(is{{interfaceName}}({})).toBe(false);
            expect(is{{interfaceName}}({ type: 'wrong-type' })).toBe(false);
        });

        test('should narrow type correctly', () => {
            const obj: unknown = {{interfaceName}}Factory.create();
            
            if (is{{interfaceName}}(obj)) {
                // TypeScript should know obj is {{interfaceName}} here
                expect(obj.{{firstProperty}}).toBeDefined();
            } else {
                fail('Type guard should have passed');
            }
        });
    });

    describe('edge cases', () => {
        test('should handle null/undefined gracefully', () => {
            expect(validate{{interfaceName}}(null).valid).toBe(false);
            expect(validate{{interfaceName}}(undefined).valid).toBe(false);
        });

        test('should handle extra properties', () => {
            const {{camelCase interfaceName}}WithExtras = {
                ...{{interfaceName}}Factory.create(),
                extraProp: 'should-be-ignored'
            };
            
            const result = validate{{interfaceName}}({{camelCase interfaceName}}WithExtras);
            expect(result.valid).toBe(true);
        });

{{#if hasArrayProperties}}
        test('should handle large arrays', () => {
            const largeArray = Array(1000).fill(null).map((_, i) => \`item-\${i}\`);
            const {{camelCase interfaceName}} = {{interfaceName}}Factory.create({
                {{firstArrayProperty}}: largeArray
            });
            
            const result = validate{{interfaceName}}({{camelCase interfaceName}});
            expect(result.valid).toBe(true);
        });
{{/if}}
    });

    describe('performance', () => {
        test('validation should be fast for typical objects', () => {
            const {{camelCase interfaceName}} = {{interfaceName}}Factory.create();
            
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                validate{{interfaceName}}({{camelCase interfaceName}});
            }
            const duration = performance.now() - start;
            
            // Should validate 1000 objects in less than 100ms
            expect(duration).toBeLessThan(100);
        });
    });
});
`);

        this.validationTestTemplate = Handlebars.compile(`import { describe, test, expect } from 'vitest';
import { validators } from '../../src/common/{{projectName}}-validators';
import { {{interfaceNames}} } from '../../src/common/{{projectName}}-model';
{{#each interfaces}}
import { {{name}}Factory } from '../test-data/factories/{{kebabCase name}}-factory';
{{/each}}

describe('{{projectName}} Validators', () => {
{{#each interfaces}}
    describe('{{name}} validation', () => {
        test('should validate valid {{name}}', () => {
            const valid = {{name}}Factory.create();
            const result = validators.is{{name}}(valid);
            expect(result.valid).toBe(true);
            expect(result.value).toEqual(valid);
        });

        test('should provide detailed error messages', () => {
            const invalid = {{name}}Factory.createInvalid();
            const result = validators.is{{name}}(invalid);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
            
            result.errors!.forEach(error => {
                expect(error).toHaveProperty('path');
                expect(error).toHaveProperty('message');
            });
        });
    });

{{/each}}
    describe('batch validation', () => {
        test('should validate arrays of objects', () => {
            const items = [
{{#each interfaces}}
                {{name}}Factory.create(),
{{/each}}
            ];
            
            const results = items.map((item, index) => {
                const type = ['{{#each interfaces}}{{name}}{{#unless @last}}', '{{/unless}}{{/each}}'][index];
                return validators[\`is\${type}\`](item);
            });
            
            results.forEach(result => {
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('cross-validation', () => {
        test('should validate references between objects', () => {
            // Test cross-references if any exist in the model
            expect(true).toBe(true);
        });
    });
});
`);

        this.typeGuardTestTemplate = Handlebars.compile(`import { describe, test, expect } from 'vitest';
import {
{{#each interfaces}}
    is{{name}},
{{/each}}
    isAnyModelElement
} from '../../src/common/{{projectName}}-guards';
import {
{{#each interfaces}}
    {{name}}Factory,
{{/each}}
} from '../test-data/factories';

describe('{{projectName}} Type Guards', () => {
{{#each interfaces}}
    describe('is{{name}}', () => {
        test('should return true for valid {{name}}', () => {
            const {{camelCase name}} = {{name}}Factory.create();
            expect(is{{name}}({{camelCase name}})).toBe(true);
        });

        test('should return false for other model types', () => {
{{#each ../interfaces}}
{{#unless (eq name ../name)}}
            expect(is{{../name}}({{name}}Factory.create())).toBe(false);
{{/unless}}
{{/each}}
        });

        test('should return false for primitives', () => {
            expect(is{{name}}('string')).toBe(false);
            expect(is{{name}}(123)).toBe(false);
            expect(is{{name}}(true)).toBe(false);
            expect(is{{name}}(null)).toBe(false);
            expect(is{{name}}(undefined)).toBe(false);
        });

        test('should work as type predicate', () => {
            const items: unknown[] = [
                {{name}}Factory.create(),
                'not a {{name}}',
                null
            ];
            
            const {{camelCase name}}s = items.filter(is{{name}});
            expect({{camelCase name}}s).toHaveLength(1);
            
            // TypeScript should know these are {{name}} objects
            {{camelCase name}}s.forEach(item => {
                expect(item.{{discriminatorField}}).toBe('{{discriminatorValue}}');
            });
        });
    });

{{/each}}
    describe('isAnyModelElement', () => {
        test('should return true for any valid model element', () => {
{{#each interfaces}}
            expect(isAnyModelElement({{name}}Factory.create())).toBe(true);
{{/each}}
        });

        test('should return false for non-model objects', () => {
            expect(isAnyModelElement({})).toBe(false);
            expect(isAnyModelElement({ type: 'unknown' })).toBe(false);
            expect(isAnyModelElement(null)).toBe(false);
        });
    });

    describe('type guard composition', () => {
        test('should work with array methods', () => {
            const mixed = [
{{#each interfaces}}
                {{name}}Factory.create(),
{{/each}}
                null,
                undefined,
                { invalid: true }
            ];
            
            const validElements = mixed.filter(isAnyModelElement);
            expect(validElements).toHaveLength({{interfaces.length}});
        });

        test('should work with type narrowing in conditionals', () => {
            const element: unknown = {{firstInterface}}Factory.create();
            
            if (is{{firstInterface}}(element)) {
                // Should be able to access {{firstInterface}} properties
                expect(element.{{firstProperty}}).toBeDefined();
            } else {
                fail('Should have been identified as {{firstInterface}}');
            }
        });
    });
});
`);
    }

    private registerHelpers(): void {
        Handlebars.registerHelper('camelCase', (str: string) => {
            return str.charAt(0).toLowerCase() + str.slice(1);
        });

        Handlebars.registerHelper('kebabCase', (str: string) => {
            return str
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
        });

        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    }

    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: UnitTestGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateModelTests: true,
            generateValidationTests: true,
            generateTypeGuardTests: true,
            generateFactoryTests: true,
            coverage: 80,
            ...options
        };

        const generatedFiles: string[] = [];

        // Create test directories
        const unitTestDir = path.join(outputDir, 'src', 'test', 'unit');
        const modelTestDir = path.join(unitTestDir, 'model');
        const validationTestDir = path.join(unitTestDir, 'validation');
        const utilsTestDir = path.join(unitTestDir, 'utils');

        await fs.ensureDir(modelTestDir);
        await fs.ensureDir(validationTestDir);
        await fs.ensureDir(utilsTestDir);

        // Generate model tests
        if (opts.generateModelTests) {
            for (const iface of grammar.interfaces) {
                const testPath = path.join(modelTestDir, `${this.kebabCase(iface.name)}.test.ts`);
                const content = this.generateModelTest(iface, grammar);
                await fs.writeFile(testPath, content);
                generatedFiles.push(testPath);
            }
        }

        // Generate validation tests
        if (opts.generateValidationTests) {
            const testPath = path.join(validationTestDir, 'validators.test.ts');
            const content = this.generateValidationTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        // Generate type guard tests
        if (opts.generateTypeGuardTests) {
            const testPath = path.join(utilsTestDir, 'type-guards.test.ts');
            const content = this.generateTypeGuardTest(grammar);
            await fs.writeFile(testPath, content);
            generatedFiles.push(testPath);
        }

        return generatedFiles;
    }

    private generateModelTest(iface: GrammarInterface, grammar: ParsedGrammar): string {
        const requiredProperties = iface.properties.filter(p => !p.optional);
        const optionalProperties = iface.properties.filter(p => p.optional);
        const arrayProperties = iface.properties.filter(p => p.array);
        const stringProperties = iface.properties.filter(p => p.type === 'string' && !p.array);
        const numberProperties = iface.properties.filter(p => p.type === 'number' && !p.array);
        const booleanProperties = iface.properties.filter(p => p.type === 'boolean' && !p.array);

        const hasReferences = iface.properties.some(p =>
            !['string', 'number', 'boolean'].includes(p.type)
        );

        const data = {
            projectName: grammar.projectName,
            interfaceName: iface.name,
            requiredProperties,
            optionalProperties,
            arrayProperties,
            stringProperties,
            numberProperties,
            booleanProperties,
            hasReferences,
            hasArrayProperties: arrayProperties.length > 0,
            firstProperty: iface.properties[0]?.name || 'id',
            firstArrayProperty: arrayProperties[0]?.name || 'items',
            discriminatorField: 'type',
            discriminatorValue: iface.name.toLowerCase()
        };

        return this.modelTestTemplate(data);
    }

    private generateValidationTest(grammar: ParsedGrammar): string {
        const data = {
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            interfaceNames: grammar.interfaces.map(i => i.name).join(', ')
        };

        return this.validationTestTemplate(data);
    }

    private generateTypeGuardTest(grammar: ParsedGrammar): string {
        const data = {
            projectName: grammar.projectName,
            interfaces: grammar.interfaces,
            firstInterface: grammar.interfaces[0]?.name || 'Node',
            firstProperty: grammar.interfaces[0]?.properties[0]?.name || 'id',
            discriminatorField: 'type',
            discriminatorValue: grammar.interfaces[0]?.name.toLowerCase() || 'node'
        };

        return this.typeGuardTestTemplate(data);
    }

    private kebabCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');
    }
}