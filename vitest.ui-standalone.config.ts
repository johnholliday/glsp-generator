import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable Jest-like globals
    globals: true,

    // Use Node environment
    environment: 'node',

    // Test file patterns
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'src/__tests__/setup.ts', '.unused'],

    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],

    // Coverage configuration (disabled for UI)
    coverage: {
      enabled: false
    },

    // Test timeout
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // Test isolation and cleanup
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true
      }
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Reporter options
    reporters: ['verbose'],

    // Disable watch mode auto-run
    watch: true,
    
    // Run tests only once when triggered
    bail: 0,
    
    // Don't re-run on file changes after manual trigger
    rerunTriggers: ['manual'],
    
    // Limit concurrency to prevent overwhelming
    maxConcurrency: 5,
    
    // UI specific settings
    ui: {
      // Disable auto-open
      open: false
    }
  }
});