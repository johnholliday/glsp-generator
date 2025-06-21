// Mock for performance/progress-indicator to avoid ESM issues in tests
class MockGenerationProgress {
  constructor(phases = [], options = {}, config = {}) {
    this.phases = phases;
    this.options = options;
    this.config = config;
  }

  start() {
    // Mock implementation
  }

  startPhase(phaseName, total) {
    // Mock implementation
  }

  updateProgress(current, total, message) {
    // Mock implementation
  }

  incrementProgress(amount = 1, message) {
    // Mock implementation
  }

  completePhase(message) {
    // Mock implementation
  }

  failPhase(error) {
    // Mock implementation
  }

  complete() {
    // Mock implementation
  }

  abort(error) {
    // Mock implementation - no chalk calls
  }

  getOverallProgress() {
    return 0;
  }
}

class MockAdvancedProgressBar {
  constructor(options = {}) {
    this.options = options;
  }

  start(total) {
    // Mock implementation
  }

  update(current, message) {
    // Mock implementation
  }

  increment(amount = 1, message) {
    // Mock implementation
  }

  complete(message) {
    // Mock implementation
  }

  fail(message) {
    // Mock implementation
  }

  stop() {
    // Mock implementation
  }
}

class MockSimpleETACalculator {
  constructor() {
    this.samples = [];
  }

  update(current, total) {
    // Mock implementation
  }

  getETA() {
    return 0;
  }

  getSpeed() {
    return 0;
  }

  getRemainingTime() {
    return "--:--";
  }
}

module.exports = {
  GenerationProgress: MockGenerationProgress,
  AdvancedProgressBar: MockAdvancedProgressBar,
  SimpleETACalculator: MockSimpleETACalculator,
};
