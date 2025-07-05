/**
 * Mock service implementations for testing
 * @module test/mocks
 */

import { vi, Mock } from 'vitest';
import { Grammar } from 'langium';
import {
  IGenerator,
  IParser,
  IValidator,
  ITemplateEngine,
  IStructuredLogger,
  IEventBus,
  IFileSystem,
  IErrorHandler,
  GenerationConfig,
  GenerationResult,
  ValidationResult,
  ParseOptions,
} from '../../src/core/interfaces';

/**
 * Mock Generator implementation
 */
export class MockGenerator implements IGenerator {
  generate = vi.fn<[GenerationConfig], Promise<GenerationResult>>()
    .mockResolvedValue({
      success: true,
      outputDir: '/mock/output',
      filesGenerated: ['file1.ts', 'file2.ts'],
      errors: [],
      warnings: [],
      metadata: {
        duration: 100,
        grammarInfo: {
          rules: 5,
          interfaces: 3,
          types: 2,
        },
      },
    });
}

/**
 * Mock Parser implementation
 */
export class MockParser implements IParser {
  parse = vi.fn<[string, ParseOptions?], Promise<Grammar>>()
    .mockResolvedValue(createMockGrammar());

  parseContent = vi.fn<[string, ParseOptions?], Promise<Grammar>>()
    .mockResolvedValue(createMockGrammar());

  getDocument = vi.fn().mockResolvedValue({
    uri: 'file:///mock/grammar.langium',
    textDocument: { uri: 'file:///mock/grammar.langium', text: 'mock content' },
    parseResult: { value: createMockGrammar() },
  });

  getServices = vi.fn().mockReturnValue({
    parser: {},
    validator: {},
    references: {},
  });
}

/**
 * Mock Validator implementation
 */
export class MockValidator implements IValidator {
  validate = vi.fn<[string, any?], Promise<ValidationResult>>()
    .mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
    });

  validateContent = vi.fn<[string, any?], Promise<ValidationResult>>()
    .mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
    });

  validatePartial = vi.fn<[any, any?], Promise<ValidationResult>>()
    .mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
    });

  createValidator = vi.fn().mockReturnValue({});
  addRule = vi.fn();
  removeRule = vi.fn();
  getRules = vi.fn().mockReturnValue([]);
}

/**
 * Mock Template Engine implementation
 */
export class MockTemplateEngine implements ITemplateEngine {
  render = vi.fn<[string, any], Promise<string>>()
    .mockResolvedValue('<rendered content>');

  renderToFile = vi.fn<[string, any, string], Promise<void>>()
    .mockResolvedValue(undefined);

  compile = vi.fn<[string], any>()
    .mockReturnValue(() => '<compiled template>');

  registerHelper = vi.fn();
  registerPartial = vi.fn();
  
  listTemplates = vi.fn().mockResolvedValue([
    { name: 'browser', strategy: 'browser', description: 'Browser templates' },
    { name: 'server', strategy: 'server', description: 'Server templates' },
    { name: 'common', strategy: 'common', description: 'Common templates' },
  ]);

  hasTemplate = vi.fn<[string], boolean>().mockReturnValue(true);
  
  getTemplateInfo = vi.fn().mockReturnValue({
    name: 'test-template',
    path: '/templates/test.hbs',
    strategy: 'common',
  });
}

/**
 * Mock Logger implementation
 */
export class MockLogger implements IStructuredLogger {
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  debug = vi.fn();
  trace = vi.fn();
  fatal = vi.fn();
  
  child = vi.fn().mockReturnThis();
  setLevel = vi.fn();
  getLevel = vi.fn().mockReturnValue('info');
  
  isLevelEnabled = vi.fn<[string], boolean>().mockReturnValue(true);
  
  withContext = vi.fn().mockReturnThis();
  withError = vi.fn().mockReturnThis();
  withMetadata = vi.fn().mockReturnThis();
}

/**
 * Mock Event Bus implementation
 */
export class MockEventBus implements IEventBus {
  private events = new Map<string, Mock[]>();

  emit = vi.fn((event: string, data?: any) => {
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => handler(data));
    return true;
  });

  on = vi.fn((event: string, handler: any) => {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
    return this;
  });

  off = vi.fn((event: string, handler: any) => {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  });

  once = vi.fn((event: string, handler: any) => {
    const wrappedHandler = vi.fn((data: any) => {
      handler(data);
      this.off(event, wrappedHandler);
    });
    return this.on(event, wrappedHandler);
  });

  removeAllListeners = vi.fn((event?: string) => {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  });

  listenerCount = vi.fn((event: string) => {
    return (this.events.get(event) || []).length;
  });

  listeners = vi.fn((event: string) => {
    return this.events.get(event) || [];
  });
}

/**
 * Mock File System implementation
 */
export class MockFileSystem implements IFileSystem {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  constructor(initialFiles?: Map<string, string>) {
    if (initialFiles) {
      this.files = new Map(initialFiles);
      // Extract directories from file paths
      for (const path of initialFiles.keys()) {
        const parts = path.split('/');
        for (let i = 1; i < parts.length; i++) {
          this.directories.add(parts.slice(0, i).join('/'));
        }
      }
    }
  }

  readFile = vi.fn<[string], Promise<string>>()
    .mockImplementation(async (path) => {
      if (this.files.has(path)) {
        return this.files.get(path)!;
      }
      throw new Error(`File not found: ${path}`);
    });

  writeFile = vi.fn<[string, string], Promise<void>>()
    .mockImplementation(async (path, content) => {
      this.files.set(path, content);
      // Add parent directories
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        this.directories.add(parts.slice(0, i).join('/'));
      }
    });

  exists = vi.fn<[string], Promise<boolean>>()
    .mockImplementation(async (path) => {
      return this.files.has(path) || this.directories.has(path);
    });

  isFile = vi.fn<[string], Promise<boolean>>()
    .mockImplementation(async (path) => {
      return this.files.has(path);
    });

  mkdir = vi.fn<[string, any?], Promise<void>>()
    .mockImplementation(async (path) => {
      this.directories.add(path);
    });

  readDir = vi.fn<[string], Promise<string[]>>()
    .mockImplementation(async (path) => {
      const items: string[] = [];
      const prefix = path.endsWith('/') ? path : path + '/';
      
      for (const filePath of this.files.keys()) {
        if (filePath.startsWith(prefix)) {
          const relative = filePath.slice(prefix.length);
          const parts = relative.split('/');
          if (parts.length === 1) {
            items.push(parts[0]);
          }
        }
      }
      
      return items;
    });

  remove = vi.fn<[string], Promise<void>>()
    .mockImplementation(async (path) => {
      this.files.delete(path);
      this.directories.delete(path);
    });

  copy = vi.fn<[string, string], Promise<void>>()
    .mockImplementation(async (src, dest) => {
      if (this.files.has(src)) {
        this.files.set(dest, this.files.get(src)!);
      }
    });

  move = vi.fn<[string, string], Promise<void>>()
    .mockImplementation(async (src, dest) => {
      if (this.files.has(src)) {
        this.files.set(dest, this.files.get(src)!);
        this.files.delete(src);
      }
    });

  stat = vi.fn<[string], Promise<any>>()
    .mockResolvedValue({
      size: 1024,
      isDirectory: () => false,
      isFile: () => true,
      mtime: new Date(),
    });

  glob = vi.fn<[string, any?], Promise<string[]>>()
    .mockResolvedValue([]);

  ensureDir = vi.fn<[string], Promise<void>>()
    .mockImplementation(async (path) => {
      this.directories.add(path);
    });

  emptyDir = vi.fn<[string], Promise<void>>()
    .mockImplementation(async (path) => {
      const prefix = path.endsWith('/') ? path : path + '/';
      for (const file of Array.from(this.files.keys())) {
        if (file.startsWith(prefix)) {
          this.files.delete(file);
        }
      }
    });

  outputFile = vi.fn<[string, string], Promise<void>>()
    .mockImplementation((path, content) => this.writeFile(path, content));

  outputJson = vi.fn<[string, any], Promise<void>>()
    .mockImplementation((path, data) => this.writeFile(path, JSON.stringify(data, null, 2)));

  readJson = vi.fn<[string], Promise<any>>()
    .mockImplementation(async (path) => {
      const content = await this.readFile(path);
      return JSON.parse(content);
    });

  // Helper methods for testing
  getFiles(): Map<string, string> {
    return new Map(this.files);
  }

  getDirectories(): Set<string> {
    return new Set(this.directories);
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
  }
}

/**
 * Mock Error Handler implementation
 */
export class MockErrorHandler implements IErrorHandler {
  handle = vi.fn<[any], Promise<void>>().mockResolvedValue(undefined);
  
  handleSync = vi.fn<[any], void>(() => {
    // Do nothing
  });

  registerHandler = vi.fn();
  removeHandler = vi.fn();
  
  wrap = vi.fn((fn: any) => fn);
  
  isRecoverable = vi.fn<[any], boolean>().mockReturnValue(true);
  
  getErrorInfo = vi.fn().mockReturnValue({
    message: 'Mock error',
    code: 'MOCK_ERROR',
    stack: 'mock stack',
  });
}

/**
 * Create a mock Grammar object
 */
function createMockGrammar(): Grammar {
  return {
    name: 'MockGrammar',
    rules: [],
    interfaces: [],
    types: [],
    imports: [],
    definesHiddenTokens: false,
    hiddenTokens: [],
    valueConverter: false,
    isDeclared: true,
    $type: 'Grammar',
  } as any;
}

/**
 * Factory functions for creating configured mocks
 */
export const MockFactory = {
  /**
   * Create a failing generator
   */
  failingGenerator(error: string = 'Generation failed'): MockGenerator {
    const mock = new MockGenerator();
    mock.generate.mockRejectedValue(new Error(error));
    return mock;
  },

  /**
   * Create a failing validator
   */
  failingValidator(errors: any[] = []): MockValidator {
    const mock = new MockValidator();
    mock.validate.mockResolvedValue({
      valid: false,
      errors: errors.length > 0 ? errors : [
        {
          severity: 'error',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      ],
      warnings: [],
    });
    return mock;
  },

  /**
   * Create a slow service (for timeout testing)
   */
  slowService<T extends { [key: string]: any }>(
    service: T,
    delay: number = 5000
  ): T {
    const slowService = {} as T;
    
    for (const key in service) {
      const value = service[key];
      if (typeof value === 'function') {
        slowService[key] = vi.fn().mockImplementation(async (...args: any[]) => {
          await new Promise(resolve => setTimeout(resolve, delay));
          return value.apply(service, args);
        });
      } else {
        slowService[key] = value;
      }
    }
    
    return slowService;
  },

  /**
   * Create a service that throws on nth call
   */
  throwingOnNthCall<T extends { [key: string]: any }>(
    service: T,
    methodName: keyof T,
    n: number,
    error: Error = new Error('Nth call error')
  ): T {
    let callCount = 0;
    const original = service[methodName] as any;
    
    (service[methodName] as any) = vi.fn().mockImplementation((...args: any[]) => {
      callCount++;
      if (callCount === n) {
        throw error;
      }
      return original.apply(service, args);
    });
    
    return service;
  },
};