# Dependency Injection for Parser

The GLSP Generator now supports dependency injection for the grammar parser, allowing you to:

1. Use custom parser implementations
2. Mock the parser for testing
3. Extend or modify parsing behavior

## Using the Default Parser

By default, the generator uses the built-in `LangiumGrammarParser`:

```typescript
import { GLSPGenerator } from 'glsp-generator';

const generator = new GLSPGenerator();
await generator.generateExtension('grammar.langium', './output');
```

## Using a Custom Parser

You can provide your own parser implementation by implementing the `IGrammarParser` interface:

```typescript
import { GLSPGenerator, IGrammarParser, ParsedGrammar } from 'glsp-generator';

class MyCustomParser implements IGrammarParser {
    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        // Your custom parsing logic
        return {
            interfaces: [...],
            types: [...],
            projectName: 'my-project'
        };
    }

    async parseGrammar(grammarContent: string): Promise<any> {
        // Parse content for validation
        return { $type: 'Grammar', rules: [] };
    }

    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        // Your validation logic
        return true;
    }
}

// Use the custom parser
const customParser = new MyCustomParser();
const generator = new GLSPGenerator(undefined, customParser);
```

## Testing with Mock Parsers

The dependency injection pattern makes it easy to test your code:

```typescript
import { jest } from '@jest/globals';
import { GLSPGenerator, IGrammarParser } from 'glsp-generator';

test('should generate with mock parser', async () => {
    // Create a mock parser
    const mockParser: vi.mocked<IGrammarParser> = {
        parseGrammarFile: jest.fn().mockResolvedValue({
            interfaces: [/* mock data */],
            types: [],
            projectName: 'test'
        }),
        parseGrammar: jest.fn().mockResolvedValue({ $type: 'Grammar', rules: [] }),
        validateGrammarFile: jest.fn().mockResolvedValue(true)
    };

    // Use mock parser in generator
    const generator = new GLSPGenerator(undefined, mockParser);
    await generator.generateExtension('test.langium', './output');

    // Verify mock was called
    expect(mockParser.parseGrammarFile).toHaveBeenCalledWith('test.langium');
});
```

## Parser Interface

The `IGrammarParser` interface defines three methods:

### parseGrammarFile(grammarPath: string): Promise<ParsedGrammar>
Parses a grammar file and extracts interfaces and types.

### parseGrammar(grammarContent: string): Promise<any>
Parses grammar content and returns an AST representation.

### validateGrammarFile(grammarPath: string): Promise<boolean>
Validates a grammar file, returning true if valid.

## Benefits

1. **Testability**: Easy to mock parser behavior in tests
2. **Extensibility**: Support different grammar formats
3. **Flexibility**: Add preprocessing or custom validation
4. **Maintainability**: Clear separation of concerns