import { jest } from '@jest/globals';

// Global test setup - this file is loaded by Jest before running tests
// It should not contain any test cases itself

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.warn('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.warn('Uncaught Exception:', error);
});

// Global test timeout
jest.setTimeout(30000);

// Setup global gc function for tests
if (!global.gc) {
  global.gc = () => Promise.resolve();
}