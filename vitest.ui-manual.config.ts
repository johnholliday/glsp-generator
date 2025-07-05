import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // Disable automatic re-runs completely
    watch: false,
    
    // This is the key setting - it prevents the loop!
    fileParallelism: false,
    
    // UI specific settings
    ui: true,
    
    // Use threads pool to prevent file watching issues
    pool: 'threads',
    
    // Disable all file watching
    watchExclude: ['**'],
    
    // No automatic triggers
    forceRerunTriggers: [],
    
    // Disable HMR
    hmr: false
  }
});