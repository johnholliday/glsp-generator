# Prompt 007: Test Infrastructure for Generated Extensions

## Objective
Generate comprehensive test suites for the produced Theia GLSP extensions, including unit tests, integration tests, and E2E tests using Playwright.

## Background
Generated extensions currently lack tests. Users must write all tests manually. Automated test generation would ensure extension quality and provide a testing foundation.

## Requirements

### 1. Unit Test Generation
Generate Jest unit tests for:
- Model validation functions
- Type guards
- Utility functions
- Model factories
- Property validators
- Custom business logic

### 2. Integration Test Generation
Generate tests for:
- GLSP server operations
- Command handlers
- Model persistence
- Diagram operations
- Client-server communication
- Dependency injection

### 3. E2E Test Generation
Generate Playwright tests for:
- Extension activation
- Diagram creation
- Node/edge manipulation
- Property editing
- Save/load operations
- Keyboard shortcuts
- Context menus

### 4. Test Data Generation
Create test data factories:
- Valid model instances
- Invalid model instances
- Edge case data
- Large model files
- Performance test data

### 5. Test Configuration
Generate test setup:
- Jest configuration
- Playwright configuration
- Test utilities
- Mock factories
- CI integration

### 6. Coverage Requirements
Ensure generated tests:
- Achieve 80%+ coverage
- Test happy paths
- Test error cases
- Test edge cases
- Performance benchmarks

## Implementation Details

### Generated Test Structure
```
generated-extension/
├── src/
│   └── test/
│       ├── unit/
│       │   ├── model/
│       │   │   ├── state.test.ts
│       │   │   └── transition.test.ts
│       │   ├── validation/
│       │   │   └── validators.test.ts
│       │   └── utils/
│       │       └── type-guards.test.ts
│       ├── integration/
│       │   ├── server/
│       │   │   └── handlers.test.ts
│       │   └── client/
│       │       └── commands.test.ts
│       └── e2e/
│           ├── basic-operations.test.ts
│           ├── model-persistence.test.ts
│           └── diagram-editing.test.ts
├── test-data/
│   ├── valid-models/
│   ├── invalid-models/
│   └── factories/
├── jest.config.js
├── playwright.config.ts
└── test-utils/
```

### Example Unit Test Generation
```typescript
// Generated from State interface
describe('State Model', () => {
  describe('validation', () => {
    it('should accept valid state', () => {
      const state: State = {
        id: 'state1',
        name: 'Initial',
        type: 'state',
        isInitial: true
      };
      expect(isValidState(state)).toBe(true);
    });

    it('should reject state without required name', () => {
      const state = {
        id: 'state1',
        type: 'state'
      };
      expect(isValidState(state)).toBe(false);
    });

    it('should handle optional properties', () => {
      const state: State = {
        id: 'state1',
        name: 'State',
        type: 'state'
        // isInitial is optional
      };
      expect(isValidState(state)).toBe(true);
    });
  });

  describe('type guards', () => {
    it('should identify State objects', () => {
      const obj = { type: 'state', name: 'Test' };
      expect(isState(obj)).toBe(true);
    });
  });
});
```

### Example E2E Test
```typescript
// Generated Playwright test
test.describe('State Machine Editor', () => {
  test('should create new state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.diagram-container');
    
    // Open palette
    await page.click('[aria-label="Tool Palette"]');
    
    // Select state tool
    await page.click('[data-tool-id="state"]');
    
    // Click on diagram
    await page.click('.diagram-canvas', { position: { x: 100, y: 100 } });
    
    // Verify state created
    const state = await page.waitForSelector('.state-node');
    expect(state).toBeTruthy();
    
    // Edit properties
    await state.dblclick();
    await page.fill('[name="name"]', 'NewState');
    await page.keyboard.press('Enter');
    
    // Verify name updated
    await expect(state).toContainText('NewState');
  });
});
```

### Test Data Factory
```typescript
// Generated factory
export class StateFactory {
  static create(overrides?: Partial<State>): State {
    return {
      id: `state-${Math.random()}`,
      name: 'DefaultState',
      type: 'state',
      isInitial: false,
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      ...overrides
    };
  }

  static createInitial(): State {
    return this.create({
      name: 'Initial',
      isInitial: true
    });
  }

  static createFinal(): State {
    return this.create({
      name: 'Final',
      isFinal: true
    });
  }

  static createInvalid(): any {
    return {
      // Missing required 'name'
      type: 'state'
    };
  }
}
```

## Acceptance Criteria

1. ✅ Unit tests for all model types
2. ✅ Integration tests for server operations
3. ✅ E2E tests for user workflows
4. ✅ Test data factories generated
5. ✅ 80%+ code coverage achieved
6. ✅ Tests run in CI pipeline
7. ✅ Performance benchmarks included

## Testing Requirements

Meta-tests for the test generator:
- Verify generated tests compile
- Check test coverage metrics
- Validate test data factories
- Ensure E2E tests are stable
- Test CI configuration

## Files to Create/Modify

1. `src/test-generation/unit-test-generator.ts`
2. `src/test-generation/integration-test-generator.ts`
3. `src/test-generation/e2e-test-generator.ts`
4. `src/test-generation/factory-generator.ts`
5. `src/test-generation/templates/` - Test templates
6. `src/generator.ts` - Add test generation
7. CLI flag `--generate-tests`

## Dependencies
- Prompt 002 (needs example grammars to test)

## Notes
- Consider property-based testing with fast-check
- E2E tests need Theia test harness
- Performance tests could use k6
- Consider visual regression testing
- Test generation should be optional
