/**
 * Comprehensive test framework utilities
 * @module test/utils
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { TYPES } from '../../src/infrastructure/di/symbols';

/**
 * Test container factory
 */
export function createTestContainer(overrides?: Partial<ContainerOverrides>): Container {
  const container = new Container({
    autoBindInjectable: true,
    defaultScope: 'Singleton',
  });

  // Apply test-specific bindings
  applyTestBindings(container, overrides);

  return container;
}

/**
 * Container override options for testing
 */
export interface ContainerOverrides {
  mockLogger?: boolean;
  mockFileSystem?: boolean;
  mockEventBus?: boolean;
  mockParser?: boolean;
  mockValidator?: boolean;
  customBindings?: (container: Container) => void;
}

/**
 * Apply test-specific bindings
 */
function applyTestBindings(container: Container, overrides?: Partial<ContainerOverrides>): void {
  // Default test configuration
  container.bind<boolean>('CONFIG_TOKEN.VERBOSE').toConstantValue(false);
  container.bind<boolean>('CONFIG_TOKEN.DRY_RUN').toConstantValue(true);
  container.bind<boolean>('CONFIG_TOKEN.STRICT_MODE').toConstantValue(true);
  container.bind<boolean>('CONFIG_TOKEN.ENABLE_CACHE').toConstantValue(false);
  container.bind<boolean>('CONFIG_TOKEN.ENABLE_PLUGINS').toConstantValue(false);
  container.bind<boolean>('CONFIG_TOKEN.ENABLE_METRICS').toConstantValue(false);

  // Apply mocks based on overrides
  if (overrides?.mockLogger !== false) {
    bindMockLogger(container);
  }

  if (overrides?.mockFileSystem !== false) {
    bindMockFileSystem(container);
  }

  if (overrides?.mockEventBus !== false) {
    bindMockEventBus(container);
  }

  if (overrides?.mockParser) {
    bindMockParser(container);
  }

  if (overrides?.mockValidator) {
    bindMockValidator(container);
  }

  // Apply custom bindings
  if (overrides?.customBindings) {
    overrides.customBindings(container);
  }
}

/**
 * Mock logger binding
 */
function bindMockLogger(container: Container): void {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('info'),
  };

  container.bind(TYPES.IStructuredLogger).toConstantValue(mockLogger);
  container.bind(TYPES.IPerformanceLogger).toConstantValue(mockLogger);
  container.bind(TYPES.ILoggerFactory).toConstantValue({
    createLogger: vi.fn().mockReturnValue(mockLogger),
  });
}

/**
 * Mock file system binding
 */
function bindMockFileSystem(container: Container): void {
  const mockFileSystem = {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    exists: vi.fn(),
    mkdir: vi.fn(),
    readDir: vi.fn(),
    remove: vi.fn(),
    copy: vi.fn(),
    move: vi.fn(),
    stat: vi.fn(),
    glob: vi.fn(),
    ensureDir: vi.fn(),
    emptyDir: vi.fn(),
    outputFile: vi.fn(),
    outputJson: vi.fn(),
    readJson: vi.fn(),
  };

  container.bind(TYPES.IFileSystem).toConstantValue(mockFileSystem);
}

/**
 * Mock event bus binding
 */
function bindMockEventBus(container: Container): void {
  const mockEventBus = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn().mockReturnValue(0),
    listeners: vi.fn().mockReturnValue([]),
  };

  container.bind(TYPES.IEventBus).toConstantValue(mockEventBus);
}

/**
 * Mock parser binding
 */
function bindMockParser(container: Container): void {
  const mockParser = {
    parse: vi.fn(),
    parseContent: vi.fn(),
    getDocument: vi.fn(),
    getServices: vi.fn(),
  };

  container.bind(TYPES.IParser).toConstantValue(mockParser);
  container.bind(TYPES.IContentParser).toConstantValue(mockParser);
}

/**
 * Mock validator binding
 */
function bindMockValidator(container: Container): void {
  const mockValidator = {
    validate: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
    validateContent: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
    validatePartial: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
    createValidator: vi.fn(),
    addRule: vi.fn(),
    removeRule: vi.fn(),
    getRules: vi.fn().mockReturnValue([]),
  };

  container.bind(TYPES.IValidator).toConstantValue(mockValidator);
}

/**
 * Test builder for fluent test setup
 */
export class TestBuilder {
  private container: Container;
  private overrides: ContainerOverrides = {};

  constructor() {
    this.container = createTestContainer(this.overrides);
  }

  withMockLogger(): this {
    this.overrides.mockLogger = true;
    this.rebuild();
    return this;
  }

  withMockFileSystem(): this {
    this.overrides.mockFileSystem = true;
    this.rebuild();
    return this;
  }

  withMockEventBus(): this {
    this.overrides.mockEventBus = true;
    this.rebuild();
    return this;
  }

  withMockParser(): this {
    this.overrides.mockParser = true;
    this.rebuild();
    return this;
  }

  withMockValidator(): this {
    this.overrides.mockValidator = true;
    this.rebuild();
    return this;
  }

  withCustomBinding<T>(serviceIdentifier: symbol, value: T): this {
    const currentCustomBindings = this.overrides.customBindings;
    this.overrides.customBindings = (container) => {
      if (currentCustomBindings) {
        currentCustomBindings(container);
      }
      container.bind(serviceIdentifier).toConstantValue(value);
    };
    this.rebuild();
    return this;
  }

  build(): Container {
    return this.container;
  }

  private rebuild(): void {
    this.container = createTestContainer(this.overrides);
  }
}

/**
 * Get mock from container
 */
export function getMock<T>(container: Container, serviceIdentifier: symbol): T & MockedObject<T> {
  return container.get<T>(serviceIdentifier) as T & MockedObject<T>;
}

/**
 * Type helper for mocked objects
 */
export type MockedObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<T[K]> : T[K];
};

/**
 * Wait for promises helper
 */
export async function waitForPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create test file system structure
 */
export function createTestFileSystem(): Map<string, string> {
  return new Map([
    ['/test/grammar.langium', 'grammar TestGrammar\n\nentry Model:\n    elements+=Element*;\n\nElement:\n    name=ID;'],
    ['/test/output/.gitkeep', ''],
    ['/test/templates/test.hbs', '{{#each elements}}{{name}}{{/each}}'],
  ]);
}

/**
 * Create test grammar content string
 */
export function createTestGrammarContent(options?: {
  name?: string;
  hasInterfaces?: boolean;
  hasTypes?: boolean;
  hasImports?: boolean;
}): string {
  const name = options?.name || 'TestGrammar';
  let content = `grammar ${name}\n\n`;
  
  if (options?.hasImports) {
    content += `import './types'\n\n`;
  }
  
  if (options?.hasInterfaces) {
    content += `interface Node {\n`;
    content += `    name: string\n`;
    content += `    children: Node[]\n`;
    content += `}\n\n`;
  }
  
  if (options?.hasTypes) {
    content += `type NodeType = 'task' | 'gateway' | 'event';\n\n`;
  }
  
  content += `entry Model:\n`;
  content += `    elements+=Element*;\n\n`;
  content += `Element:\n`;
  content += `    name=ID;\n\n`;
  content += `terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;\n`;
  
  return content;
}

/**
 * Create test generation config
 */
export function createTestGenerationConfig(overrides?: Partial<any>): any {
  return {
    grammarPath: '/test/grammar.langium',
    outputDir: '/test/output',
    options: {
      validate: true,
      templates: ['browser', 'server', 'common'],
      force: false,
      dryRun: true,
      plugins: [],
      ...overrides?.options,
    },
    ...overrides,
  };
}

/**
 * Assertion helpers
 */
export const assertHelpers = {
  /**
   * Assert that an event was emitted
   */
  assertEventEmitted(eventBus: any, eventName: string, data?: any): void {
    expect(eventBus.emit).toHaveBeenCalledWith(
      eventName,
      data ? expect.objectContaining(data) : expect.anything()
    );
  },

  /**
   * Assert that a file was written
   */
  assertFileWritten(fileSystem: any, path: string, content?: string): void {
    if (content) {
      expect(fileSystem.writeFile).toHaveBeenCalledWith(path, content);
    } else {
      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        path,
        expect.anything()
      );
    }
  },

  /**
   * Assert validation passed
   */
  assertValidationPassed(validator: any): void {
    expect(validator.validate).toHaveBeenCalled();
    const result = validator.validate.mock.results[0].value;
    expect(result).resolves.toMatchObject({ valid: true });
  },

  /**
   * Assert generation succeeded
   */
  assertGenerationSucceeded(result: any): void {
    expect(result).toMatchObject({
      success: true,
      errors: [],
    });
    expect(result.filesGenerated).toBeDefined();
    expect(result.outputDir).toBeDefined();
  },
};

/**
 * Test data builders
 */
export const testDataBuilders = {
  /**
   * Build a validation error
   */
  validationError(overrides?: Partial<any>): any {
    return {
      severity: 'error',
      message: 'Test validation error',
      code: 'TEST_ERROR',
      location: {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 10 },
      },
      ...overrides,
    };
  },

  /**
   * Build a generation result
   */
  generationResult(overrides?: Partial<any>): any {
    return {
      success: true,
      outputDir: '/test/output',
      filesGenerated: ['file1.ts', 'file2.ts'],
      errors: [],
      warnings: [],
      metadata: {
        duration: 1000,
        grammarInfo: {
          rules: 5,
          interfaces: 3,
          types: 2,
        },
      },
      ...overrides,
    };
  },
};

/**
 * Export everything for easy importing
 */
export const TestFramework = {
  createTestContainer,
  TestBuilder,
  getMock,
  waitForPromises,
  createTestFileSystem,
  createTestGrammarContent,
  createTestGenerationConfig,
  assert: assertHelpers,
  builders: testDataBuilders,
};