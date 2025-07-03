# Type Safety Feature

## Overview
The Type Safety feature generates comprehensive TypeScript type definitions, runtime validators, type guards, and schema definitions from Langium grammars. It ensures type safety throughout the generated GLSP extension.

## Purpose
- Generate accurate TypeScript type definitions
- Provide runtime validation for untrusted data
- Create type guards for safe type narrowing
- Generate Zod schemas for advanced validation
- Ensure type consistency across client/server

## Current Implementation

### Components

#### 1. **Type Safety Generator** (`src/type-safety/type-safety-generator.ts`)
- Orchestrates all type safety generation
- Manages feature selection
- Handles output organization
- Generates documentation

#### 2. **Declaration Generator** (`src/type-safety/declaration-generator.ts`)
- TypeScript `.d.ts` file generation
- Interface and type alias definitions
- Proper inheritance handling
- JSDoc comment generation

#### 3. **Validation Generator** (`src/type-safety/validation-generator.ts`)
- Runtime validation functions
- Deep property validation
- Custom error messages
- Performance optimizations

#### 4. **Guard Generator** (`src/type-safety/guard-generator.ts`)
- Type predicate functions
- Narrowing helpers
- Composite type guards
- Array type guards

#### 5. **Zod Generator** (`src/type-safety/zod-generator.ts`)
- Zod schema generation
- Advanced validation rules
- Schema composition
- Custom refinements

### Generated Output

#### TypeScript Declarations
```typescript
// generated/types/my-dsl-types.d.ts
export interface Node {
  id: string
  name: string
  position: Position
  children?: Node[]
  parent?: Node
}

export interface Position {
  x: number
  y: number
}

export type NodeType = 'task' | 'gateway' | 'event'

export interface Edge {
  id: string
  source: string
  target: string
  label?: string
}
```

#### Validation Functions
```typescript
// generated/types/my-dsl-validators.ts
export function validateNode(obj: unknown): ValidationResult<Node> {
  if (!isObject(obj)) {
    return { valid: false, errors: ['Expected object'] }
  }
  
  const errors: string[] = []
  
  if (!isString(obj.id)) {
    errors.push('Property "id" must be a string')
  }
  
  if (!isString(obj.name)) {
    errors.push('Property "name" must be a string')
  }
  
  if (!validatePosition(obj.position).valid) {
    errors.push('Invalid position')
  }
  
  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) {
      errors.push('Property "children" must be an array')
    } else {
      obj.children.forEach((child, i) => {
        const result = validateNode(child)
        if (!result.valid) {
          errors.push(`Invalid child at index ${i}`)
        }
      })
    }
  }
  
  return errors.length === 0
    ? { valid: true, value: obj as Node }
    : { valid: false, errors }
}
```

#### Type Guards
```typescript
// generated/types/my-dsl-guards.ts
export function isNode(obj: unknown): obj is Node {
  return (
    isObject(obj) &&
    isString(obj.id) &&
    isString(obj.name) &&
    isPosition(obj.position) &&
    (obj.children === undefined || isNodeArray(obj.children)) &&
    (obj.parent === undefined || isNode(obj.parent))
  )
}

export function isNodeArray(arr: unknown): arr is Node[] {
  return Array.isArray(arr) && arr.every(isNode)
}

export function isNodeType(value: unknown): value is NodeType {
  return value === 'task' || value === 'gateway' || value === 'event'
}
```

#### Zod Schemas
```typescript
// generated/types/my-dsl-schemas.ts
import { z } from 'zod'

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
})

export const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    position: PositionSchema,
    children: z.array(NodeSchema).optional(),
    parent: NodeSchema.optional()
  })
)

export const NodeTypeSchema = z.enum(['task', 'gateway', 'event'])

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional()
})
```

## Usage Examples

### Basic Type Safety Generation
```bash
# Generate all type safety features
glsp-generator types my-dsl.langium -o ./types

# Generate specific features
glsp-generator types my-dsl.langium --declarations --guards

# With custom options
glsp-generator types my-dsl.langium \
  --strict \
  --runtime-validation \
  --zod-schemas
```

### Using Generated Types
```typescript
import { Node, isNode, validateNode, NodeSchema } from './types'

// Type-safe usage
const node: Node = {
  id: '1',
  name: 'Start',
  position: { x: 100, y: 100 }
}

// Runtime validation
const untrustedData = JSON.parse(request.body)
const validation = validateNode(untrustedData)

if (validation.valid) {
  // validation.value is typed as Node
  processNode(validation.value)
} else {
  console.error('Validation errors:', validation.errors)
}

// Type guards
function processElement(element: unknown) {
  if (isNode(element)) {
    // element is narrowed to Node type
    console.log(element.name)
  }
}

// Zod validation
try {
  const node = NodeSchema.parse(untrustedData)
  // node is fully typed
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors)
  }
}
```

### Configuration Options
```json
{
  "typeSafety": {
    "declarations": {
      "enabled": true,
      "strict": true,
      "includeComments": true
    },
    "validation": {
      "enabled": true,
      "throwOnError": false,
      "customMessages": true
    },
    "guards": {
      "enabled": true,
      "exhaustive": true
    },
    "zodSchemas": {
      "enabled": true,
      "strict": true,
      "customRefinements": "./refinements.ts"
    },
    "utilities": {
      "factories": true,
      "builders": true,
      "deepClone": true
    }
  }
}
```

## Advanced Features

### Custom Validators
```typescript
// Custom validation rules
export function validateBusinessRules(node: Node): ValidationResult<Node> {
  const baseValidation = validateNode(node)
  if (!baseValidation.valid) return baseValidation
  
  const errors: string[] = []
  
  // Custom business rule
  if (node.name.length > 50) {
    errors.push('Node name must not exceed 50 characters')
  }
  
  // Check references
  if (node.parent && node.parent.id === node.id) {
    errors.push('Node cannot be its own parent')
  }
  
  return errors.length === 0
    ? { valid: true, value: node }
    : { valid: false, errors }
}
```

### Type Utilities
```typescript
// generated/types/my-dsl-utilities.ts

// Factory functions
export function createNode(partial: Partial<Node>): Node {
  return {
    id: partial.id ?? generateId(),
    name: partial.name ?? 'New Node',
    position: partial.position ?? { x: 0, y: 0 },
    children: partial.children,
    parent: partial.parent
  }
}

// Builder pattern
export class NodeBuilder {
  private node: Partial<Node> = {}
  
  withId(id: string): this {
    this.node.id = id
    return this
  }
  
  withName(name: string): this {
    this.node.name = name
    return this
  }
  
  build(): Node {
    return createNode(this.node)
  }
}

// Deep clone
export function cloneNode(node: Node): Node {
  return {
    ...node,
    position: { ...node.position },
    children: node.children?.map(cloneNode),
    parent: node.parent ? cloneNode(node.parent) : undefined
  }
}
```

## Best Practices
1. **Use Strict Mode**: Enable strict TypeScript checks
2. **Validate Boundaries**: Always validate external data
3. **Prefer Type Guards**: Use for type narrowing
4. **Cache Validators**: Reuse validation functions
5. **Document Types**: Add JSDoc comments

## Future Enhancements
1. **JSON Schema**: Generate JSON Schema definitions
2. **GraphQL Types**: Generate GraphQL type definitions
3. **OpenAPI Schemas**: Generate OpenAPI specifications
4. **Runtime Contracts**: Contract-based validation
5. **Type Migrations**: Automatic type version migration

## Dependencies
- `typescript`: Type system foundation
- `zod`: Schema validation library
- `ts-morph`: TypeScript AST manipulation

## Testing
- Type definition accuracy tests
- Validation correctness tests
- Guard exhaustiveness tests
- Performance benchmarks
- Edge case coverage

## Related Features
- [Grammar Parsing](./01-grammar-parsing.md)
- [Code Generation](./02-code-generation.md)
- [Validation & Linting](./05-validation-linting.md)