import * as path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { DeclarationGenerator, DeclarationGeneratorOptions } from './declaration-generator.js';
import { ValidationGenerator, ValidationGeneratorOptions } from './validation-generator.js';
import { GuardGenerator, GuardGeneratorOptions } from './guard-generator.js';
import { ZodGenerator, ZodGeneratorOptions } from './zod-generator.js';
import { UtilityGenerator, UtilityGeneratorOptions } from './utility-generator.js';
import {
    ITypeSafetyGeneratorService,
    IFileSystemService,
    ILoggerService,
    IProgressService,
    ICacheService,
    IMetricsService,
    IEventService,
    ITemplateService
} from '../config/di/interfaces.js';
import { injectable, inject, postConstruct, preDestroy } from 'inversify';
import { TYPES } from '../config/di/types.inversify.js';
import { LogMethod } from '../utils/decorators/log-method.js';

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

/**
 * Type safety generator with comprehensive dependency injection support
 */
@injectable()
export class TypeSafetyGenerator implements ITypeSafetyGeneratorService {
    private declarationGenerator!: DeclarationGenerator;
    private validationGenerator!: ValidationGenerator;
    private guardGenerator!: GuardGenerator;
    private zodGenerator!: ZodGenerator;
    private utilityGenerator!: UtilityGenerator;
    private initialized = false;

    constructor(
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
        @inject(TYPES.IProgressService) private readonly progressService: IProgressService,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMetricsService) private readonly metrics: IMetricsService,
        @inject(TYPES.IEventService) private readonly eventService: IEventService,
        @inject(TYPES.ITemplateService) private readonly templateService: ITemplateService
    ) {
        this.logger.debug('TypeSafetyGenerator constructor called');
    }

    @postConstruct()
    private _initialize(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Initializing TypeSafetyGenerator');

        try {
            // Initialize sub-generators
            this.declarationGenerator = new DeclarationGenerator();
            this.validationGenerator = new ValidationGenerator();
            this.guardGenerator = new GuardGenerator();
            this.zodGenerator = new ZodGenerator();
            this.utilityGenerator = new UtilityGenerator();

            this.setupEventListeners();
            this.initialized = true;

            this.logger.info('TypeSafetyGenerator initialized successfully');
            this.eventService.emit('type-safety.initialized');
        } catch (error) {
            this.logger.error('Failed to initialize TypeSafetyGenerator', error as Error);
            throw error;
        }
    }

    @preDestroy()
    private _cleanup(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Cleaning up TypeSafetyGenerator resources');
        this.initialized = false;
        this.eventService.emit('type-safety.disposed');
    }

    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: TypeSafetyOptions
    ): Promise<TypeSafetyResult> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('type-safety.generate.attempts');

        try {
            this.logger.info('Starting type safety generation', {
                projectName: grammar.projectName,
                outputDir,
                interfaceCount: grammar.interfaces.length,
                typeCount: grammar.types.length
            });

            // Check cache first
            const cacheKey = this.generateCacheKey(grammar, config, outputDir, options);
            const cached = await this.cache.get<TypeSafetyResult>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached type safety generation result');
                this.metrics.incrementCounter('type-safety.generate.cache_hits');
                return cached;
            }

            const opts = this.normalizeOptions(options);
            const filesGenerated: string[] = [];
            const errors: string[] = [];

            // Create progress reporter
            const progress = this.progressService.createProgress('🔒 Generating type safety features', 7);

            this.eventService.emit('type-safety.generation.started', {
                grammar,
                config,
                outputDir,
                options: opts
            });

            try {
                // Generate TypeScript declarations
                if (opts.declarations !== false) {
                    progress.report(1, 'Generating TypeScript declarations...');
                    this.logger.debug('Generating TypeScript declarations');

                    try {
                        const declOptions = typeof opts.declarations === 'object' ? opts.declarations : {};
                        await this.declarationGenerator.generate(grammar, outputDir, declOptions);
                        filesGenerated.push(`${grammar.projectName}-types.d.ts`);
                        this.metrics.incrementCounter('type-safety.declarations.success');
                    } catch (error) {
                        const errorMsg = `Failed to generate declarations: ${(error as Error).message}`;
                        errors.push(errorMsg);
                        this.logger.error('Declaration generation failed', error as Error);
                        this.metrics.incrementCounter('type-safety.declarations.errors');
                    }
                }

                // Generate validation functions
                if (opts.validation !== false) {
                    progress.report(1, 'Generating validation functions...');
                    this.logger.debug('Generating validation functions');

                    try {
                        const valOptions = typeof opts.validation === 'object' ? opts.validation : {};
                        await this.validationGenerator.generate(grammar, outputDir, valOptions);
                        filesGenerated.push(`${grammar.projectName}-validators.ts`);
                        this.metrics.incrementCounter('type-safety.validation.success');
                    } catch (error) {
                        const errorMsg = `Failed to generate validation: ${(error as Error).message}`;
                        errors.push(errorMsg);
                        this.logger.error('Validation generation failed', error as Error);
                        this.metrics.incrementCounter('type-safety.validation.errors');
                    }
                }

                // Generate type guards
                if (opts.guards !== false) {
                    progress.report(1, 'Generating type guards...');
                    this.logger.debug('Generating type guards');

                    try {
                        const guardOptions = typeof opts.guards === 'object' ? opts.guards : {};
                        await this.guardGenerator.generate(grammar, outputDir, guardOptions);
                        filesGenerated.push(`${grammar.projectName}-guards.ts`);
                        this.metrics.incrementCounter('type-safety.guards.success');
                    } catch (error) {
                        const errorMsg = `Failed to generate guards: ${(error as Error).message}`;
                        errors.push(errorMsg);
                        this.logger.error('Guard generation failed', error as Error);
                        this.metrics.incrementCounter('type-safety.guards.errors');
                    }
                }

                // Generate Zod schemas
                if (opts.zodSchemas !== false) {
                    progress.report(1, 'Generating Zod schemas...');
                    this.logger.debug('Generating Zod schemas');

                    try {
                        const zodOptions = typeof opts.zodSchemas === 'object' ? opts.zodSchemas : {};
                        await this.zodGenerator.generate(grammar, outputDir, zodOptions);
                        filesGenerated.push(`${grammar.projectName}-schemas.ts`);
                        this.metrics.incrementCounter('type-safety.zod.success');
                    } catch (error) {
                        const errorMsg = `Failed to generate Zod schemas: ${(error as Error).message}`;
                        errors.push(errorMsg);
                        this.logger.error('Zod schema generation failed', error as Error);
                        this.metrics.incrementCounter('type-safety.zod.errors');
                    }
                }

                // Generate utility functions
                if (opts.utilities !== false) {
                    progress.report(1, 'Generating utility functions...');
                    this.logger.debug('Generating utility functions');

                    try {
                        const utilOptions = typeof opts.utilities === 'object' ? opts.utilities : {};
                        await this.utilityGenerator.generate(grammar, outputDir, utilOptions);
                        filesGenerated.push(`${grammar.projectName}-utilities.ts`);
                        this.metrics.incrementCounter('type-safety.utilities.success');
                    } catch (error) {
                        const errorMsg = `Failed to generate utilities: ${(error as Error).message}`;
                        errors.push(errorMsg);
                        this.logger.error('Utility generation failed', error as Error);
                        this.metrics.incrementCounter('type-safety.utilities.errors');
                    }
                }

                // Generate type safety documentation
                progress.report(1, 'Generating documentation...');
                try {
                    await this.generateDocumentation(grammar, outputDir);
                    filesGenerated.push('type-safety.md');
                    this.metrics.incrementCounter('type-safety.docs.success');
                } catch (error) {
                    const errorMsg = `Failed to generate documentation: ${(error as Error).message}`;
                    errors.push(errorMsg);
                    this.logger.error('Documentation generation failed', error as Error);
                    this.metrics.incrementCounter('type-safety.docs.errors');
                }

                // Generate test examples
                progress.report(1, 'Generating test examples...');
                try {
                    await this.generateTestExamples(grammar, outputDir);
                    filesGenerated.push('type-safety.test.ts');
                    this.metrics.incrementCounter('type-safety.tests.success');
                } catch (error) {
                    const errorMsg = `Failed to generate test examples: ${(error as Error).message}`;
                    errors.push(errorMsg);
                    this.logger.error('Test example generation failed', error as Error);
                    this.metrics.incrementCounter('type-safety.tests.errors');
                }

                const success = errors.length === 0;
                const duration = performance.now() - startTime;

                if (success) {
                    progress.complete(`Generated ${filesGenerated.length} files successfully`);
                    this.logger.info('Type safety features generated successfully', {
                        projectName: grammar.projectName,
                        filesGenerated: filesGenerated.length,
                        duration: Math.round(duration)
                    });
                    this.metrics.incrementCounter('type-safety.generate.success');
                } else {
                    progress.fail(new Error(`Generation completed with ${errors.length} errors`));
                    this.logger.warn('Type safety generation completed with errors', {
                        projectName: grammar.projectName,
                        filesGenerated: filesGenerated.length,
                        errorCount: errors.length,
                        duration: Math.round(duration)
                    });
                    this.metrics.incrementCounter('type-safety.generate.partial_success');
                }

                const result: TypeSafetyResult = {
                    success,
                    filesGenerated,
                    errors: errors.length > 0 ? errors : undefined
                };

                // Cache successful results
                if (success) {
                    await this.cache.set(cacheKey, result, 3600000); // 1 hour TTL
                }

                this.metrics.recordDuration('type-safety.generate', duration);

                this.eventService.emit('type-safety.generation.completed', {
                    grammar,
                    result,
                    duration
                });

                return result;

            } catch (error) {
                progress.fail(error as Error);
                throw error;
            }

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('type-safety.generate.error', duration);
            this.metrics.incrementCounter('type-safety.generate.errors');

            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Type safety generation failed', error as Error, {
                projectName: grammar.projectName,
                outputDir
            });

            this.eventService.emit('type-safety.generation.failed', {
                grammar,
                error,
                duration
            });

            return {
                success: false,
                filesGenerated: [],
                errors: [errorMessage]
            };
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('TypeSafetyGenerator not initialized. Call initialize() first.');
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

    private generateCacheKey(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: TypeSafetyOptions
    ): string {
        const data = {
            grammar: {
                projectName: grammar.projectName,
                interfaceCount: grammar.interfaces.length,
                typeCount: grammar.types.length,
                interfaceNames: grammar.interfaces.map(i => i.name).sort()
            },
            config: {
                extension: config.extension.name,
                version: config.extension.version
            },
            outputDir,
            options
        };

        return `type-safety:${this.hashObject(data)}`;
    }

    private hashObject(obj: any): string {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    private setupEventListeners(): void {
        // Listen for configuration changes that might affect generation
        this.eventService.on('config.changed', (data) => {
            if (data?.section === 'type-safety') {
                this.logger.debug('Type safety configuration changed, clearing cache');
                this.cache.clear();
            }
        });
    }

    private async generateDocumentation(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const docsContent = await this.templateService.renderString(`# Type Safety Documentation for {{projectName}}

## Overview

This document describes the type safety features generated for your {{projectName}} models.

## Generated Files

### TypeScript Declarations (\`{{projectName}}-types.d.ts\`)

Contains comprehensive type definitions including:
- Interface definitions for all grammar rules
- Branded types for type-safe IDs
- Namespace utilities for create/update/patch operations
- Utility types (DeepPartial, DeepReadonly, etc.)

### Validation Functions (\`{{projectName}}-validators.ts\`)

Runtime validation with detailed error reporting:
- Deep object validation
- Property type checking
- Required field validation
- Array bounds checking
- Reference validation

### Type Guards (\`{{projectName}}-guards.ts\`)

Type predicate functions for runtime type checking:
- User-defined type guards for each interface
- Discriminated union guards
- Array type guards
- Exhaustiveness checking helpers

### Zod Schemas (\`{{projectName}}-schemas.ts\`)

Zod schema definitions for parsing and validation:
- Schema for each type with refinements
- Branded type schemas
- Parse and safeParse functions
- Transform functions
- Partial and strict schemas

### Utility Functions (\`{{projectName}}-utilities.ts\`)

Helper functions and utilities:
- Factory functions for creating instances
- Builder pattern implementations
- Mapper functions for transformations
- Comparison and diff utilities

## Usage Examples

### Basic Type Checking

\`\`\`typescript
import { is{{firstInterfaceName}} } from './types/{{projectName}}-guards';
import { {{firstInterfaceName}} } from './types/{{projectName}}-types';

const data: unknown = { /* ... */ };

if (is{{firstInterfaceName}}(data)) {
    // TypeScript now knows 'data' is of type {{firstInterfaceName}}
    console.log(data.id);
}
\`\`\`

### Validation with Error Handling

\`\`\`typescript
import { validators } from './types/{{projectName}}-validators';

const result = validators.is{{firstInterfaceName}}(data);

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
import { {{firstInterfaceName}}Schema, safeParse{{firstInterfaceName}} } from './types/{{projectName}}-schemas';

// Safe parsing with error handling
const result = safeParse{{firstInterfaceName}}(data);

if (result.success) {
    console.log(result.data);
} else {
    console.error(result.error.errors);
}

// Direct parsing (throws on error)
try {
    const node = {{firstInterfaceName}}Schema.parse(data);
    console.log(node);
} catch (error) {
    // Handle Zod validation error
}
\`\`\`

### Using Factories and Builders

\`\`\`typescript
import { {{firstInterfaceNameLower}}Factory, {{firstInterfaceName}}Builder } from './types/{{projectName}}-utilities';

// Using factory
const node = {{firstInterfaceNameLower}}Factory.create({
    name: 'My Node'
});

// Using builder
const complexNode = new {{firstInterfaceName}}Builder()
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
   import { NodeId } from './types/{{projectName}}-types';
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
`, {
            projectName: grammar.projectName,
            firstInterfaceName: grammar.interfaces[0]?.name || 'Node',
            firstInterfaceNameLower: (grammar.interfaces[0]?.name || 'node').charAt(0).toLowerCase() + (grammar.interfaces[0]?.name || 'node').slice(1)
        });

        const docsDir = path.join(outputDir, 'docs');
        await this.fileSystem.ensureDir(docsDir);
        await this.fileSystem.writeFile(path.join(docsDir, 'type-safety.md'), docsContent);
    }

    private async generateTestExamples(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const testContent = await this.templateService.renderString(`/**
 * Type safety test examples for {{projectName}}
 * @generated
 */

import { describe, test, expect } from 'vitest';
import { {{interfaceNames}} } from '../src/types/{{projectName}}-types';
import { validators } from '../src/types/{{projectName}}-validators';
import { {{guardNames}} } from '../src/types/{{projectName}}-guards';
import { {{schemaNames}} } from '../src/types/{{projectName}}-schemas';
import { {{factoryNames}} } from '../src/types/{{projectName}}-utilities';

describe('Type Safety Tests', () => {
{{#each interfaces}}
    describe('{{name}}', () => {
        test('should validate valid {{name}}', () => {
            const valid{{name}} = {{nameToLower}}Factory.create();
            
            // Test type guard
            expect(is{{name}}(valid{{name}})).toBe(true);
            
            // Test validator
            const validationResult = validators.is{{name}}(valid{{name}});
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = {{name}}Schema.safeParse(valid{{name}});
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid {{name}}', () => {
            const invalid{{name}} = { invalidProp: 'test' };
            
            // Test type guard
            expect(is{{name}}(invalid{{name}})).toBe(false);
            
            // Test validator
            const validationResult = validators.is{{name}}(invalid{{name}});
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = {{name}}Schema.safeParse(invalid{{name}});
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid {{name}} with factory', () => {
            const created = {{nameToLower}}Factory.create({
                {{#if properties}}
                {{#each properties}}
                {{#unless optional}}
                {{name}}: {{#if (eq type 'string')}}'test-value'{{else}}{{#if (eq type 'number')}}42{{else}}true{{/if}}{{/if}}{{#unless @last}},{{/unless}}
                {{/unless}}
                {{/each}}
                {{/if}}
            });
            
            expect(is{{name}}(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });
{{/each}}
});
`, {
            projectName: grammar.projectName,
            interfaceNames: grammar.interfaces.map(i => i.name).join(', '),
            guardNames: grammar.interfaces.map(i => `is${i.name}`).join(', '),
            schemaNames: grammar.interfaces.map(i => `${i.name}Schema`).join(', '),
            factoryNames: grammar.interfaces.map(i => `${i.name.charAt(0).toLowerCase() + i.name.slice(1)}Factory`).join(', '),
            interfaces: grammar.interfaces.map(iface => ({
                ...iface,
                nameToLower: iface.name.charAt(0).toLowerCase() + iface.name.slice(1)
            }))
        });

        const testsDir = path.join(outputDir, '__tests__');
        await this.fileSystem.ensureDir(testsDir);
        await this.fileSystem.writeFile(path.join(testsDir, 'type-safety.test.ts'), testContent);
    }
}