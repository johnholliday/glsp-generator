# Validation & Linting Feature

## Overview
The Validation & Linting feature ensures grammar quality and consistency by checking for common errors, enforcing coding standards, and providing helpful diagnostics. It runs automatically during generation and can be used standalone.

## Purpose
- Catch grammar errors before code generation
- Enforce consistent naming conventions
- Detect potential runtime issues early
- Provide clear, actionable error messages

## Current Implementation

### Components
1. **Linter** (`src/validation/linter.ts`)
   - Main validation orchestrator
   - Rule management
   - Error aggregation
   - Diagnostic formatting

2. **Built-in Rules** (`src/validation/rules/`)
   - `no-circular-refs.ts`: Detect circular dependencies
   - `no-duplicate-properties.ts`: Find duplicate property names
   - `no-undefined-types.ts`: Check type references
   - `naming-convention.ts`: Enforce naming standards

3. **Diagnostics** (`src/validation/diagnostics.ts`)
   - Error reporting with line/column info
   - Severity levels (error, warning, info)
   - Code suggestions and fixes

### Validation Rules

#### 1. **No Circular References**
Detects circular inheritance chains:
```langium
// ❌ Error: Circular inheritance detected
interface A extends B {}
interface B extends C {}
interface C extends A {}
```

#### 2. **No Duplicate Properties**
Prevents property name conflicts:
```langium
// ❌ Error: Duplicate property 'name'
interface Node {
  name: string
  name: ID  // Duplicate!
}
```

#### 3. **No Undefined Types**
Validates all type references:
```langium
// ❌ Error: Type 'UnknownType' is not defined
interface Node {
  data: UnknownType
}
```

#### 4. **Naming Conventions**
Enforces consistent naming:
```langium
// ✅ Good: PascalCase for interfaces
interface UserProfile {}

// ❌ Error: Interface names should be PascalCase
interface user_profile {}
```

## Technical Details

### Validation Process
1. **Parse Grammar**: Convert to AST
2. **Run Rules**: Execute all enabled rules
3. **Collect Diagnostics**: Aggregate all issues
4. **Format Output**: Present user-friendly errors
5. **Return Status**: Success/failure with details

### Rule Implementation
```typescript
interface ValidationRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  
  validate(ast: GrammarAST): Diagnostic[]
}

class NoCircularRefsRule implements ValidationRule {
  name = 'no-circular-refs'
  severity = 'error' as const
  
  validate(ast: GrammarAST): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    
    // Check each interface for circular inheritance
    for (const interface of ast.interfaces) {
      const chain = this.getInheritanceChain(interface, ast)
      if (chain.includes(interface.name)) {
        diagnostics.push({
          severity: this.severity,
          message: `Circular inheritance: ${chain.join(' → ')}`,
          location: interface.location
        })
      }
    }
    
    return diagnostics
  }
}
```

### Diagnostic Format
```typescript
interface Diagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  location?: {
    file: string
    line: number
    column: number
    length?: number
  }
  code?: string
  source?: string
  suggestions?: string[]
}
```

## Usage Examples

### CLI Validation
```bash
# Validate a grammar file
glsp-generator validate my-dsl.langium

# Validate with strict mode
glsp-generator validate my-dsl.langium --strict

# Validate with custom rules
glsp-generator validate my-dsl.langium --rules ./custom-rules.js
```

### Programmatic Usage
```typescript
const linter = new Linter()

// Add custom rule
linter.addRule(new MyCustomRule())

// Run validation
const diagnostics = await linter.validateGrammar(grammarPath)

// Check results
if (diagnostics.some(d => d.severity === 'error')) {
  console.error('Validation failed!')
  diagnostics.forEach(d => console.error(d.message))
}
```

### Output Examples
```
❌ Validation failed with 3 errors:

  Error at line 15, column 8:
    interface Node extends UnknownBase {
                           ^^^^^^^^^^^
    Type 'UnknownBase' is not defined
    
  Error at line 23, column 3:
    interface user_account {
              ^^^^^^^^^^^^
    Interface names should be PascalCase (expected: UserAccount)
    
  Warning at line 45, column 5:
    deprecated?: boolean
    ^^^^^^^^^^
    Property name 'deprecated' is reserved
```

## Configuration

### Rule Configuration
```json
{
  "validation": {
    "rules": {
      "no-circular-refs": "error",
      "no-duplicate-properties": "error",
      "no-undefined-types": "error",
      "naming-convention": {
        "severity": "warning",
        "options": {
          "interface": "PascalCase",
          "property": "camelCase",
          "type": "PascalCase"
        }
      }
    },
    "customRules": [
      "./rules/company-standards.js"
    ],
    "ignore": [
      "**/generated/**",
      "**/temp/**"
    ]
  }
}
```

### Custom Rules
```typescript
// custom-rule.ts
export class MaxPropertiesRule implements ValidationRule {
  name = 'max-properties'
  severity = 'warning' as const
  
  constructor(private maxProperties = 10) {}
  
  validate(ast: GrammarAST): Diagnostic[] {
    return ast.interfaces
      .filter(i => i.properties.length > this.maxProperties)
      .map(i => ({
        severity: this.severity,
        message: `Interface ${i.name} has too many properties (${i.properties.length}/${this.maxProperties})`,
        location: i.location
      }))
  }
}
```

## Best Practices
1. **Run Early**: Validate before generation
2. **CI Integration**: Include in build pipeline
3. **Custom Rules**: Add project-specific checks
4. **Clear Messages**: Provide actionable feedback
5. **Progressive Enhancement**: Start with warnings, upgrade to errors

## Future Enhancements
1. **Auto-fix**: Automatic correction for common issues
2. **IDE Integration**: Real-time validation in editors
3. **Rule Plugins**: NPM packages for rule sets
4. **Performance Rules**: Check for optimization opportunities
5. **Security Rules**: Detect potential security issues

## Dependencies
- `ajv`: Schema validation
- `chalk`: Colored output
- `source-map`: Line/column mapping

## Testing
- Unit tests for each rule
- Integration tests with real grammars
- Edge case coverage
- Performance benchmarks
- Custom rule testing

## Related Features
- [Grammar Parsing](./01-grammar-parsing.md)
- [Configuration System](./04-configuration.md)
- [Error Handling](./14-error-handling.md)