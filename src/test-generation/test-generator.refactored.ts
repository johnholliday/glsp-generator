import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { UnitTestGenerator, UnitTestGeneratorOptions } from './unit-test-generator.js';
import { IntegrationTestGenerator, IntegrationTestGeneratorOptions } from './integration-test-generator.js';
import { E2ETestGenerator, E2ETestGeneratorOptions } from './e2e-test-generator.js';
import { FactoryGenerator, FactoryGeneratorOptions } from './factory-generator.js';
import { ConfigGenerator, ConfigGeneratorOptions } from './config-generator.js';
import {
    ITestGeneratorService,
    IFileSystemService,
    ILoggerService,
    IProgressService,
    ICacheService,
    IMetricsService,
    IEventService,
    ITemplateService
} from '../config/di/interfaces.js';
import { injectable, inject, postConstruct, preDestroy } from 'inversify';
import { TYPES } from '../config/di/types.inversify.js';
import { LogMethod } from '../utils/decorators/log-method.js';

export interface TestGeneratorOptions {
    unitTests?: UnitTestGeneratorOptions;
    integrationTests?: IntegrationTestGeneratorOptions;
    e2eTests?: E2ETestGeneratorOptions;
    testData?: FactoryGeneratorOptions;
    testConfig?: ConfigGeneratorOptions;
    coverage?: number;
}

export interface TestGeneratorResult {
    success: boolean;
    filesGenerated: string[];
    errors?: string[];
}

/**
 * Test generator with comprehensive dependency injection support
 */
@injectable()
export class TestGenerator implements ITestGeneratorService {
    private unitTestGenerator!: UnitTestGenerator;
    private integrationTestGenerator!: IntegrationTestGenerator;
    private e2eTestGenerator!: E2ETestGenerator;
    private factoryGenerator!: FactoryGenerator;
    private configGenerator!: ConfigGenerator;
    private initialized = false;

    constructor(
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
        @inject(TYPES.IProgressService) private readonly progressService: IProgressService,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMetricsService) private readonly metrics: IMetricsService,
        @inject(TYPES.IEventService) private readonly eventService: IEventService,
        @inject(TYPES.ITemplateService) private readonly templateService: ITemplateService
    ) {
        this.logger.debug('TestGenerator constructor called');
    }

    @postConstruct()
    private _initialize(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Initializing TestGenerator');

        try {
            // Initialize sub-generators
            this.unitTestGenerator = new UnitTestGenerator();
            this.integrationTestGenerator = new IntegrationTestGenerator();
            this.e2eTestGenerator = new E2ETestGenerator();
            this.factoryGenerator = new FactoryGenerator();
            this.configGenerator = new ConfigGenerator();

            this.setupEventListeners();
            this.initialized = true;

            this.logger.info('TestGenerator initialized successfully');
            this.eventService.emit('test-generator.initialized');
        } catch (error) {
            this.logger.error('Failed to initialize TestGenerator', error as Error);
            throw error;
        }
    }

    @preDestroy()
    private _cleanup(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Cleaning up TestGenerator resources');
        this.initialized = false;
        this.eventService.emit('test-generator.disposed');
    }

    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: TestGeneratorOptions = {}
    ): Promise<TestGeneratorResult> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('test-generator.generate.attempts');

        try {
            this.logger.info('Starting test infrastructure generation', {
                projectName: grammar.projectName,
                outputDir,
                interfaceCount: grammar.interfaces.length,
                typeCount: grammar.types.length
            });

            // Check cache first
            const cacheKey = this.generateCacheKey(grammar, config, outputDir, options);
            const cached = await this.cache.get<TestGeneratorResult>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached test generation result');
                this.metrics.incrementCounter('test-generator.generate.cache_hits');
                return cached;
            }

            const errors: string[] = [];
            const allGeneratedFiles: string[] = [];

            // Create progress reporter
            const progress = this.progressService.createProgress('🧪 Generating test infrastructure', 6);

            this.eventService.emit('test-generator.generation.started', {
                grammar,
                config,
                outputDir,
                options
            });

            // Default options
            const opts = this.normalizeOptions(options);

            try {
                // Generate test configurations first
                progress.report(1, 'Generating test configurations...');
                this.logger.debug('Generating test configurations');

                try {
                    const configFiles = await this.configGenerator.generate(grammar, outputDir, opts.testConfig);
                    allGeneratedFiles.push(...configFiles);
                    this.metrics.incrementCounter('test-generator.config.success');
                    this.logger.info(`Generated ${configFiles.length} configuration files`);
                } catch (error) {
                    const errorMsg = `Failed to generate test configurations: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('Test configuration generation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.config.errors');
                }

                // Generate test data factories
                progress.report(1, 'Generating test data factories...');
                this.logger.debug('Generating test data factories');

                try {
                    const factoryFiles = await this.factoryGenerator.generate(grammar, outputDir, opts.testData);
                    allGeneratedFiles.push(...factoryFiles);
                    this.metrics.incrementCounter('test-generator.factories.success');
                    this.logger.info(`Generated ${factoryFiles.length} test data files`);
                } catch (error) {
                    const errorMsg = `Failed to generate test data factories: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('Test data factory generation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.factories.errors');
                }

                // Generate unit tests
                progress.report(1, 'Generating unit tests...');
                this.logger.debug('Generating unit tests');

                try {
                    const unitTestFiles = await this.unitTestGenerator.generate(grammar, outputDir, opts.unitTests);
                    allGeneratedFiles.push(...unitTestFiles);
                    this.metrics.incrementCounter('test-generator.unit.success');
                    this.logger.info(`Generated ${unitTestFiles.length} unit test files`);
                } catch (error) {
                    const errorMsg = `Failed to generate unit tests: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('Unit test generation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.unit.errors');
                }

                // Generate integration tests
                progress.report(1, 'Generating integration tests...');
                this.logger.debug('Generating integration tests');

                try {
                    const integrationTestFiles = await this.integrationTestGenerator.generate(grammar, outputDir, opts.integrationTests);
                    allGeneratedFiles.push(...integrationTestFiles);
                    this.metrics.incrementCounter('test-generator.integration.success');
                    this.logger.info(`Generated ${integrationTestFiles.length} integration test files`);
                } catch (error) {
                    const errorMsg = `Failed to generate integration tests: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('Integration test generation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.integration.errors');
                }

                // Generate E2E tests
                progress.report(1, 'Generating E2E tests...');
                this.logger.debug('Generating E2E tests');

                try {
                    const e2eTestFiles = await this.e2eTestGenerator.generate(grammar, outputDir, opts.e2eTests);
                    allGeneratedFiles.push(...e2eTestFiles);
                    this.metrics.incrementCounter('test-generator.e2e.success');
                    this.logger.info(`Generated ${e2eTestFiles.length} E2E test files`);
                } catch (error) {
                    const errorMsg = `Failed to generate E2E tests: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('E2E test generation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.e2e.errors');
                }

                // Create additional test support files
                progress.report(1, 'Creating test support files...');
                try {
                    await this.createTestSupportFiles(outputDir, grammar);
                    allGeneratedFiles.push('test-support-files');
                    this.metrics.incrementCounter('test-generator.support.success');
                } catch (error) {
                    const errorMsg = `Failed to create test support files: ${error}`;
                    errors.push(errorMsg);
                    this.logger.error('Test support file creation failed', error as Error);
                    this.metrics.incrementCounter('test-generator.support.errors');
                }

                // Generate test summary
                await this.generateTestSummary(outputDir, allGeneratedFiles, opts);
                allGeneratedFiles.push('TEST_SUMMARY.md');

                const success = errors.length === 0;
                const duration = performance.now() - startTime;

                if (success) {
                    progress.complete(`Generated ${allGeneratedFiles.length} test files successfully`);
                    this.logger.info('Test infrastructure generated successfully', {
                        projectName: grammar.projectName,
                        filesGenerated: allGeneratedFiles.length,
                        duration: Math.round(duration)
                    });
                    this.metrics.incrementCounter('test-generator.generate.success');
                } else {
                    progress.fail(new Error(`Generation completed with ${errors.length} errors`));
                    this.logger.warn('Test generation completed with errors', {
                        projectName: grammar.projectName,
                        filesGenerated: allGeneratedFiles.length,
                        errorCount: errors.length,
                        duration: Math.round(duration)
                    });
                    this.metrics.incrementCounter('test-generator.generate.partial_success');
                }

                const result: TestGeneratorResult = {
                    success,
                    filesGenerated: allGeneratedFiles,
                    errors: errors.length > 0 ? errors : undefined
                };

                // Cache successful results
                if (success) {
                    await this.cache.set(cacheKey, result, 3600000); // 1 hour TTL
                }

                this.metrics.recordDuration('test-generator.generate', duration);

                this.eventService.emit('test-generator.generation.completed', {
                    grammar,
                    result,
                    duration
                });

                return result;

            } catch (error) {
                progress.fail(error as Error);
                throw error;
            }

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('test-generator.generate.error', duration);
            this.metrics.incrementCounter('test-generator.generate.errors');

            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Test generation failed', error as Error, {
                projectName: grammar.projectName,
                outputDir
            });

            this.eventService.emit('test-generator.generation.failed', {
                grammar,
                error,
                duration
            });

            return {
                success: false,
                filesGenerated: [],
                errors: [errorMessage]
            };
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('TestGenerator not initialized. Call initialize() first.');
        }
    }

    private normalizeOptions(options: TestGeneratorOptions): Required<TestGeneratorOptions> {
        return {
            unitTests: {
                generateModelTests: true,
                generateValidationTests: true,
                generateTypeGuardTests: true,
                generateFactoryTests: true,
                coverage: options.coverage || 80,
                ...options.unitTests
            },
            integrationTests: {
                generateServerTests: true,
                generateHandlerTests: true,
                generateClientTests: true,
                generateCommunicationTests: true,
                ...options.integrationTests
            },
            e2eTests: {
                generateBasicTests: true,
                generateDiagramTests: true,
                generateModelPersistenceTests: true,
                generateKeyboardShortcutTests: true,
                headless: true,
                ...options.e2eTests
            },
            testData: {
                generateModelFactories: true,
                generateBuilders: true,
                generateMothers: true,
                includeEdgeCases: true,
                ...options.testData
            },
            testConfig: {
                generateJestConfig: true,
                generatePlaywrightConfig: true,
                generateCoverageConfig: true,
                generateGithubActions: true,
                ...options.testConfig
            },
            coverage: options.coverage || 80
        };
    }

    private generateCacheKey(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: TestGeneratorOptions
    ): string {
        const data = {
            grammar: {
                projectName: grammar.projectName,
                interfaceCount: grammar.interfaces.length,
                typeCount: grammar.types.length,
                interfaceNames: grammar.interfaces.map(i => i.name).sort()
            },
            config: {
                extension: config.extension.name,
                version: config.extension.version
            },
            outputDir,
            options
        };

        return `test-generator:${this.hashObject(data)}`;
    }

    private hashObject(obj: any): string {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    private setupEventListeners(): void {
        // Listen for configuration changes that might affect generation
        this.eventService.on('config.changed', (data) => {
            if (data?.section === 'test-generator') {
                this.logger.debug('Test generator configuration changed, clearing cache');
                this.cache.clear();
            }
        });
    }

    private async createTestSupportFiles(outputDir: string, _grammar: ParsedGrammar): Promise<void> {
        // Create E2E global setup
        const e2eDir = path.join(outputDir, 'src', 'test', 'e2e');
        await this.fileSystem.ensureDir(e2eDir);

        const globalSetupContent = await this.templateService.renderString(`import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    // Perform any global setup needed before running tests
    console.log('Setting up test environment...');
    
    // Example: Start a test server
    // const server = await startTestServer();
    // process.env.TEST_SERVER_URL = server.url;
    
    // Example: Prepare test database
    // await prepareTestDatabase();
    
    // Example: Login and save auth state
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Perform login if needed
    // await page.goto('http://localhost:3000/login');
    // await page.fill('#username', 'test@example.com');
    // await page.fill('#password', 'testpassword');
    // await page.click('button[type="submit"]');
    // await page.waitForURL('http://localhost:3000/dashboard');
    
    // Save storage state
    // await page.context().storageState({ path: 'playwright/.auth/user.json' });
    
    await browser.close();
    
    console.log('Global setup completed');
}

export default globalSetup;
`, {});

        await this.fileSystem.writeFile(path.join(e2eDir, 'global-setup.ts'), globalSetupContent);

        const globalTeardownContent = await this.templateService.renderString(`import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    // Perform any cleanup needed after all tests
    console.log('Cleaning up test environment...');
    
    // Example: Stop test server
    // await stopTestServer();
    
    // Example: Clean up test database
    // await cleanupTestDatabase();
    
    console.log('Global teardown completed');
}

export default globalTeardown;
`, {});

        await this.fileSystem.writeFile(path.join(e2eDir, 'global-teardown.ts'), globalTeardownContent);

        // Create page objects directory
        const pageObjectsDir = path.join(e2eDir, 'page-objects');
        await this.fileSystem.ensureDir(pageObjectsDir);

        const basePageContent = await this.templateService.renderString(`import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
    protected page: Page;
    
    constructor(page: Page) {
        this.page = page;
    }
    
    async goto(path: string = ''): Promise<void> {
        await this.page.goto(path);
    }
    
    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }
    
    async takeScreenshot(name: string): Promise<void> {
        await this.page.screenshot({ path: \`screenshots/\${name}.png\`, fullPage: true });
    }
    
    async waitForElement(selector: string, timeout: number = 30000): Promise<Locator> {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible', timeout });
        return element;
    }
    
    async clickAndWait(selector: string, waitForSelector?: string): Promise<void> {
        await this.page.click(selector);
        if (waitForSelector) {
            await this.waitForElement(waitForSelector);
        }
    }
}
`, {});

        await this.fileSystem.writeFile(path.join(pageObjectsDir, 'base-page.ts'), basePageContent);

        // Create test utilities
        const utilsDir = path.join(outputDir, 'src', 'test', 'utils');
        await this.fileSystem.ensureDir(utilsDir);

        const testHelpersContent = await this.templateService.renderString(`/**
 * Common test helper functions
 */

export function waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomId(prefix: string = 'test'): string {
    return \`\${prefix}-\${Math.random().toString(36).substr(2, 9)}\`;
}

export function randomEmail(): string {
    return \`test-\${Date.now()}@example.com\`;
}

export async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await waitFor(delay);
            }
        }
    }
    
    throw lastError;
}

export function createMockData<T>(
    factory: () => T,
    count: number
): T[] {
    return Array.from({ length: count }, factory);
}

export class TestDataManager {
    private createdIds: Set<string> = new Set();
    
    trackId(id: string): void {
        this.createdIds.add(id);
    }
    
    async cleanup(deleteFn: (id: string) => Promise<void>): Promise<void> {
        const promises = Array.from(this.createdIds).map(id => 
            deleteFn(id).catch(err => 
                console.error(\`Failed to delete \${id}:\`, err)
            )
        );
        
        await Promise.all(promises);
        this.createdIds.clear();
    }
}
`, {});

        await this.fileSystem.writeFile(path.join(utilsDir, 'test-helpers.ts'), testHelpersContent);
    }

    private async generateTestSummary(
        outputDir: string,
        generatedFiles: string[],
        options: any
    ): Promise<void> {
        const summaryPath = path.join(outputDir, 'TEST_SUMMARY.md');

        const summary = await this.templateService.renderString(`# Test Infrastructure Summary

## Overview
This project includes comprehensive test coverage with unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (\`src/test/unit/\`)
- **Model Tests**: Validate data models and their constraints
- **Validation Tests**: Test validation logic for all entities
- **Type Guard Tests**: Ensure type guards work correctly
- **Coverage Target**: {{unitTestsCoverage}}%

### Integration Tests (\`src/test/integration/\`)
- **Server Tests**: Test GLSP server initialization and operations
- **Handler Tests**: Test action handlers for each model type
- **Client Tests**: Test client-side command contributions
- **Communication Tests**: Test client-server message exchange

### E2E Tests (\`src/test/e2e/\`)
- **Basic Operations**: Extension loading, palette, selection
- **Diagram Editing**: Creating, moving, connecting elements
- **Model Persistence**: Saving, loading, auto-save
- **Keyboard Shortcuts**: Hotkeys and navigation

### Test Data (\`src/test/test-data/\`)
- **Factories**: Create valid test instances
- **Builders**: Fluent API for complex test data
- **Mothers**: Semantic test data creation
- **Edge Cases**: Special test data for boundary testing

## Running Tests

\`\`\`bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests with UI
npm run test:e2e:ui
\`\`\`

## CI/CD Integration

Tests are automatically run on:
- Every push to main/develop branches
- Every pull request
- Scheduled nightly builds

## Test Reports

- **Coverage Reports**: \`coverage/lcov-report/index.html\`
- **Jest Results**: \`test-results/junit.xml\`
- **Playwright Report**: \`playwright-report/index.html\`

## Writing New Tests

### Unit Test Example
\`\`\`typescript
import { NodeFactory } from '../test-data/factories';

describe('Node validation', () => {
    test('should accept valid node', () => {
        const node = NodeFactory.create();
        expect(validateNode(node).valid).toBe(true);
    });
});
\`\`\`

### Integration Test Example
\`\`\`typescript
describe('CreateNodeHandler', () => {
    test('should create node', async () => {
        const action = { kind: 'createNode', location: { x: 100, y: 100 } };
        const result = await handler.execute(action);
        expect(result).toBeDefined();
    });
});
\`\`\`

### E2E Test Example
\`\`\`typescript
test('should create element', async ({ page }) => {
    const diagramPage = new DiagramPage(page);
    await diagramPage.goto();
    await diagramPage.createElement('Node', { x: 100, y: 100 });
    expect(await diagramPage.getElementCount()).toBe(1);
});
\`\`\`

## Best Practices

1. **Use factories for test data**: Don't hardcode test objects
2. **Clean up after tests**: Use beforeEach/afterEach hooks
3. **Make tests independent**: Each test should run in isolation
4. **Use descriptive names**: Test names should explain what they test
5. **Follow AAA pattern**: Arrange, Act, Assert
6. **Mock external dependencies**: Don't rely on external services
7. **Keep tests fast**: Optimize for quick feedback
8. **Test edge cases**: Include boundary and error conditions

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in jest.config.ts
2. **Flaky E2E tests**: Add explicit waits or retry logic
3. **Coverage not met**: Add more test cases or adjust thresholds
4. **Mock issues**: Check that mocks are properly reset

### Debug Mode

\`\`\`bash
# Debug Jest tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug Playwright tests
npm run test:e2e:debug
\`\`\`

## Generated Files

Total test files generated: {{totalFiles}}

{{#each files}}
- {{this}}
{{/each}}
`, {
            unitTestsCoverage: options.unitTests.coverage,
            totalFiles: generatedFiles.length,
            files: generatedFiles.map(f => path.relative(outputDir, f))
        });

        await this.fileSystem.writeFile(summaryPath, summary);
    }
}