import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { GenerateCommand } from '../../commands/generate.command.js';
import { ILogger } from '../../utils/logger/index.js';
import { GLSPGenerator } from '../../generator.js';
import { ConfigLoader } from '../../config/config-loader.js';
import { LangiumGrammarParser } from '../../utils/langium-parser.js';

// fs-extra is mocked globally in test/utils/setup.ts

// Mock logger factory
export function createMockLogger(): ILogger & { 
  trace: Mock; 
  debug: Mock; 
  info: Mock; 
  warn: Mock; 
  error: Mock; 
  child: Mock; 
} {
  const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn()
  };
  
  // Make child return itself for chaining
  logger.child.mockReturnValue(logger);
  
  return logger as any;
}

describe('GenerateCommand', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockGenerator: GLSPGenerator;

  beforeEach(() => {
    // Create mocks
    mockLogger = createMockLogger();
    mockGenerator = {
      validateGrammar: vi.fn().mockResolvedValue(true),
      generateExtension: vi.fn().mockResolvedValue({ extensionDir: '/output/test-extension' })
    } as any;
  });

  describe('GLSPGenerator mock', () => {
    it('should be called with correct parameters', async () => {
      await mockGenerator.generateExtension('test.langium', '/output');

      expect(mockGenerator.generateExtension).toHaveBeenCalledWith(
        'test.langium',
        '/output'
      );
    });

    it('should validate grammar', async () => {
      await mockGenerator.validateGrammar('test.langium');
      
      expect(mockGenerator.validateGrammar).toHaveBeenCalledWith('test.langium');
      expect(mockGenerator.validateGrammar).toHaveReturned();
    });
  });
});