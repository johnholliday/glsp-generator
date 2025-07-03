import 'reflect-metadata';
import { beforeEach } from 'vitest';

// Ensure test environment
beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
});