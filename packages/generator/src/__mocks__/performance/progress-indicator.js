// Mock for performance/progress-indicator to avoid ESM issues in tests
// This mock does not use chalk or any ES modules
class MockGenerationProgress {
  constructor(phases = [], options = {}, config = {}) {
    this.phases = phases;
    this.options = options;
    this.config = config;
    this.phaseProgress = new Map();
    this.currentPhase = null;
  }

  start() {
    // Mock implementation - no console logs
  }

  startPhase(phaseName, total) {
    this.currentPhase = this.phases.find(p => p.name === phaseName);
    if (this.currentPhase) {
      this.phaseProgress.set(phaseName, 0);
    }
  }

  updateProgress(current, total, message) {
    if (this.currentPhase) {
      const percent = Math.min((current / total) * 100, 100);
      this.phaseProgress.set(this.currentPhase.name, percent);
    }
  }

  incrementProgress(amount = 1, message) {
    // Mock implementation
  }

  completePhase(message) {
    if (this.currentPhase) {
      this.phaseProgress.set(this.currentPhase.name, 100);
    }
  }

  failPhase(error) {
    // Mock implementation - no console logs
  }

  complete() {
    // Mock implementation - no console logs
  }

  abort(error) {
    // Mock implementation - no chalk calls, no console logs
  }

  getOverallProgress() {
    if (this.phases.length === 0) return 0;
    
    let totalWeight = 0;
    let completedWeight = 0;
    
    for (const phase of this.phases) {
      totalWeight += phase.weight || 1;
      const phaseProgress = this.phaseProgress.get(phase.name) || 0;
      completedWeight += (phaseProgress / 100) * (phase.weight || 1);
    }
    
    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
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
