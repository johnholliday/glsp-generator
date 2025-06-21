# Prompt 002: Grammar Test Suite & Examples

## Objective
Create a comprehensive suite of example Langium grammars and test cases that demonstrate all supported features and provide reliable test data for the generator.

## Background
Currently, the project lacks a comprehensive set of example grammars. We need various examples ranging from simple to complex to ensure the generator handles all Langium constructs correctly and to provide users with learning resources.

## Requirements

### 1. Basic Grammar Examples
Create in `examples/basic/`:
- `state-machine.langium` - Simple state machine DSL
- `workflow.langium` - Basic workflow language
- `entity-model.langium` - Simple data modeling language
- `expression.langium` - Basic expression language

### 2. Advanced Grammar Examples
Create in `examples/advanced/`:
- `hierarchical-fsm.langium` - Nested state machines with regions
- `uml-class.langium` - Complex UML-like class diagrams
- `bpmn-subset.langium` - Business process modeling subset
- `component-system.langium` - Component-based architecture DSL

### 3. Feature Showcase Examples
Create in `examples/features/`:
- `inheritance.langium` - Demonstrating interface inheritance
- `references.langium` - Cross-references and scoping
- `arrays-optionals.langium` - Array and optional properties
- `type-unions.langium` - Union types and type aliases
- `literals.langium` - String, number, boolean, date literals

### 4. Edge Case Examples
Create in `examples/edge-cases/`:
- `empty.langium` - Minimal valid grammar
- `large-grammar.langium` - Performance testing (1000+ lines)
- `circular-refs.langium` - Circular reference handling
- `deep-inheritance.langium` - Deep inheritance chains
- `complex-unions.langium` - Nested union types

### 5. Grammar Cookbook
Create `examples/COOKBOOK.md` with patterns for:
- Common modeling patterns
- Best practices for GLSP-friendly grammars
- Anti-patterns to avoid
- Performance considerations
- Naming conventions

### 6. Automated Test Generation
Create `scripts/test-all-examples.js` that:
- Iterates through all example grammars
- Generates extensions for each
- Validates the output
- Reports success/failure
- Measures generation time

## Implementation Details

### Example: State Machine Grammar
```langium
grammar StateMachine

interface StateMachine {
    name: string
    states: State[]
    transitions: Transition[]
    initialState: @State
}

interface State {
    name: string
    isInitial?: boolean
    isFinal?: boolean
    onEntry?: Action[]
    onExit?: Action[]
}

interface Transition {
    name?: string
    source: @State
    target: @State
    event: string
    guard?: Expression
    actions?: Action[]
}

interface Action {
    type: 'log' | 'invoke' | 'assign'
    value: string
}

type Expression = string
```

### Test Report Format
```json
{
  "summary": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "duration": "45.3s"
  },
  "results": [
    {
      "grammar": "examples/basic/state-machine.langium",
      "status": "passed",
      "duration": "2.1s",
      "outputSize": "125KB"
    }
  ]
}
```

## Acceptance Criteria

1. ✅ At least 15 example grammars covering all Langium features
2. ✅ Each example includes comments explaining the concepts
3. ✅ Cookbook provides clear, actionable patterns
4. ✅ All examples generate valid Theia extensions
5. ✅ Test script runs all examples successfully
6. ✅ Examples work as learning resources for users
7. ✅ Edge cases help identify generator limitations

## Testing Requirements

Create tests in `src/examples/examples.test.ts`:
- Validate each grammar parses correctly
- Ensure generated code compiles
- Check for expected output structure
- Verify no Yarn Berry features in output
- Test performance with large grammars

## Files to Create/Modify

1. `examples/basic/*.langium` - Basic examples
2. `examples/advanced/*.langium` - Advanced examples
3. `examples/features/*.langium` - Feature showcases
4. `examples/edge-cases/*.langium` - Edge cases
5. `examples/COOKBOOK.md` - Pattern cookbook
6. `scripts/test-all-examples.js` - Test runner
7. `src/examples/examples.test.ts` - Jest tests
8. Update `README.md` with examples section

## Dependencies
- None (but supports Prompt 001 validation testing)

## Notes
- Examples serve dual purpose: testing and documentation
- Consider creating visual diagrams for each example
- Examples should be referenced in main documentation
- Could later become a separate examples repository
