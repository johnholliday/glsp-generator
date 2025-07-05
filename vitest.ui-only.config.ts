import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable Jest-like globals
    globals: true,
    
    // Use Node environment
    environment: 'node',
    
    // Exclude ALL test files initially
    exclude: ['**/*.test.ts', '**/*.spec.ts', 'node_modules', 'dist'],
    
    // But allow manual selection in UI
    include: [],
    
    // Allow passing with no tests
    passWithNoTests: true,
    
    // UI configuration
    ui: true,
    
    // Disable coverage for UI mode
    coverage: {
      enabled: false
    },
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Don't bail on failure
    bail: 0,
    
    // Disable watch by default
    watch: false
  }
});