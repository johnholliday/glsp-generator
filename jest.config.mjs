export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: [
    "<rootDir>/src/__tests__/setup.ts",
    "\\.mock\\.(ts|js)$"
  ],
  // Prevent memory leaks and worker issues
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  detectLeaks: false, // Disable leak detection as it can cause false positives
  // Timeout settings
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
        diagnostics: {
          ignoreCodes: [1343, 2307], // Ignore "Cannot find module" errors
        },
        isolatedModules: true,
      },
    ],
    "^.+\\.(js|mjs)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Mock chalk to avoid ESM issues
    "^chalk$": "<rootDir>/src/__mocks__/chalk.js",
    // Mock Langium modules to avoid Chevrotain ESM issues
    "^langium$": "<rootDir>/src/__mocks__/langium.js",
    "^langium/grammar$": "<rootDir>/src/__mocks__/langium/grammar.js",
    // Mock Langium parser utilities - use more specific patterns
    "^.+/utils/langium-grammar-parser$": "<rootDir>/src/__mocks__/utils/langium-grammar-parser.js",
    "^.+/utils/langium-parser$": "<rootDir>/src/__mocks__/utils/langium-parser.js",
  },
  transformIgnorePatterns: [
    // Don't transform our mocks
    "node_modules/(?!chalk)"
  ],
};