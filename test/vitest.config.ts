/**
 * Vitest configuration for comprehensive testing
 * @module test
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    globals: true,
    
    // Setup files
    setupFiles: ['./test/utils/setup.ts'],
    
    // Test patterns
    include: [
      'test/unit/**/*.test.ts',
      'test/integration/**/*.test.ts',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'test/fixtures',
      'test/mocks',
      'test/utils',
      'test/helpers',
    ],
    
    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      
      // Include patterns
      include: [
        'src/**/*.ts',
      ],
      
      // Exclude patterns
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/cli.ts',
        'src/cli-refactored.ts',
        'src/infrastructure/di/symbols.ts',
        'src/config/di/types.ts',
      ],
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: process.env.CI ? 2 : 0,
    
    // Reporter
    reporters: process.env.CI 
      ? ['default', 'junit', 'json']
      : ['default', 'verbose'],
    
    // Output file for CI
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json',
    },
    
    // Watch configuration
    watch: false,
    
    // Parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@test': path.resolve(__dirname, '.'),
    },
  },
});