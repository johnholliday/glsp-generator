# Type Safety Documentation for workflow

## Overview

This document describes the type safety features generated for your workflow models.

## Generated Files

### TypeScript Declarations (`workflow-types.d.ts`)

Contains comprehensive type definitions including:
- Interface definitions for all grammar rules
- Branded types for type-safe IDs
- Namespace utilities for create/update/patch operations
- Utility types (DeepPartial, DeepReadonly, etc.)

### Validation Functions (`workflow-validators.ts`)

Runtime validation with detailed error reporting:
- Deep object validation
- Property type checking
- Required field validation
- Array bounds checking
- Reference validation

### Type Guards (`workflow-guards.ts`)

Type predicate functions for runtime type checking:
- User-defined type guards for each interface
- Discriminated union guards
- Array type guards
- Exhaustiveness checking helpers

### Zod Schemas (`workflow-schemas.ts`)

Zod schema definitions for parsing and validation:
- Schema for each type with refinements
- Branded type schemas
- Parse and safeParse functions
- Transform functions
- Partial and strict schemas

### Utility Functions (`workflow-utilities.ts`)

Helper functions and utilities:
- Factory functions for creating instances
- Builder pattern implementations
- Mapper functions for transformations
- Comparison and diff utilities

## Usage Examples

### Basic Type Checking

```typescript
import { isWorkflow } from './types/workflow-guards';
import { Workflow } from './types/workflow-types';

const data: unknown = { /* ... */ };

if (isWorkflow(data)) {
    // TypeScript now knows 'data' is of type Workflow
    console.log(data.id);
}
```

### Validation with Error Handling

```typescript
import { validators } from './types/workflow-validators';

const result = validators.isWorkflow(data);

if (result.valid) {
    // Use result.value with confidence
    console.log(result.value.id);
} else {
    // Handle validation errors
    result.errors?.forEach(error => {
        console.error(`${error.path}: ${error.message}`);
    });
}
```

### Using Zod Schemas

```typescript
import { WorkflowSchema, safeParseWorkflow } from './types/workflow-schemas';

// Safe parsing with error handling
const result = safeParseWorkflow(data);

if (result.success) {
    console.log(result.data);
} else {
    console.error(result.error.errors);
}

// Direct parsing (throws on error)
try {
    const node = WorkflowSchema.parse(data);
    console.log(node);
} catch (error) {
    // Handle Zod validation error
}
```

### Using Factories and Builders

```typescript
import { WorkflowFactory, WorkflowBuilder } from './types/workflow-utilities';

// Using factory
const node = WorkflowFactory.create({
    name: 'My Node'
});

// Using builder
const complexNode = new WorkflowBuilder()
    .withId('custom-id')
    .withName('Complex Node')
    .build();
```

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
   ```typescript
   import { NodeId } from './types/workflow-types';
   const id = NodeId.create('my-id');
   ```

2. **Validation failing unexpectedly**: Check the detailed error messages:
   ```typescript
   const result = validators.isNode(data);
   if (!result.valid) {
       console.log(JSON.stringify(result.errors, null, 2));
   }
   ```

3. **Zod parse errors**: Use safeParse for better error handling:
   ```typescript
   const result = NodeSchema.safeParse(data);
   if (!result.success) {
       console.log(result.error.format());
   }
   ```
