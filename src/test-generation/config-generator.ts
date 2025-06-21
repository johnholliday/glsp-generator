import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import Handlebars from 'handlebars';

export interface ConfigGeneratorOptions {
    generateJestConfig?: boolean;
    generatePlaywrightConfig?: boolean;
    generateCoverageConfig?: boolean;
    generateGithubActions?: boolean;
}

export class ConfigGenerator {
    private jestConfigTemplate!: HandlebarsTemplateDelegate;
    private playwrightConfigTemplate!: HandlebarsTemplateDelegate;
    private coverageConfigTemplate!: HandlebarsTemplateDelegate;
    private githubActionsTemplate!: HandlebarsTemplateDelegate;
    private testSetupTemplate!: HandlebarsTemplateDelegate;
    private testTsconfigTemplate!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplates();
    }
    
    private loadTemplates(): void {
        this.jestConfigTemplate = Handlebars.compile(`import type { Config } from 'jest';

const config: Config = {
    displayName: '{{projectName}} Tests',
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }]
    },
    moduleNameMapper: {
        // Handle CSS imports (usually for React components)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle module aliases
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/test/**',
        '!src/**/*.stories.{js,jsx,ts,tsx}',
        '!src/**/__tests__/**'
    ],
    coverageThreshold: {
        global: {
            branches: {{coverage}},
            functions: {{coverage}},
            lines: {{coverage}},
            statements: {{coverage}}
        }
    },
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: './test-results',
            outputName: 'junit.xml',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}',
            ancestorSeparator: ' › ',
            usePathForSuiteName: true
        }]
    ],
    // Increase timeout for integration tests
    testTimeout: 30000,
    // Run tests in parallel
    maxWorkers: '50%',
    // Clear mocks between tests
    clearMocks: true,
    // Restore mocks between tests
    restoreMocks: true,
    // Fail on console errors/warnings
    errorOnDeprecated: true,
    // Module paths for absolute imports
    modulePaths: ['<rootDir>/src'],
    // Global variables
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    }
};

export default config;
`);

        this.playwrightConfigTemplate = Handlebars.compile(`import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './src/test/e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/playwright-results.json' }],
        ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
        ['list']
    ],
    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like await page.goto('/') */
        baseURL: 'http://localhost:3000',
        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',
        /* Screenshot on failure */
        screenshot: 'only-on-failure',
        /* Video on failure */
        video: 'retain-on-failure',
        /* Timeouts */
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        {
            name: 'firefox',
            use: { 
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        {
            name: 'webkit',
            use: { 
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        /* Test against mobile viewports */
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
        /* Test against branded browsers */
        {
            name: 'Microsoft Edge',
            use: { 
                ...devices['Desktop Edge'], 
                channel: 'msedge' 
            },
        },
        {
            name: 'Google Chrome',
            use: { 
                ...devices['Desktop Chrome'], 
                channel: 'chrome' 
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run start:test',
        url: 'http://localhost:3000',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
    },

    /* Global setup */
    globalSetup: './src/test/e2e/global-setup.ts',
    globalTeardown: './src/test/e2e/global-teardown.ts',

    /* Output folder for test artifacts */
    outputDir: 'test-results/',

    /* Maximum time one test can run for */
    timeout: 60 * 1000,

    /* Maximum time the whole test suite can run */
    globalTimeout: 30 * 60 * 1000,
});
`);

        this.coverageConfigTemplate = Handlebars.compile(`{
  "extends": "./jest.config.ts",
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "text-summary",
    "lcov",
    "html",
    "json",
    "json-summary",
    "cobertura"
  ],
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
    "!src/test/**",
    "!src/**/index.ts",
    "!src/**/*.config.{js,ts}",
    "!src/generated/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": {{coverage}},
      "functions": {{coverage}},
      "lines": {{coverage}},
      "statements": {{coverage}}
    },
    "src/common/**/*.ts": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/server/**/*.ts": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "src/browser/**/*.ts": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "/test-results/"
  ]
}
`);

        this.githubActionsTemplate = Handlebars.compile(`name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-\${{ matrix.node-version }}
        path: test-results/
    
    - name: Upload coverage reports
      uses: actions/upload-artifact@v3
      with:
        name: coverage-\${{ matrix.node-version }}
        path: coverage/
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-\${{ matrix.node-version }}

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
    
    - name: Run Playwright tests
      run: npm run test:e2e
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
    
    - name: Upload Playwright test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-results
        path: test-results/

  lint:
    name: Lint
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run ESLint
      run: npm run lint
    
    - name: Run TypeScript type check
      run: npm run typecheck

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --production
    
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: [test, e2e, lint, security]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Semantic Release
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
      run: npx semantic-release
`);

        this.testSetupTemplate = Handlebars.compile(`// Test setup file
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'reflect-metadata';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
} as any;

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Global test utilities
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Reset all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Increase timeout for slow tests
jest.setTimeout(30000);

// Custom matchers
expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    \`expected \${received} not to be within range \${floor} - \${ceiling}\`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    \`expected \${received} to be within range \${floor} - \${ceiling}\`,
                pass: false,
            };
        }
    },
});

// Declare custom matchers
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinRange(floor: number, ceiling: number): R;
        }
    }
    
    function sleep(ms: number): Promise<void>;
}
`);

        this.testTsconfigTemplate = Handlebars.compile(`{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node", "@types/jest", "@testing-library/jest-dom"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.ts",
    "src/**/*.spec.tsx",
    "src/test/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
`);
    }
    
    async generate(
        grammar: ParsedGrammar,
        outputDir: string,
        options: ConfigGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateJestConfig: true,
            generatePlaywrightConfig: true,
            generateCoverageConfig: true,
            generateGithubActions: true,
            ...options
        };
        
        const generatedFiles: string[] = [];
        const coverage = 80; // Default coverage threshold
        
        // Generate Jest config
        if (opts.generateJestConfig) {
            const jestPath = path.join(outputDir, 'jest.config.ts');
            const content = this.jestConfigTemplate({
                projectName: grammar.projectName,
                coverage
            });
            await fs.writeFile(jestPath, content);
            generatedFiles.push(jestPath);
            
            // Generate test TypeScript config
            const testTsconfigPath = path.join(outputDir, 'tsconfig.test.json');
            const testTsconfigContent = this.testTsconfigTemplate({});
            await fs.writeFile(testTsconfigPath, testTsconfigContent);
            generatedFiles.push(testTsconfigPath);
        }
        
        // Generate Playwright config
        if (opts.generatePlaywrightConfig) {
            const playwrightPath = path.join(outputDir, 'playwright.config.ts');
            const content = this.playwrightConfigTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(playwrightPath, content);
            generatedFiles.push(playwrightPath);
        }
        
        // Generate coverage config
        if (opts.generateCoverageConfig) {
            const coveragePath = path.join(outputDir, 'jest.coverage.json');
            const content = this.coverageConfigTemplate({
                coverage
            });
            await fs.writeFile(coveragePath, content);
            generatedFiles.push(coveragePath);
        }
        
        // Generate GitHub Actions workflow
        if (opts.generateGithubActions) {
            const workflowDir = path.join(outputDir, '.github', 'workflows');
            await fs.ensureDir(workflowDir);
            
            const workflowPath = path.join(workflowDir, 'ci.yml');
            const content = this.githubActionsTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(workflowPath, content);
            generatedFiles.push(workflowPath);
        }
        
        // Generate test setup file
        const setupDir = path.join(outputDir, 'src', 'test');
        await fs.ensureDir(setupDir);
        
        const setupPath = path.join(setupDir, 'setup.ts');
        const setupContent = this.testSetupTemplate({});
        await fs.writeFile(setupPath, setupContent);
        generatedFiles.push(setupPath);
        
        // Generate package.json scripts
        await this.updatePackageJsonScripts(outputDir);
        
        return generatedFiles;
    }
    
    private async updatePackageJsonScripts(outputDir: string): Promise<void> {
        const packageJsonPath = path.join(outputDir, 'package.json');
        
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            
            // Add test scripts
            packageJson.scripts = {
                ...packageJson.scripts,
                'test': 'jest',
                'test:unit': 'jest --testPathPattern=unit',
                'test:integration': 'jest --testPathPattern=integration',
                'test:e2e': 'playwright test',
                'test:e2e:ui': 'playwright test --ui',
                'test:e2e:debug': 'playwright test --debug',
                'test:watch': 'jest --watch',
                'test:coverage': 'jest --config jest.coverage.json',
                'test:ci': 'npm run test:coverage && npm run test:e2e',
                'test:report': 'open coverage/lcov-report/index.html',
                'test:clean': 'rm -rf coverage test-results playwright-report'
            };
            
            // Add test dependencies
            packageJson.devDependencies = {
                ...packageJson.devDependencies,
                '@jest/globals': '^29.7.0',
                '@playwright/test': '^1.40.0',
                '@testing-library/jest-dom': '^6.1.5',
                '@testing-library/react': '^14.1.2',
                '@types/jest': '^29.5.11',
                '@faker-js/faker': '^8.3.1',
                'identity-obj-proxy': '^3.0.0',
                'jest': '^29.7.0',
                'jest-junit': '^16.0.0',
                'playwright': '^1.40.0',
                'reflect-metadata': '^0.1.14',
                'ts-jest': '^29.1.1',
                'uuid': '^9.0.1',
                '@types/uuid': '^9.0.7'
            };
            
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }
    }
}