import { vi } from 'vitest';

// Global test setup - this file is loaded by Vitest before running tests
// It should not contain any test cases itself

// Mock chalk module with ESM support
vi.mock('chalk', () => {
  // Create a proxy-based chainable mock that supports infinite chaining
  const createChalkMock = () => {
    const mockFunction = vi.fn((str: string) => String(str || ''));

    // Use Proxy to handle any property access and return chainable mock
    return new Proxy(mockFunction, {
      get(target, prop) {
        // Handle special properties
        if (prop === 'supportsColor') {
          return { stdout: { level: 0 }, stderr: { level: 0 } };
        }
        if (prop === 'level') return 0;
        if (prop === 'stderr' || prop === 'stdout') return target;

        // For any style property, return the same chainable mock
        if (typeof prop === 'string') {
          return createChalkMock();
        }

        return target[prop as keyof typeof target];
      }
    });
  };

  return {
    __esModule: true,
    default: createChalkMock()
  };
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.warn('Uncaught Exception:', error);
});

// Setup global gc function for tests
if (!global.gc) {
  global.gc = () => Promise.resolve();
}