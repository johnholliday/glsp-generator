// Mock for performance/index to avoid ESM issues in tests

// Mock classes
class MockGenerationProgress {
  constructor(phases = [], options = {}, config = {}) {
    this.phases = phases;
    this.options = options;
    this.config = config;
  }

  start() {}
  startPhase(phaseName, total) {}
  updateProgress(current, total, message) {}
  incrementProgress(amount = 1, message) {}
  completePhase(message) {}
  failPhase(error) {}
  complete() {}
  abort(error) {}
  getOverallProgress() {
    return 0;
  }
}

class MockPerformanceMonitor {
  constructor(config = {}) {
    this.config = config;
  }

  startOperation(name) {
    return () => {}; // Mock end timer function
  }

  printSummary() {}
  saveReport(path) {
    return Promise.resolve();
  }
}

class MockMemoryManager {
  constructor(config = {}, monitor) {
    this.config = config;
    this.monitor = monitor;
  }

  startMonitoring() {}
  stopMonitoring() {}
  getMemoryUsage() {
    return { heapUsed: 0, heapTotal: 0, rss: 0 };
  }
  isMemoryPressure() {
    return false;
  }
  emergencyCleanup() {}
  on(event, callback) {}
}

class MockAdvancedCacheManager {
  constructor(options = {}, config = {}, monitor) {
    this.options = options;
    this.config = config;
    this.monitor = monitor;
  }

  getCachedGrammar(filePath) {
    return Promise.resolve(null);
  }
  cacheGrammar(filePath, grammar) {}
  cleanup() {
    return Promise.resolve();
  }
  save() {
    return Promise.resolve();
  }
}

class MockStreamingGrammarParser {
  constructor(config = {}, monitor) {
    this.config = config;
    this.monitor = monitor;
  }

  parseFile(filePath) {
    return Promise.resolve({
      projectName: "test",
      interfaces: [],
      types: [],
    });
  }
}

class MockParallelTemplateProcessor {
  constructor(config = {}, options = {}, monitor) {
    this.config = config;
    this.options = options;
    this.monitor = monitor;
  }

  processTemplates(templates, context) {
    return Promise.resolve([]);
  }

  cleanup() {
    return Promise.resolve();
  }
}

class MockPerformanceOptimizer {
  constructor(config = {}) {
    this.config = config;
    this.monitor = new MockPerformanceMonitor(config);
    this.memoryManager = new MockMemoryManager(config, this.monitor);
    this.cacheManager = new MockAdvancedCacheManager({}, config, this.monitor);
    this.progress = new MockGenerationProgress([], {}, config);
  }

  getStreamingParser() {
    return new MockStreamingGrammarParser(this.config, this.monitor);
  }

  getParallelProcessor() {
    return new MockParallelTemplateProcessor(this.config, {}, this.monitor);
  }

  getCacheManager() {
    return this.cacheManager;
  }

  getProgress() {
    return this.progress;
  }

  getMonitor() {
    return this.monitor;
  }

  getMemoryManager() {
    return this.memoryManager;
  }

  startMonitoring() {}
  stopMonitoring() {
    return Promise.resolve();
  }
  shouldOptimize(inputSize) {
    return false;
  }
  getOptimizationRecommendations() {
    return [];
  }
}

class MockPerformanceUtils {
  static async measureAsync(fn) {
    const result = await fn();
    return { result, duration: 0 };
  }

  static measure(fn) {
    const result = fn();
    return { result, duration: 0 };
  }

  static throttle(fn, delay) {
    return fn;
  }

  static debounce(fn, delay) {
    return fn;
  }

  static createBatchProcessor(processor, batchSize = 10, delay = 100) {
    return {
      add: (item) => Promise.resolve(item),
      flush: () => Promise.resolve(),
    };
  }

  static formatBytes(bytes) {
    return `${bytes}B`;
  }

  static formatDuration(ms) {
    return `${ms}ms`;
  }

  static getSystemInfo() {
    return {
      platform: "test",
      arch: "test",
      cpuCount: 1,
      totalMemory: 1024,
      freeMemory: 512,
      nodeVersion: "v16.0.0",
      uptime: 0,
    };
  }
}

// Mock performance config type
const MockPerformanceConfig = {};

// Export all the mocks
module.exports = {
  PerformanceOptimizer: MockPerformanceOptimizer,
  PerformanceConfig: MockPerformanceConfig,
  PerformanceUtils: MockPerformanceUtils,
  GenerationProgress: MockGenerationProgress,
  PerformanceMonitor: MockPerformanceMonitor,
  MemoryManager: MockMemoryManager,
  AdvancedCacheManager: MockAdvancedCacheManager,
  StreamingGrammarParser: MockStreamingGrammarParser,
  ParallelTemplateProcessor: MockParallelTemplateProcessor,
};
