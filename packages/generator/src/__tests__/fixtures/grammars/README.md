# Test Grammars

This directory contains all Langium grammar files used for testing the GLSP Generator.

## Directory Structure

```
test/grammars/
├── basic/          # Simple, foundational grammar examples
├── advanced/       # Complex real-world grammar examples
├── features/       # Grammars that test specific Langium features
├── edge-cases/     # Grammars that test edge cases and error conditions
└── integration/    # Grammars used for full integration testing
```

## Categories

### Basic Grammars
Simple grammars that demonstrate fundamental concepts:
- `entity-model.langium` - Basic entity modeling
- `expression.langium` - Expression parsing
- `state-machine.langium` - Simple state machine DSL
- `workflow.langium` - Basic workflow definition

### Advanced Grammars
More complex grammars that represent real-world use cases:
- `bpmn-subset.langium` - BPMN process modeling subset
- `component-system.langium` - Component-based architecture DSL
- `hierarchical-fsm.langium` - Hierarchical finite state machines
- `uml-class.langium` - UML class diagram subset

### Feature Test Grammars
Grammars that specifically test Langium features:
- `arrays-optionals.langium` - Array and optional property handling
- `inheritance.langium` - Interface inheritance
- `literals.langium` - Literal value handling
- `references.langium` - Cross-references
- `type-unions.langium` - Union type definitions

### Edge Case Grammars
Grammars designed to test error handling and edge cases:
- `circular-refs.langium` - Circular reference detection
- `complex-unions.langium` - Complex union type scenarios
- `deep-inheritance.langium` - Deep inheritance hierarchies
- `empty.langium` - Empty grammar handling
- `large-grammar.langium` - Performance testing with large grammars

### Integration Test Grammars
Grammars used for full end-to-end integration testing:
- `statemachine.langium` - Full state machine example with test data
- `validation-test.langium` - Grammar validation testing

## Usage

### Running Tests
All grammars in this directory are automatically included in the test suite.

### Generating Output
Right-click on any `.langium` file in VSCode to access generation options:
- **Generate GLSP Extension (VSIX)** - Default mode, creates installable VSIX
- **Generate GLSP Extension (Dev Mode)** - Opens generated project in VSCode
- **Generate GLSP Extension (Debug)** - Opens in VSCode extension host
- **Generate GLSP Extension (Project Only)** - Generates project without VSIX

Generated output goes to: `/generated/<grammar-name>/`

### Adding New Test Grammars
1. Place your `.langium` file in the appropriate category folder
2. Add a brief description to this README
3. Ensure any test code that uses the grammar is updated with the new path