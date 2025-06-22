import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable Jest-like globals (describe, it, expect)
    globals: true,

    // Use Node environment for your backend tests
    environment: 'node',

    // Test file patterns
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'src/__tests__/setup.ts', '.unused'],

    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/*.{test,spec}.{js,ts}',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/node_modules/**',
        'src/templates/**/*.hbs',
        'scripts/**',
        '.unused/**'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
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
        singleFork: true, // Run tests in a single fork to avoid chalk conflicts
        isolate: true
      }
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Reporter options
    reporters: ['default'],

    // Disable watch mode by default
    watch: false,

    // Bail on first test failure
    bail: 0,

    // Dependency optimization for ESM modules
    deps: {
      optimizer: {
        ssr: {
          exclude: ['chalk']
        }
      }
    }
  }
});