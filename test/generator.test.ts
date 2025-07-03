import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../src/config/di/types.js';
import { GLSPGenerator } from '../src/generator.js';
import { ILogger } from '../src/utils/logger/index.js';

describe('GLSPGenerator', () => {
    let container: Container;
    let mockLogger: ILogger;

    beforeEach(() => {
        container = new Container();

        // Create mock logger
        mockLogger = {
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        // Register mocks
        container.bind(TYPES.Logger).toConstantValue(mockLogger);
        // ... bind other mocks

        container.bind(TYPES.GLSPGenerator).to(GLSPGenerator);
    });

    // Your existing tests, now with logging mocks available
});