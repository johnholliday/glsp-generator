# Prompt 012: Enhanced Type Safety Features

## Objective
Generate comprehensive type safety features from Langium grammars, including TypeScript declaration files, runtime validation functions, type guards, and Zod schemas for robust type checking.

## Background
Generated extensions need strong type safety. Currently, type definitions are basic. Enhanced type safety would prevent runtime errors and improve developer experience.

## Requirements

### 1. TypeScript Declaration Files
Generate comprehensive `.d.ts` files:
- Complete type definitions
- Generic type parameters
- Discriminated unions
- Branded types
- Utility types
- JSDoc comments

### 2. Runtime Validation
Generate validation functions:
- Deep object validation
- Property type checking
- Required field validation
- Array bounds checking
- Reference validation
- Custom constraints

### 3. Type Guards
Generate type guard functions:
- User-defined type guards
- Discriminated union guards
- Nested type guards
- Array type guards
- Exhaustiveness checking

### 4. Zod Schema Generation
Generate Zod schemas:
- Schema for each type
- Nested schemas
- Optional/required handling
- Array schemas
- Union schemas
- Custom validations

### 5. Type Utilities
Generate utility types:
- DeepPartial types
- DeepReadonly types
- Pick/Omit utilities
- Diff types
- Patch types
- Factory types

### 6. Type Safety Documentation
Generate type documentation:
- Type relationship diagrams
- Usage examples
- Best practices
- Common pitfalls
- Migration guides

## Implementation Details

### Type Declaration Generation
```typescript
// Generated from grammar
export interface StateMachine {
  readonly id: NodeId;
  name: string;
  states: State[];
  transitions: Transition[];
  initialState: StateReference;
}

export type NodeId = string & { readonly __brand: unique symbol };
export type StateReference = NodeId & { readonly __stateRef: unique symbol };

export namespace StateMachine {
  export type Create = Omit<StateMachine, 'id'> & { id?: NodeId };
  export type Update = DeepPartial<Omit<StateMachine, 'id'>>;
  export type Patch = Partial<Update>;
}

// Branded type constructors
export const NodeId = {
  create(id: string): NodeId {
    return id as NodeId;
  },
  validate(id: unknown): id is NodeId {
    return typeof id === 'string' && id.length > 0;
  }
};
```

### Runtime Validation Functions
```typescript
export const validators = {
  isStateMachine(obj: unknown): ValidationResult<StateMachine> {
    const errors: ValidationError[] = [];
    
    if (!isObject(obj)) {
      return { valid: false, errors: [{ path: '', message: 'Not an object' }] };
    }
    
    // Validate required properties
    if (!isString(obj.name)) {
      errors.push({ path: 'name', message: 'Required string' });
    }
    
    if (!Array.isArray(obj.states)) {
      errors.push({ path: 'states', message: 'Required array' });
    } else {
      obj.states.forEach((state, i) => {
        const result = validators.isState(state);
        if (!result.valid) {
          errors.push(...result.errors.map(e => ({
            ...e,
            path: `states[${i}].${e.path}`
          })));
        }
      });
    }
    
    // Validate references
    if (obj.initialState) {
      const validRef = obj.states.some(s => s.id === obj.initialState);
      if (!validRef) {
        errors.push({
          path: 'initialState',
          message: `Invalid reference: ${obj.initialState}`
        });
      }
    }
    
    return errors.length === 0 
      ? { valid: true, value: obj as StateMachine }
      : { valid: false, errors };
  }
};
```

### Type Guards
```typescript
export function isStateMachine(obj: unknown): obj is StateMachine {
  return validators.isStateMachine(obj).valid;
}

export function isState(obj: unknown): obj is State {
  return (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'state' &&
    'name' in obj &&
    typeof obj.name === 'string'
  );
}

// Discriminated union guards
export function isNodeType<T extends Node['type']>(
  node: Node,
  type: T
): node is Extract<Node, { type: T }> {
  return node.type === type;
}

// Exhaustiveness checking
export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`);
}
```

### Zod Schema Generation
```typescript
import { z } from 'zod';

export const NodeIdSchema = z.string().min(1).brand('NodeId');
export const StateReferenceSchema = NodeIdSchema.brand('StateReference');

export const StateSchema = z.object({
  id: NodeIdSchema,
  type: z.literal('state'),
  name: z.string(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  onEntry: z.array(ActionSchema).optional(),
  onExit: z.array(ActionSchema).optional()
});

export const StateMachineSchema = z.object({
  id: NodeIdSchema,
  name: z.string(),
  states: z.array(StateSchema).min(1),
  transitions: z.array(TransitionSchema),
  initialState: StateReferenceSchema
}).refine(
  (sm) => sm.states.some(s => s.id === sm.initialState),
  { message: "Initial state must reference an existing state" }
);

// Type inference
export type StateMachine = z.infer<typeof StateMachineSchema>;

// Parse with validation
export function parseStateMachine(data: unknown): StateMachine {
  return StateMachineSchema.parse(data);
}

// Safe parse
export function safeParseStateMachine(data: unknown) {
  return StateMachineSchema.safeParse(data);
}
```

### Type Utilities
```typescript
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

// Factory utilities
export type Factory<T> = {
  create(partial?: Partial<T>): T;
  createMany(count: number, partial?: Partial<T>): T[];
  validate(obj: unknown): obj is T;
  parse(obj: unknown): T;
};
```

## Acceptance Criteria

1. ✅ Complete TypeScript declarations generated
2. ✅ Runtime validation catches all type errors
3. ✅ Type guards for all generated types
4. ✅ Zod schemas with custom validations
5. ✅ Utility types for common operations
6. ✅ Type safety documentation generated
7. ✅ 100% type coverage

## Testing Requirements

Create type safety tests:
- Test type inference
- Test runtime validation
- Test type guards
- Test Zod schema validation
- Test edge cases
- Test error messages

## Files to Create/Modify

1. `src/type-safety/declaration-generator.ts`
2. `src/type-safety/validation-generator.ts`
3. `src/type-safety/guard-generator.ts`
4. `src/type-safety/zod-generator.ts`
5. `src/type-safety/utility-generator.ts`
6. Templates for type generation
7. Update generator with type safety options

## Dependencies
- zod (for schema generation)

## Notes
- Consider io-ts as alternative to Zod
- Type generation should be incremental
- Consider generating test data factories
- Performance of runtime validation matters
- Consider JSON Schema generation too
