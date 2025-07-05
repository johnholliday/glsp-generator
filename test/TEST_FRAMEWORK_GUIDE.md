# Comprehensive Test Framework Guide

## Overview

The GLSP Generator test framework provides a complete testing solution with:
- Unit and integration tests
- Mock services and fixtures
- Test utilities and helpers
- Coverage reporting
- CI/CD integration

## Directory Structure

```
test/
├── unit/                    # Unit tests
│   ├── core/               # Core service tests
│   ├── parser/             # Parser tests
│   ├── validation/         # Validator tests
│   ├── templates/          # Template engine tests
│   └── infrastructure/     # Infrastructure tests
├── integration/            # Integration tests
├── fixtures/               # Test data and fixtures
│   ├── grammar-fixtures.ts # Sample grammars
│   └── template-fixtures.ts # Sample templates
├── mocks/                  # Mock implementations
│   └── mock-services.ts    # Mock service classes
├── helpers/                # Test helper utilities
│   └── di-test-helper.ts   # DI testing utilities
├── utils/                  # Test framework utilities
│   ├── test-framework.ts   # Main test utilities
│   └── setup.ts           # Global test setup
├── vitest.config.ts       # Vitest configuration
└── TEST_FRAMEWORK_GUIDE.md # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
yarn test

# Run with coverage
yarn test -c

# Watch mode
yarn test -w

# Run specific suite
yarn test -s unit
yarn test -s integration

# Run tests matching pattern
yarn test -g "Parser"

# Open test UI
yarn test --ui

# Update snapshots
yarn test -u

# Debug mode
yarn test --debug
```

### Using the Test Runner Script

```bash
# Run tests with script
node scripts/run-tests.js

# With options
node scripts/run-tests.js --coverage --suite unit

# Show help
node scripts/run-tests.js --help
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestFramework } from '../../test/utils/test-framework';

describe('MyService', () => {
  let container: Container;
  let service: MyService;

  beforeEach(() => {
    // Setup test container with mocks
    container = new TestFramework.TestBuilder()
      .withMockLogger()
      .withMockFileSystem()
      .build();
    
    service = container.get<MyService>(TYPES.MyService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await service.doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Using Test Framework Utilities

```typescript
// Create test container with specific mocks
const container = new TestFramework.TestBuilder()
  .withMockParser()
  .withMockValidator()
  .withCustomBinding(TYPES.MyService, mockService)
  .build();

// Get mock from container
const mockParser = TestFramework.getMock(container, TYPES.IParser);

// Use assertion helpers
TestFramework.assert.assertEventEmitted(eventBus, 'test:event', { data: 'value' });
TestFramework.assert.assertFileWritten(fileSystem, '/path/to/file', 'content');
TestFramework.assert.assertValidationPassed(validator);

// Create test data
const grammarContent = TestFramework.createTestGrammarContent();
const config = TestFramework.createTestGenerationConfig();
const fileSystem = TestFramework.createTestFileSystem();
```

### Using Mock Services

```typescript
import { MockGenerator, MockParser, MockFactory } from '../../test/mocks/mock-services';

// Create basic mocks
const generator = new MockGenerator();
const parser = new MockParser();

// Create configured mocks
const failingGenerator = MockFactory.failingGenerator('Custom error');
const failingValidator = MockFactory.failingValidator([
  { message: 'Validation error', severity: 'error' }
]);

// Create slow service for timeout testing
const slowParser = MockFactory.slowService(parser, 5000);

// Create service that throws on nth call
const throwingService = MockFactory.throwingOnNthCall(service, 'method', 3);
```

### Using Test Fixtures

```typescript
import { 
  SIMPLE_GRAMMAR, 
  COMPLEX_GRAMMAR,
  getTestGrammar,
  createTestGrammarAST 
} from '../../test/fixtures/grammar-fixtures';

import {
  BROWSER_TEMPLATES,
  createTestTemplateContext,
  EXPECTED_OUTPUTS
} from '../../test/fixtures/template-fixtures';

// Use grammar fixtures
const grammarContent = getTestGrammar('stateMachine');

// Parse grammar from content
const grammar = await parser.parseContent(grammarContent);

// Create custom grammar content
const customGrammar = createGrammarContent({
  name: 'MyGrammar',
  interfaces: [
    { name: 'Node', properties: [{ name: 'id', type: 'string' }] }
  ],
  rules: [
    { name: 'Model', entry: true, definition: 'nodes+=Node*' }
  ]
});

// Create template context
const context = createTestTemplateContext({
  projectName: 'MyProject'
});
```

### DI Testing Helpers

```typescript
import { DITestHelper, ContainerTestUtils } from '../../test/helpers/di-test-helper';

// Verify all required services are bound
DITestHelper.verifyRequiredBindings(container);

// Verify service implements interface
DITestHelper.verifyServiceInterface<IGenerator>(
  container,
  TYPES.IGenerator,
  ['generate']
);

// Create spy container
const spyContainer = DITestHelper.createSpyContainer(container);
// ... use container ...
expect(spyContainer.wasResolved(TYPES.IParser)).toBe(true);
expect(spyContainer.getResolutionCount(TYPES.IParser)).toBe(2);

// Assert singleton behavior
ContainerTestUtils.assertSingleton(container, TYPES.IGenerator);

// Assert transient behavior
ContainerTestUtils.assertTransient(container, TYPES.IErrorCollector);
```

## Integration Tests

### Structure

```typescript
describe('Generation Integration', () => {
  let testDir: string;
  let realContainer: Container;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await createTempDir();
    
    // Create real container (not mocked)
    realContainer = createContainer({
      outputDir: testDir,
      enableCache: false
    });
  });

  afterEach(async () => {
    // Cleanup
    await removeTempDir(testDir);
  });

  it('should generate complete extension', async () => {
    // Use real services for integration test
    const generator = realContainer.get<IGenerator>(TYPES.IGenerator);
    
    // Test with real grammar file
    const result = await generator.generate({
      grammarPath: 'test/fixtures/grammars/example.langium',
      outputDir: testDir,
      options: { validate: true }
    });
    
    // Verify actual files were created
    expect(existsSync(join(testDir, 'package.json'))).toBe(true);
    expect(existsSync(join(testDir, 'src/browser/index.ts'))).toBe(true);
  });
});
```

## Coverage Requirements

The test framework enforces these coverage thresholds:
- **Lines**: 90%
- **Functions**: 90%
- **Branches**: 85%
- **Statements**: 90%

### Viewing Coverage Reports

```bash
# Generate coverage report
yarn test -c

# View HTML report
open coverage/index.html

# View coverage summary
cat coverage/coverage-summary.json
```

### Improving Coverage

1. Check uncovered lines:
   ```bash
   yarn test -c
   # Look for red highlights in HTML report
   ```

2. Focus on specific files:
   ```bash
   yarn test -c src/core/services/GenerationOrchestrator.ts
   ```

3. Add tests for edge cases:
   - Error conditions
   - Boundary values
   - Optional parameters
   - Async errors

## Best Practices

### 1. Test Organization
- One test file per source file
- Mirror source directory structure
- Group related tests with `describe`
- Use descriptive test names

### 2. Mock Usage
- Mock external dependencies
- Use real implementations for unit under test
- Verify mock interactions
- Reset mocks between tests

### 3. Assertions
- Test behavior, not implementation
- Use specific assertions
- Test error cases
- Verify side effects

### 4. Performance
- Keep tests fast (< 50ms per test)
- Use mocks for I/O operations
- Parallelize when possible
- Avoid unnecessary setup

### 5. Maintainability
- Extract common setup
- Use test builders
- Create reusable fixtures
- Document complex tests

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: yarn test --coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      coverage/
```

### Local CI Simulation

```bash
# Run tests as CI would
CI=true yarn test --coverage --reporter junit

# Check results
ls test-results/
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Check imports use correct paths
   - Ensure `reflect-metadata` is imported
   - Verify tsconfig paths

2. **Mock not working**
   - Ensure mock is bound before service creation
   - Check mock method names match interface
   - Verify mock is properly typed

3. **Timeout errors**
   - Increase timeout for async tests
   - Check for missing await
   - Verify promises resolve/reject

4. **Coverage gaps**
   - Check for unreachable code
   - Add tests for error paths
   - Test optional parameters

### Debug Mode

```bash
# Run with debug output
yarn test --debug

# Run single test with logs
yarn test -g "specific test name" --debug

# Use node debugger
node --inspect-brk node_modules/.bin/vitest run
```

## Advanced Topics

### Snapshot Testing

```typescript
it('should match snapshot', () => {
  const output = generator.generateOutput(input);
  expect(output).toMatchSnapshot();
});

// Update snapshots
yarn test -u
```

### Property-Based Testing

```typescript
import { fc } from '@fast-check/vitest';

it.prop([fc.string(), fc.integer()])(
  'should handle any input',
  (str, num) => {
    const result = service.process(str, num);
    expect(result).toBeDefined();
  }
);
```

### Performance Testing

```typescript
it('should complete within time limit', async () => {
  const start = performance.now();
  await service.heavyOperation();
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(1000); // 1 second
});
```

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure coverage remains above thresholds
3. Update fixtures if needed
4. Document complex test scenarios
5. Run full test suite before committing

For more information, see the main project documentation.