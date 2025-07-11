import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { DeclarationGenerator, DeclarationGeneratorOptions } from './declaration-generator.js';
import { ValidationGenerator, ValidationGeneratorOptions } from './validation-generator.js';
import { GuardGenerator, GuardGeneratorOptions } from './guard-generator.js';
import { ZodGenerator, ZodGeneratorOptions } from './zod-generator.js';
import { UtilityGenerator, UtilityGeneratorOptions } from './utility-generator.js';
import chalk from 'chalk';

export interface TypeSafetyOptions {
    declarations?: boolean | DeclarationGeneratorOptions;
    validation?: boolean | ValidationGeneratorOptions;
    guards?: boolean | GuardGeneratorOptions;
    zodSchemas?: boolean | ZodGeneratorOptions;
    utilities?: boolean | UtilityGeneratorOptions;
}

export interface TypeSafetyResult {
    success: boolean;
    filesGenerated: string[];
    errors?: string[];
}

export class TypeSafetyGenerator {
    private declarationGenerator: DeclarationGenerator;
    private validationGenerator: ValidationGenerator;
    private guardGenerator: GuardGenerator;
    private zodGenerator: ZodGenerator;
    private utilityGenerator: UtilityGenerator;

    constructor() {
        this.declarationGenerator = new DeclarationGenerator();
        this.validationGenerator = new ValidationGenerator();
        this.guardGenerator = new GuardGenerator();
        this.zodGenerator = new ZodGenerator();
        this.utilityGenerator = new UtilityGenerator();
    }

    async generate(
        grammar: ParsedGrammar,
        _config: GLSPConfig,
        outputDir: string,
        options?: TypeSafetyOptions
    ): Promise<TypeSafetyResult> {
        const opts = this.normalizeOptions(options);
        const filesGenerated: string[] = [];
        const errors: string[] = [];

        console.log(chalk.blue('🔒 Generating type safety features...'));

        try {
            // Generate TypeScript declarations
            if (opts.declarations !== false) {
                console.log(chalk.gray('   • Generating TypeScript declarations...'));
                const declOptions = typeof opts.declarations === 'object' ? opts.declarations : {};
                await this.declarationGenerator.generate(grammar, outputDir, declOptions);
                filesGenerated.push(`${grammar.projectName}-types.d.ts`);
            }

            // Generate validation functions
            if (opts.validation !== false) {
                console.log(chalk.gray('   • Generating validation functions...'));
                const valOptions = typeof opts.validation === 'object' ? opts.validation : {};
                await this.validationGenerator.generate(grammar, outputDir, valOptions);
                filesGenerated.push(`${grammar.projectName}-validators.ts`);
            }

            // Generate type guards
            if (opts.guards !== false) {
                console.log(chalk.gray('   • Generating type guards...'));
                const guardOptions = typeof opts.guards === 'object' ? opts.guards : {};
                await this.guardGenerator.generate(grammar, outputDir, guardOptions);
                filesGenerated.push(`${grammar.projectName}-guards.ts`);
            }

            // Generate Zod schemas
            if (opts.zodSchemas !== false) {
                console.log(chalk.gray('   • Generating Zod schemas...'));
                const zodOptions = typeof opts.zodSchemas === 'object' ? opts.zodSchemas : {};
                await this.zodGenerator.generate(grammar, outputDir, zodOptions);
                filesGenerated.push(`${grammar.projectName}-schemas.ts`);
            }

            // Generate utility functions
            if (opts.utilities !== false) {
                console.log(chalk.gray('   • Generating utility functions...'));
                const utilOptions = typeof opts.utilities === 'object' ? opts.utilities : {};
                await this.utilityGenerator.generate(grammar, outputDir, utilOptions);
                filesGenerated.push(`${grammar.projectName}-utilities.ts`);
            }

            // Generate type safety documentation
            await this.generateDocumentation(grammar, outputDir);
            filesGenerated.push('type-safety.md');

            // Generate test examples
            await this.generateTestExamples(grammar, outputDir);
            filesGenerated.push('type-safety.test.ts');

            console.log(chalk.green('✅ Type safety features generated successfully!'));
            console.log(chalk.gray(`   Generated ${filesGenerated.length} files`));

            return {
                success: true,
                filesGenerated
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(chalk.red(`❌ Error generating type safety features: ${errorMessage}`));
            errors.push(errorMessage);

            return {
                success: false,
                filesGenerated,
                errors
            };
        }
    }

    private normalizeOptions(options?: TypeSafetyOptions): Required<TypeSafetyOptions> {
        return {
            declarations: options?.declarations ?? true,
            validation: options?.validation ?? true,
            guards: options?.guards ?? true,
            zodSchemas: options?.zodSchemas ?? true,
            utilities: options?.utilities ?? true
        };
    }

    private async generateDocumentation(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const docsContent = `# Type Safety Documentation for ${grammar.projectName}

## Overview

This document describes the type safety features generated for your ${grammar.projectName} models.

## Generated Files

### TypeScript Declarations (\`${grammar.projectName}-types.d.ts\`)

Contains comprehensive type definitions including:
- Interface definitions for all grammar rules
- Branded types for type-safe IDs
- Namespace utilities for create/update/patch operations
- Utility types (DeepPartial, DeepReadonly, etc.)

### Validation Functions (\`${grammar.projectName}-validators.ts\`)

Runtime validation with detailed error reporting:
- Deep object validation
- Property type checking
- Required field validation
- Array bounds checking
- Reference validation

### Type Guards (\`${grammar.projectName}-guards.ts\`)

Type predicate functions for runtime type checking:
- User-defined type guards for each interface
- Discriminated union guards
- Array type guards
- Exhaustiveness checking helpers

### Zod Schemas (\`${grammar.projectName}-schemas.ts\`)

Zod schema definitions for parsing and validation:
- Schema for each type with refinements
- Branded type schemas
- Parse and safeParse functions
- Transform functions
- Partial and strict schemas

### Utility Functions (\`${grammar.projectName}-utilities.ts\`)

Helper functions and utilities:
- Factory functions for creating instances
- Builder pattern implementations
- Mapper functions for transformations
- Comparison and diff utilities

## Usage Examples

### Basic Type Checking

\`\`\`typescript
import { is${grammar.interfaces[0]?.name || 'Node'} } from './types/${grammar.projectName}-guards';
import { ${grammar.interfaces[0]?.name || 'Node'} } from './types/${grammar.projectName}-types';

const data: unknown = { /* ... */ };

if (is${grammar.interfaces[0]?.name || 'Node'}(data)) {
    // TypeScript now knows 'data' is of type ${grammar.interfaces[0]?.name || 'Node'}
    console.log(data.id);
}
\`\`\`

### Validation with Error Handling

\`\`\`typescript
import { validators } from './types/${grammar.projectName}-validators';

const result = validators.is${grammar.interfaces[0]?.name || 'Node'}(data);

if (result.valid) {
    // Use result.value with confidence
    console.log(result.value.id);
} else {
    // Handle validation errors
    result.errors?.forEach(error => {
        console.error(\`\${error.path}: \${error.message}\`);
    });
}
\`\`\`

### Using Zod Schemas

\`\`\`typescript
import { ${grammar.interfaces[0]?.name || 'Node'}Schema, safeParse${grammar.interfaces[0]?.name || 'Node'} } from './types/${grammar.projectName}-schemas';

// Safe parsing with error handling
const result = safeParse${grammar.interfaces[0]?.name || 'Node'}(data);

if (result.success) {
    console.log(result.data);
} else {
    console.error(result.error.errors);
}

// Direct parsing (throws on error)
try {
    const node = ${grammar.interfaces[0]?.name || 'Node'}Schema.parse(data);
    console.log(node);
} catch (error) {
    // Handle Zod validation error
}
\`\`\`

### Using Factories and Builders

\`\`\`typescript
import { ${grammar.interfaces[0]?.name || 'node'}Factory, ${grammar.interfaces[0]?.name || 'Node'}Builder } from './types/${grammar.projectName}-utilities';

// Using factory
const node = ${grammar.interfaces[0]?.name || 'node'}Factory.create({
    name: 'My Node'
});

// Using builder
const complexNode = new ${grammar.interfaces[0]?.name || 'Node'}Builder()
    .withId('custom-id')
    .withName('Complex Node')
    .build();
\`\`\`

## Best Practices

1. **Always validate external data**: Use validation functions or Zod schemas for data from APIs, files, or user input.

2. **Use branded types for IDs**: Prevents mixing up different ID types at compile time.

3. **Leverage discriminated unions**: Use type guards to narrow union types safely.

4. **Prefer immutable operations**: Use the provided utility functions for safe transformations.

5. **Handle validation errors gracefully**: Always check validation results before using data.

## Migration Guide

If you're migrating from untyped code:

1. Start by adding type imports to your files
2. Use type guards to narrow unknown types
3. Replace manual validation with generated validators
4. Use factories for test data creation
5. Gradually adopt Zod schemas for external data

## Troubleshooting

### Common Issues

1. **Type errors with IDs**: Make sure to use the branded type constructors:
   \`\`\`typescript
   import { NodeId } from './types/${grammar.projectName}-types';
   const id = NodeId.create('my-id');
   \`\`\`

2. **Validation failing unexpectedly**: Check the detailed error messages:
   \`\`\`typescript
   const result = validators.isNode(data);
   if (!result.valid) {
       console.log(JSON.stringify(result.errors, null, 2));
   }
   \`\`\`

3. **Zod parse errors**: Use safeParse for better error handling:
   \`\`\`typescript
   const result = NodeSchema.safeParse(data);
   if (!result.success) {
       console.log(result.error.format());
   }
   \`\`\`
`;

        const docsDir = path.join(outputDir, 'docs');
        await fs.ensureDir(docsDir);
        await fs.writeFile(path.join(docsDir, 'type-safety.md'), docsContent);
    }

    private async generateTestExamples(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const testContent = `/**
 * Type safety test examples for ${grammar.projectName}
 * @generated
 */

import { describe, test, expect } from 'vitest';
import { ${grammar.interfaces.map(i => i.name).join(', ')} } from '../src/types/${grammar.projectName}-types';
import { validators } from '../src/types/${grammar.projectName}-validators';
import { ${grammar.interfaces.map(i => `is${i.name}`).join(', ')} } from '../src/types/${grammar.projectName}-guards';
import { ${grammar.interfaces.map(i => `${i.name}Schema`).join(', ')} } from '../src/types/${grammar.projectName}-schemas';
import { ${grammar.interfaces.map(i => `${i.name.charAt(0).toLowerCase() + i.name.slice(1)}Factory`).join(', ')} } from '../src/types/${grammar.projectName}-utilities';

describe('Type Safety Tests', () => {
${grammar.interfaces.map(iface => `
    describe('${iface.name}', () => {
        test('should validate valid ${iface.name}', () => {
            const valid${iface.name} = ${iface.name.charAt(0).toLowerCase() + iface.name.slice(1)}Factory.create();
            
            // Test type guard
            expect(is${iface.name}(valid${iface.name})).toBe(true);
            
            // Test validator
            const validationResult = validators.is${iface.name}(valid${iface.name});
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = ${iface.name}Schema.safeParse(valid${iface.name});
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid ${iface.name}', () => {
            const invalid${iface.name} = { invalidProp: 'test' };
            
            // Test type guard
            expect(is${iface.name}(invalid${iface.name})).toBe(false);
            
            // Test validator
            const validationResult = validators.is${iface.name}(invalid${iface.name});
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = ${iface.name}Schema.safeParse(invalid${iface.name});
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid ${iface.name} with factory', () => {
            const created = ${iface.name.charAt(0).toLowerCase() + iface.name.slice(1)}Factory.create({
                ${iface.properties.filter(p => !p.optional).slice(0, 1).map(p => `${p.name}: ${p.type === 'string' ? "'test-value'" : p.type === 'number' ? '42' : 'true'}`).join(',\n                ')}
            });
            
            expect(is${iface.name}(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });
`).join('\n')}
});
`;

        const testsDir = path.join(outputDir, '__tests__');
        await fs.ensureDir(testsDir);
        await fs.writeFile(path.join(testsDir, 'type-safety.test.ts'), testContent);
    }
}