# Langium AST-Based Architecture

## Overview

The GLSP Generator has been refactored to use Langium's native AST (Abstract Syntax Tree) exclusively, eliminating the need for custom AST representations. This approach leverages Langium's powerful grammar processing capabilities directly.

## Key Design Decisions

### 1. Direct Langium AST Usage

Instead of converting Langium's Grammar AST to a custom format, we now:
- Use `Grammar` type from Langium directly throughout the system
- Leverage Langium's built-in validation and type resolution
- Utilize Langium's workspace management for imports

```typescript
// Before: Custom AST
interface GrammarAST {
  name: string;
  rules: Rule[];
  interfaces: Interface[];
  // ... custom structure
}

// After: Direct Langium Grammar
import { Grammar } from 'langium';
// Grammar contains all necessary information
```

### 2. Simplified Parser Interface

The parser now returns Langium's native types:

```typescript
interface IParser {
  // Returns Langium Grammar directly
  parse(grammarPath: string, options?: ParseOptions): Promise<Grammar>;
  
  // Access to Langium document for advanced use cases
  getDocument(grammarPath: string): Promise<LangiumDocument>;
  
  // Direct access to Langium services
  getServices(): LangiumServices;
}
```

### 3. Template Engine Integration

Templates now consume Langium Grammar directly:

```typescript
interface ITemplateEngine {
  render(
    grammar: Grammar,  // Direct Grammar usage
    context: TemplateContext,
    options?: RenderOptions
  ): Promise<GeneratedFile[]>;
}
```

### 4. Validation Using Langium's API

Validation leverages Langium's built-in validation framework:

```typescript
interface IValidator {
  // Validates using Langium's validation services
  validate(grammar: Grammar, context?: ValidationContext): Promise<ValidationResult>;
  
  // Direct document validation
  validateDocument(document: LangiumDocument, context?: ValidationContext): Promise<ValidationResult>;
}
```

## Benefits of This Approach

### 1. **Simplicity**
- No custom AST conversion layer
- Fewer interfaces and abstractions
- Direct use of Langium's well-tested parser

### 2. **Correctness**
- Langium handles complex grammar features correctly
- Built-in support for imports, references, and scoping
- Validation is consistent with Langium's semantics

### 3. **Performance**
- No overhead from AST conversion
- Langium's optimized parsing and caching
- Direct access to parsed results

### 4. **Maintainability**
- Less code to maintain
- Updates to Langium automatically available
- Clear separation of concerns

### 5. **Feature Completeness**
- Access to all Langium grammar features
- Support for advanced features like cross-references
- Built-in error recovery and diagnostics

## Architecture Components

### Parser Service
```typescript
@injectable()
export class LangiumGrammarParser implements IParser {
  private readonly services: LangiumServices;
  
  async parse(grammarPath: string, options?: ParseOptions): Promise<Grammar> {
    // Uses Langium's DocumentBuilder directly
    // Returns native Grammar object
  }
}
```

### Template Processing
Templates access Grammar properties directly:
```handlebars
{{#each grammar.rules}}
  // Process rule using Langium's structure
  export class {{name}}Node {
    {{#each properties}}
      {{name}}: {{type}};
    {{/each}}
  }
{{/each}}
```

### Validation Pipeline
```typescript
// Custom validators work with Langium's ValidationAcceptor
interface IValidationRule {
  validate(
    grammar: Grammar,
    acceptor: ValidationAcceptor,
    context: ValidationContext
  ): Promise<void>;
}
```

## Migration from Custom AST

### What Changed
1. **No AST Builder**: Removed custom AST building logic
2. **No Type Resolver**: Langium handles type resolution
3. **No Import Resolver**: Langium's workspace manages imports
4. **Direct Grammar Access**: Templates and validators use Grammar directly

### Template Updates Required
Templates need to be updated to use Langium's Grammar structure:

```handlebars
{{!-- Before --}}
{{#each interfaces}}
  interface {{name}} {
    {{#each properties}}
      {{name}}: {{type}};
    {{/each}}
  }
{{/each}}

{{!-- After --}}
{{#each grammar.interfaces}}
  interface {{name}} {
    {{#each features}}
      {{name}}: {{@type}};
    {{/each}}
  }
{{/each}}
```

## Best Practices

### 1. **Leverage Langium Services**
Use Langium's services for parsing, validation, and workspace management rather than reimplementing functionality.

### 2. **Type Safety**
Use TypeScript's type system with Langium's exported types:
```typescript
import { Grammar, Interface, Type } from 'langium';
```

### 3. **Error Handling**
Langium provides detailed diagnostics - use them in error messages:
```typescript
const diagnostics = document.diagnostics;
if (diagnostics.length > 0) {
  // Process Langium's diagnostic information
}
```

### 4. **Caching**
Cache both Grammar and LangiumDocument objects:
```typescript
interface IParserCache {
  get(key: string): Grammar | null;
  getDocument(key: string): LangiumDocument | null;
}
```

## Conclusion

By using Langium's AST directly, the GLSP Generator becomes simpler, more maintainable, and more powerful. This approach aligns with Langium's design philosophy and ensures compatibility with future Langium features.