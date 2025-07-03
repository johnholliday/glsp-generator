import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { GenerateCommand } from '../../commands/generate.command.js';
import { ILogger } from '../../utils/logger/index.js';
import { GLSPGenerator } from '../../generator.js';
import { ConfigLoader } from '../../config/config-loader.js';
import { LangiumGrammarParser } from '../../utils/langium-parser.js';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  pathExists: vi.fn().mockResolvedValue(true),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([])
}));

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
  let container: Container;
  let command: GenerateCommand;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockGenerator: GLSPGenerator;
  let mockParser: LangiumGrammarParser;
  let mockConfigLoader: ConfigLoader;

  beforeEach(() => {
    container = new Container();
    
    // Create mocks
    mockLogger = createMockLogger();
    mockGenerator = {
      validateGrammar: vi.fn().mockResolvedValue(true),
      generateExtension: vi.fn().mockResolvedValue({ extensionDir: '/output/test-extension' })
    } as any;
    mockParser = {
      parseGrammarFile: vi.fn().mockResolvedValue({ projectName: 'test' })
    } as any;
    mockConfigLoader = {
      loadConfig: vi.fn().mockResolvedValue({}),
      applyOverrides: vi.fn().mockImplementation((config, overrides) => ({ ...config, ...overrides }))
    } as any;

    // Bind mocks
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(TYPES.GLSPGenerator).toConstantValue(mockGenerator);
    container.bind(TYPES.LangiumGrammarParser).toConstantValue(mockParser);
    container.bind(TYPES.ConfigLoader).toConstantValue(mockConfigLoader);
    container.bind(TYPES.PackageInfo).toConstantValue({ version: '1.0.0' });
    container.bind(GenerateCommand).toSelf();

    command = container.get(GenerateCommand);
  });

  describe('handler', () => {
    it('should generate extension with default options', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output'
      });

      expect(mockGenerator.generateExtension).toHaveBeenCalledWith(
        'test.langium',
        expect.any(String),
        expect.objectContaining({
          generateDocs: false,
          generateTypeSafety: false,
          generateTests: false,
          generateCICD: false
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generation completed successfully',
        expect.any(Object)
      );
    });

    it('should validate grammar before generation', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output'
      });

      expect(mockGenerator.validateGrammar).toHaveBeenCalledWith('test.langium');
      expect(mockGenerator.validateGrammar).toHaveBeenCalledBefore(
        mockGenerator.generateExtension as any
      );
    });

    it('should skip validation when no-validate is set', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output',
        'no-validate': true
      });

      expect(mockGenerator.validateGrammar).not.toHaveBeenCalled();
    });

    it('should exit early when validate-only is set', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output',
        'validate-only': true
      });

      expect(mockGenerator.validateGrammar).toHaveBeenCalled();
      expect(mockGenerator.generateExtension).not.toHaveBeenCalled();
    });

    it('should handle validation failure', async () => {
      vi.mocked(mockGenerator.validateGrammar).mockResolvedValue(false);

      await expect(
        command.handler({
          grammar: 'test.langium',
          output: './output'
        })
      ).rejects.toThrow('Grammar validation failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Command failed',
        expect.any(Error)
      );
    });

    it('should apply configuration overrides', async () => {
      const overrides = { extension: { version: '2.0.0' } };

      await command.handler({
        grammar: 'test.langium',
        output: './output',
        set: overrides
      });

      expect(mockConfigLoader.applyOverrides).toHaveBeenCalledWith(
        expect.any(Object),
        overrides
      );
    });

    it('should enable debug mode when debug flag is set', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output',
        debug: true
      });

      expect(process.env.DEBUG).toBe('glsp-generator:*');
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug mode enabled');
    });

    it('should generate with all features enabled', async () => {
      await command.handler({
        grammar: 'test.langium',
        output: './output',
        docs: true,
        types: true,
        tests: true,
        ci: true
      });

      expect(mockGenerator.generateExtension).toHaveBeenCalledWith(
        'test.langium',
        expect.any(String),
        expect.objectContaining({
          generateDocs: true,
          generateTypeSafety: true,
          generateTests: true,
          generateCICD: true
        })
      );
    });
  });

  describe('builder', () => {
    it('should configure all options correctly', () => {
      const yargs = {
        positional: vi.fn().mockReturnThis(),
        option: vi.fn().mockReturnThis(),
        example: vi.fn().mockReturnThis(),
        check: vi.fn().mockReturnThis()
      };

      command.builder(yargs as any);

      expect(yargs.positional).toHaveBeenCalledWith('grammar', expect.any(Object));
      expect(yargs.positional).toHaveBeenCalledWith('output', expect.any(Object));
      
      // Check some key options
      expect(yargs.option).toHaveBeenCalledWith('config', expect.any(Object));
      expect(yargs.option).toHaveBeenCalledWith('force', expect.any(Object));
      expect(yargs.option).toHaveBeenCalledWith('docs', expect.any(Object));
      expect(yargs.option).toHaveBeenCalledWith('tests', expect.any(Object));
      expect(yargs.option).toHaveBeenCalledWith('ci', expect.any(Object));
    });
  });

  describe('command metadata', () => {
    it('should have correct command string', () => {
      expect(command.command).toEqual(['generate <grammar> [output]', 'gen', 'g']);
    });

    it('should have correct description', () => {
      expect(command.describe).toBe('Generate GLSP extension from Langium grammar');
    });

    it('should have correct aliases', () => {
      expect(command.aliases).toEqual(['gen', 'g']);
    });
  });
});