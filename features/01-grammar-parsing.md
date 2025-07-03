# Grammar Parsing Feature

## Overview
The Grammar Parsing feature is the foundation of the GLSP Generator. It takes Langium grammar files as input and transforms them into a structured Abstract Syntax Tree (AST) that can be used for code generation.

## Purpose
- Parse `.langium` grammar files into a structured format
- Validate grammar syntax and semantics
- Extract language constructs (interfaces, types, properties)
- Provide a clean API for downstream processing

## Current Implementation

### Components
1. **Langium Grammar Parser** (`src/utils/langium-grammar-parser.ts`)
   - Uses Langium's official `createLangiumGrammarServices()`
   - Provides accurate parsing with full language support
   - Returns structured `GrammarAST`

2. **Legacy Parser** (`src/utils/langium-parser.ts`)
   - Manual parsing implementation
   - Being phased out in favor of AST parser
   - Kept for backward compatibility

3. **Type System** (`src/types/grammar.ts`)
   - Defines TypeScript interfaces for grammar elements
   - Core types: `GrammarAST`, `Interface`, `Property`, `TypeAlias`
   - Property modifiers: optional, array, reference

### Supported Constructs
```langium
// Interfaces with inheritance
interface Node extends BaseNode {
  name: string
  children: Node[]
  parent?: @Node  // Reference with @ symbol
}

// Type aliases and unions
type NodeType = 'task' | 'gateway' | 'event'
type Element = Node | Edge

// Property modifiers
interface Example {
  required: string      // Required property
  optional?: string     // Optional with ?
  array: string[]       // Array with []
  reference: @Node      // Reference with @
}
```

## Technical Details

### Input
- Langium grammar files (`.langium` extension)
- Can handle grammars up to ~1000 lines efficiently
- Supports complex nested structures

### Output
```typescript
interface GrammarAST {
  name: string
  imports: Import[]
  rules: Rule[]
  interfaces: Interface[]
  types: TypeAlias[]
}

interface Interface {
  name: string
  superTypes: string[]
  properties: Property[]
}

interface Property {
  name: string
  type: PropertyType
  isOptional: boolean
  isArray: boolean
  isReference: boolean
}
```

### Error Handling
- Syntax errors with line/column information
- Semantic validation (undefined types, circular references)
- Clear error messages for debugging

## Usage Example
```typescript
import { parseGrammar } from './utils/langium-grammar-parser.js';

const ast = await parseGrammar('path/to/grammar.langium');
if (!ast) {
  throw new Error('Failed to parse grammar');
}

// Access parsed elements
for (const interface of ast.interfaces) {
  console.log(`Interface: ${interface.name}`);
  for (const prop of interface.properties) {
    console.log(`  - ${prop.name}: ${prop.type}`);
  }
}
```

## Configuration Options
- **validateReferences**: Check that all referenced types exist
- **allowCircularDeps**: Whether to allow circular dependencies
- **strictMode**: Enable additional validation rules

## Performance Considerations
- Memory usage scales with grammar size
- Parsing is synchronous (consider chunking for large files)
- Caching available for repeated parsing

## Future Enhancements
1. **Streaming Parser**: Handle extremely large grammars
2. **Incremental Parsing**: Parse only changed portions
3. **Grammar Extensions**: Support custom Langium extensions
4. **Better Error Recovery**: Continue parsing after errors
5. **Grammar Composition**: Support importing other grammars

## Dependencies
- `langium`: Core parsing library
- `chevrotain`: Underlying parser generator
- `vscode-languageserver-types`: LSP type definitions

## Testing
- Unit tests for all grammar constructs
- Integration tests with real-world grammars
- Performance benchmarks for large files
- Error case coverage

## Related Features
- [Validation & Linting](./05-validation-linting.md)
- [Type System](./07-type-safety.md)
- [Code Generation](./02-code-generation.md)