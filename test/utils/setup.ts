/**
 * Global test setup
 * @module test/utils
 */

import 'reflect-metadata';
import { vi } from 'vitest';

// Mock fs-extra globally
vi.mock('fs-extra', async () => {
  const mockFsExtra = await import('../mocks/fs-extra');
  return mockFsExtra.default;
});

// Setup global mocks
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Global test helpers
global.testHelpers = {
  /**
   * Wait for next tick
   */
  async nextTick(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
  },

  /**
   * Wait for condition
   */
  async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    if (!condition()) {
      throw new Error('Timeout waiting for condition');
    }
  },

  /**
   * Create test timeout
   */
  timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  },
};

// Extend global type definitions
declare global {
  var testHelpers: {
    nextTick(): Promise<void>;
    waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
    timeout(ms: number): Promise<never>;
  };
}