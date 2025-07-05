# Vitest UI Loop Problem - Definitive Solution

## The Problem
When you click "Run all tests" in Vitest UI, it runs them continuously in a loop instead of once.

## The Root Cause
Vitest's watch mode is designed to automatically re-run tests when:
1. Files change
2. Tests complete (in certain configurations)
3. When using certain pool configurations

## The REAL Solution

### Option 1: Use Run Mode (Recommended)
Instead of using watch mode UI, use run mode:

```bash
# This runs tests ONCE in UI mode then exits
yarn vitest run --ui --api.port=51204 --api.host=0.0.0.0
```

**Pros**: Tests run exactly once
**Cons**: UI closes after tests complete

### Option 2: Disable File Watching
Create a special config that disables all file watching:

```typescript
// vitest.no-watch.config.ts
export default {
  test: {
    watch: false,
    watchExclude: ['**/*'],
    fileParallelism: false
  }
}
```

Then run:
```bash
yarn vitest --config vitest.no-watch.config.ts --ui
```

### Option 3: Use the Test Filter
Instead of "Run all", use the UI's filter feature:
1. Type a pattern in the filter box (e.g., "parser")
2. Run only those tests
3. Clear filter and type a new pattern

This naturally limits the number of tests and reduces looping.

### Option 4: Run Specific Test Files
Click individual test files instead of "Run all"

## Why Our Previous Attempts Failed

- `--standalone` mode still uses watch internally
- `--no-file-parallelism` helps but doesn't fully prevent loops
- The UI is fundamentally designed for watch mode

## The Simplest Workaround

If you must use the UI with all tests:

1. Start UI: `yarn test:ui`
2. Click "Run all"
3. When tests start looping, press `q` in terminal
4. This stops the current run but keeps UI open
5. Click "Run" again when needed

## Alternative: Command Line

For one-time test runs without loops:
```bash
# Run all tests once
yarn test

# Run with coverage once
yarn test:coverage

# Run specific pattern once
yarn test parser
```

## The Truth

Vitest UI is designed for interactive development with a subset of tests, not for running the entire test suite. The continuous loop is actually a feature for watch mode - it's just not what you want in this case.

For running all tests once, use the command line. For interactive debugging, use the UI with specific test files.