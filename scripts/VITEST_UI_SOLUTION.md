# Vitest UI Single-Run Solution

## The Problem
When you click "Run all tests" in Vitest UI, it runs them in a continuous loop instead of running once and stopping.

## The Solution
Use Vitest in **standalone mode** with proper configuration.

## Quick Commands

### Start Vitest UI (No Auto-Loop)
```bash
yarn test:ui:start
```

### Stop Vitest UI
```bash
yarn test:ui:stop
```

## How It Works

1. **Standalone Mode**: Prevents automatic test runs
2. **Watch Mode**: Detects file changes but waits for manual trigger
3. **UI Controls**: You decide when to run tests

## In the Browser UI

1. Access at: `http://172.26.196.194:51204/__vitest__/`
2. All test files are visible
3. Click "Run all" or specific tests
4. Tests run ONCE and stop
5. Make code changes
6. Click "Run" again when ready

## The Key Insight

Vitest's watch mode is designed to continuously re-run tests on changes. The `--standalone` flag changes this behavior to wait for manual triggers, which is exactly what you want for iterative development.

## If Tests Still Loop

This might happen if:
1. Tests are modifying watched files
2. Tests are triggering file system events
3. A test is causing side effects

Solution:
- Run specific test files instead of all tests
- Use filters to exclude problematic tests
- Check for tests that write to the file system

## Alternative: Run Tests Once Without UI

If you just want to run all tests once:
```bash
yarn test
```

This runs tests once and exits - no UI, no loop.