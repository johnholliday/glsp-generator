# Prompt 005: Enhanced Validation and Diagnostics

## Objective
Create a comprehensive validation system with detailed diagnostics that helps users identify and fix grammar issues before generation, including a grammar linter with helpful error messages.

## Background
Currently, validation errors can be cryptic and don't always guide users to solutions. We need better error messages, warnings for potential issues, and suggestions for fixes.

## Requirements

### 1. Grammar Linter
Create a linting system that checks for:
- Naming convention violations
- Unreachable rules
- Duplicate property names
- Missing required references
- Circular dependencies
- Performance anti-patterns
- GLSP-specific best practices

### 2. Enhanced Error Messages
Transform cryptic errors into helpful diagnostics:
```
❌ Current: "Cannot read property 'name' of undefined"
✅ Better: "Error at line 15, column 8: Interface 'State' references unknown type 'Region'. Did you mean 'SubRegion'?"
```

### 3. Diagnostic Levels
Support multiple severity levels:
- **Error**: Prevents generation
- **Warning**: Might cause issues
- **Info**: Suggestions for improvement
- **Hint**: Best practices

### 4. Source Mapping
Provide accurate location information:
- Line and column numbers
- Visual indicators (^^^)
- Context showing surrounding code
- Link to documentation

### 5. Fix Suggestions
Offer automated fixes where possible:
- Typo corrections (did you mean?)
- Import suggestions
- Naming convention fixes
- Common pattern corrections

### 6. Validation Report
Generate detailed HTML/MD reports:
- Summary statistics
- Issue breakdown by severity
- Code examples with highlights
- Suggested fixes
- Links to relevant docs

## Implementation Details

### Diagnostic Format
```typescript
interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  code: string; // e.g., 'GLSP001'
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
  };
  source: string; // Code snippet
  suggestions?: Fix[];
  documentation?: string; // URL
}

interface Fix {
  description: string;
  changes: TextEdit[];
}
```

### Example Output
```
Validating: state-machine.langium
================================

❌ ERROR [GLSP001] at line 15:12
Interface 'State' has duplicate property 'name'

   13 | interface State {
   14 |   name: string
 > 15 |   name: ID
      |   ^^^^
   16 |   transitions: Transition[]
   17 | }

Suggestion: Remove duplicate property definition

⚠️  WARNING [GLSP002] at line 23:8  
Circular reference detected: State -> Region -> State

   23 | region: @State
      | ^^^^^^

This may cause infinite loops during diagram generation.
Suggestion: Consider using a non-circular model structure

ℹ️  INFO [GLSP003] at line 8:1
Interface name 'state' should be PascalCase

   8 | interface state {
     | ^^^^^

Suggestion: Rename to 'State'

Summary: 1 error, 1 warning, 1 info
Generation blocked due to errors. Fix errors and try again.
```

### Linter Rules Configuration
```json
{
  "linter": {
    "rules": {
      "naming-conventions": "error",
      "no-duplicate-properties": "error",
      "no-circular-refs": "warning",
      "prefer-arrays-over-many": "info",
      "max-inheritance-depth": ["warning", 5],
      "glsp-compatible-types": "error"
    },
    "ignore": ["generated/**"]
  }
}
```

## Acceptance Criteria

1. ✅ Linter catches common grammar issues
2. ✅ Error messages include location and context
3. ✅ Suggestions for fixing issues
4. ✅ Configurable linting rules
5. ✅ HTML/Markdown report generation
6. ✅ Integration with watch mode
7. ✅ Performance: validation under 1 second

## Testing Requirements

Create tests in `src/validation/`:
- `linter.test.ts` - Linter rule tests
- `diagnostics.test.ts` - Error formatting tests
- `suggestions.test.ts` - Fix suggestion tests
- Test each linter rule individually
- Test diagnostic formatting
- Test report generation

## Files to Create/Modify

1. `src/validation/linter.ts` - Grammar linter
2. `src/validation/rules/` - Individual linting rules
3. `src/validation/diagnostics.ts` - Diagnostic formatting
4. `src/validation/suggestions.ts` - Fix suggestions
5. `src/validation/reporter.ts` - Report generation
6. `src/generator.ts` - Integrate validation
7. Update `TESTPLAN.md` with validation tests

## Dependencies
- Prompt 001 (builds on validation concepts)

## Notes
- Consider VS Code extension integration for real-time linting
- Error codes should be documented
- Performance is critical for watch mode
- Could later support custom linting rules
