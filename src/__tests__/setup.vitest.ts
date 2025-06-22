import { vi } from 'vitest';

// Global test setup - this file is loaded by Vitest before running tests
// It should not contain any test cases itself

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.warn('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.warn('Uncaught Exception:', error);
});

// Global test timeout is now set in vitest.config.ts
// but can be overridden here if needed
// vi.setConfig({ testTimeout: 30000 });

// Setup global gc function for tests
if (!global.gc) {
  global.gc = () => Promise.resolve();
}

// Optional: Mock console methods globally to reduce test noise
// Uncomment if you want to suppress console output in all tests
/*
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
*/
