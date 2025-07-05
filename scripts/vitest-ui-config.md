# Vitest UI Configuration Guide

## Current Status
✅ Vitest UI is accessible in your browser
❌ Tests are running continuously in a loop

## Solutions

### Option 1: Run Specific Test Files Only
Instead of running all tests, focus on specific files:

```bash
# Run UI with only parser tests
yarn vitest --ui src/parser/**/*.test.ts --api.port=51204 --api.host=0.0.0.0

# Run UI with only unit tests
yarn vitest --ui src/**/*.test.ts --api.port=51204 --api.host=0.0.0.0

# Run UI excluding integration tests
yarn vitest --ui --exclude="**/*.integration.test.ts" --api.port=51204 --api.host=0.0.0.0
```

### Option 2: Configure Test Runs in UI
In the Vitest UI:
1. Click on the settings icon (gear) in the top right
2. Disable "Auto Re-run"
3. Manually trigger test runs when needed

### Option 3: Add Configuration to Limit Test Runs
Create a separate config for UI mode:

```typescript
// vitest.ui.config.ts
import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // Disable auto-rerun on file changes
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    // Run tests once then wait for manual trigger
    bail: 1,
    // Limit concurrent tests
    maxConcurrency: 5,
  }
});
```

Then run with:
```bash
yarn vitest --ui --config vitest.ui.config.ts --api.port=51204 --api.host=0.0.0.0
```

### Option 4: Use Filters in the UI
Once the UI is open:
1. Use the search bar to filter tests
2. Click on specific test files to run only those
3. Use the test status filters (passed/failed/skipped)

## Keyboard Shortcuts in Vitest UI
- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Run tests matching a pattern
- `q` - Quit watch mode
- `Enter` - Run tests

## Performance Tips
1. Close unnecessary test files in the UI
2. Use the filter to focus on specific tests
3. Disable coverage collection for faster runs
4. Run in headed mode only when debugging

## Stop the Current Loop
To stop the current test loop:
1. In the terminal: Press `Ctrl+C`
2. Or kill the process: `pkill -f "vitest.*--ui"`