# Type Error Fix Summary

## The Problem
```typescript
// ❌ Jest version - Type errors with Vitest
mockParser = {
  parseGrammarFile: jest.fn(),  // Returns Mock<Procedure> - too generic!
  parseGrammar: jest.fn(),
  validateGrammarFile: jest.fn()
}
```

## The Solution
```typescript
// ✅ Vitest version - Properly typed
mockParser = {
  parseGrammarFile: vi.fn<[string], Promise<ParsedGrammar>>(),
  parseGrammar: vi.fn<[string], Promise<any>>(),
  validateGrammarFile: vi.fn<[string], Promise<boolean>>()
}
```

## What Changed

1. **Import Statement**
   ```typescript
   // Before
   import { jest } from '@jest/globals'
   
   // After
   import { vi } from 'vitest'
   ```

2. **Mock Creation**
   ```typescript
   // Before (Jest) - Loosely typed
   jest.fn()
   
   // After (Vitest) - Strongly typed
   vi.fn<[parameterTypes], ReturnType>()
   ```

3. **Spy Methods**
   ```typescript
   // Before
   vi.spyOn(console, 'error')
   
   // After (identical API!)
   vi.spyOn(console, 'error')
   ```

4. **Type Casting**
   ```typescript
   // When passing to GLSPGenerator
   new GLSPGenerator(undefined, mockParser as IGrammarParser)
   ```

## Quick Reference

| What you're mocking | Vitest syntax |
|-------------------|---------------|
| Async function returning ParsedGrammar | `vi.fn<[string], Promise<ParsedGrammar>>()` |
| Async function returning any | `vi.fn<[string], Promise<any>>()` |
| Async function returning boolean | `vi.fn<[string], Promise<boolean>>()` |
| Sync function with no params | `vi.fn<[], void>()` |
| Function with multiple params | `vi.fn<[string, number, boolean], ReturnType>()` |

## Alternative Solutions

If you don't want to type every mock:

```typescript
// Option 1: Type the whole object
const mockParser: IGrammarParser = {
  parseGrammarFile: vi.fn() as any,
  parseGrammar: vi.fn() as any,
  validateGrammarFile: vi.fn() as any
}

// Option 2: Use satisfies
const mockParser = {
  parseGrammarFile: vi.fn(),
  parseGrammar: vi.fn(),
  validateGrammarFile: vi.fn()
} satisfies IGrammarParser

// Option 3: Let TypeScript infer from usage
const mockParser = {
  parseGrammarFile: vi.fn().mockResolvedValue(mockParsedGrammar),
  // TypeScript knows this returns Promise<ParsedGrammar>
}
```

## Testing the Fix

```bash
# Run the fixed test
npx vitest run src/__tests__/generator-with-di.vitest.test.ts

# If it works, update all your tests and remove Jest!
```
