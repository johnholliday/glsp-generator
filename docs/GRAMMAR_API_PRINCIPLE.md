# Grammar API Principle - Using Langium Exclusively

## Overview

The GLSP Generator strictly adheres to using the Langium API exclusively for all grammar-related operations. We do NOT manually construct Grammar AST objects.

## The Principle

**Grammar objects should only be obtained through the Langium API:**

1. **From Files**: `parser.parse(grammarPath)`
2. **From Content**: `parser.parseContent(grammarContent)`
3. **In Tests**: Mock parser responses or use real parsing

## Why This Matters

### 1. **Encapsulation**
- Langium's internal AST structure is an implementation detail
- We don't need to know how Grammar objects are structured internally
- The parser handles all complexity of AST construction

### 2. **Maintainability**
- Langium can change its AST structure without breaking our code
- We're protected from internal API changes
- Updates to Langium require minimal changes on our side

### 3. **Correctness**
- Langium ensures Grammar objects are valid and complete
- Manual construction could create invalid AST structures
- Parser includes validation and error handling

### 4. **Consistency**
- All Grammar objects come from the same source
- Behavior is predictable and well-tested
- No surprises from manually constructed objects

## What We Removed

### ❌ GrammarASTBuilder (Removed)
We initially created a GrammarASTBuilder for testing, but this violated our principle:
```typescript
// DON'T DO THIS - Violates Langium API principle
const grammar = new GrammarASTBuilder()
  .withName('MyGrammar')
  .addInterface('Node')
  .build();
```

## Correct Approaches

### ✅ For Production Code
```typescript
// Parse from file
const grammar = await parser.parse('./my-grammar.langium');

// Parse from content
const content = fs.readFileSync('./my-grammar.langium', 'utf-8');
const grammar = await parser.parseContent(content);
```

### ✅ For Testing

#### Option 1: Test Grammar Files
```typescript
// test/fixtures/grammars/simple.langium
grammar SimpleTest
entry Model: name=ID;
terminal ID: /[a-zA-Z]+/;

// In test
const grammar = await parser.parse('test/fixtures/grammars/simple.langium');
```

#### Option 2: Grammar Content Strings
```typescript
const SIMPLE_GRAMMAR = `
grammar TestGrammar
entry Model: elements+=Element*;
Element: name=ID;
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
`;

const grammar = await parser.parseContent(SIMPLE_GRAMMAR);
```

#### Option 3: Mock Parser
```typescript
const mockParser = {
  parse: vi.fn().mockResolvedValue({
    $type: 'Grammar',
    name: 'MockGrammar',
    rules: [],
    interfaces: [],
    // Minimal valid structure
  })
};
```

## Test Utilities

Instead of building AST objects, we provide utilities to create grammar content:

```typescript
// Create grammar content with specific features
const grammarContent = createGrammarContent({
  name: 'MyGrammar',
  interfaces: [
    { 
      name: 'Node', 
      properties: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string', optional: true }
      ]
    }
  ],
  rules: [
    { name: 'Model', entry: true, definition: 'nodes+=Node*' }
  ]
});

// Parse it to get a real Grammar object
const grammar = await parser.parseContent(grammarContent);
```

## Benefits

1. **Type Safety**: TypeScript ensures we use the correct Langium types
2. **Future Proof**: Protected from Langium internal changes
3. **Reliable**: Grammar objects are always valid
4. **Testable**: Easy to mock the parser interface
5. **Clear Intent**: Code clearly shows we're using Langium's API

## Summary

By removing the GrammarASTBuilder and exclusively using Langium's parser API, we:
- Maintain clean separation of concerns
- Follow the dependency inversion principle
- Ensure all Grammar objects are valid
- Simplify our codebase
- Make testing more realistic

Remember: **If you need a Grammar object, use the Langium parser API!**