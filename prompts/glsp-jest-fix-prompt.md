# Fix GLSP Generator Jest/Langium Integration Issues

## Context
I have a TypeScript project (glsp-generator) that generates Theia GLSP extensions from Langium grammars. The project uses Jest for testing but is encountering ES module issues with the Langium/Chevrotain dependency chain.

**Project Structure:**
- Type: ES module (`"type": "module"` in package.json)
- Testing: Jest with ts-jest preset for ESM
- Key Dependencies: langium@^3.5.0, jest@^29.5.0, ts-jest@^29.1.0
- Node: >=18.0.0

**Current Issue:**
3 test suites fail with:
```
SyntaxError: Unexpected token 'export'
C:\Users\John\Dev\glsp-generator\node_modules\chevrotain\lib\chevrotain.mjs:9445
export { Alternation, Alternative, CstParser, ... };
```

**Root Cause:**
Jest cannot properly transform the Chevrotain ES module (`.mjs`) that Langium depends on, despite various configuration attempts.

## Task

Implement a solution to fix the Jest/Langium integration issues. Based on my analysis, I want to implement **Option A (Mocking)** as the immediate fix, with proper structure for potential future migration to real Langium testing.

### Primary Solution (Option A - Mocking)

1. **Create Langium Mocks**
   - Mock `src/utils/langium-grammar-parser.ts` 
   - Mock `src/utils/langium-parser.ts`
   - Mocks should simulate the Langium parser behavior without actually importing Langium
   - Use the existing mock pattern from `src/__mocks__/chalk.js` as reference

2. **Mock Requirements**
   - Return expected `ParsedGrammar` structure for test fixture `src/__tests__/fixtures/test-grammar.langium`
   - Simulate validation behavior
   - Handle both file path and string content parsing
   - Match the exact interface of the real parsers

3. **Update Jest Configuration**
   - Add module name mappings for the Langium utilities
   - Ensure mocks are automatically loaded

### Alternative Solution Documentation (Option B - For Future)

Also document (in comments) how to implement Option B (Babel Transform) for future reference when real Langium testing is needed:
- Required Babel packages and configuration
- Transform configuration for `.mjs` files in node_modules
- Performance considerations

## Expected Mock Behavior

For the test grammar file (`test-grammar.langium`), mocks should return:

```typescript
{
  projectName: 'test-grammar',
  interfaces: [
    { name: 'Element', properties: [{ name: 'name', type: 'string', optional: false, array: false }], superTypes: [] },
    { name: 'Node', properties: [
      { name: 'position', type: 'Position', optional: false, array: false },
      { name: 'size', type: 'Size', optional: true, array: false },
      { name: 'label', type: 'string', optional: true, array: false }
    ], superTypes: ['Element'] },
    { name: 'Edge', properties: [
      { name: 'source', type: 'Node', optional: false, array: false },
      { name: 'target', type: 'Node', optional: false, array: false },
      { name: 'type', type: 'EdgeType', optional: false, array: false }
    ], superTypes: ['Element'] },
    { name: 'Position', properties: [
      { name: 'x', type: 'number', optional: false, array: false },
      { name: 'y', type: 'number', optional: false, array: false }
    ], superTypes: [] },
    { name: 'Size', properties: [
      { name: 'width', type: 'number', optional: false, array: false },
      { name: 'height', type: 'number', optional: false, array: false }
    ], superTypes: [] }
  ],
  types: [
    { name: 'EdgeType', definition: "'association' | 'dependency' | 'inheritance'", unionTypes: ['association', 'dependency', 'inheritance'] }
  ]
}
```

## Success Criteria

1. All 3 failing test suites pass
2. Mocks accurately simulate Langium parser behavior
3. No changes required to existing test files
4. Clear documentation for future migration to real Langium testing
5. Tests run quickly without ES module transformation overhead

## Additional Notes

- The project already successfully mocks Chalk for similar ES module issues
- The existing tests in `langium-parser.test.ts`, `generator.test.ts`, and `cli.test.ts` should not need modification
- Maintain TypeScript type safety in the mocks
- Consider using Jest's `createMockFromModule` if helpful, but manual mocks are acceptable

Please implement this solution, ensuring all tests pass and the mocking strategy is well-documented for future maintenance.