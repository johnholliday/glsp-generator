import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // UI-specific configuration
    ui: {
      // Don't auto-run tests when UI starts
      open: false
    },
    // Start in watch mode but don't run tests immediately
    watch: true,
    // Don't run tests on start
    passWithNoTests: true,
    // Limit parallelism for UI mode
    maxConcurrency: 5,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    }
  }
});