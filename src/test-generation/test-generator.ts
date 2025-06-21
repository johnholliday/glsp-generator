import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { UnitTestGenerator, UnitTestGeneratorOptions } from './unit-test-generator.js';
import { IntegrationTestGenerator, IntegrationTestGeneratorOptions } from './integration-test-generator.js';
import { E2ETestGenerator, E2ETestGeneratorOptions } from './e2e-test-generator.js';
import { FactoryGenerator, FactoryGeneratorOptions } from './factory-generator.js';
import { ConfigGenerator, ConfigGeneratorOptions } from './config-generator.js';
import chalk from 'chalk';

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

export class TestGenerator {
    private unitTestGenerator: UnitTestGenerator;
    private integrationTestGenerator: IntegrationTestGenerator;
    private e2eTestGenerator: E2ETestGenerator;
    private factoryGenerator: FactoryGenerator;
    private configGenerator: ConfigGenerator;
    
    constructor() {
        this.unitTestGenerator = new UnitTestGenerator();
        this.integrationTestGenerator = new IntegrationTestGenerator();
        this.e2eTestGenerator = new E2ETestGenerator();
        this.factoryGenerator = new FactoryGenerator();
        this.configGenerator = new ConfigGenerator();
    }
    
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: TestGeneratorOptions = {}
    ): Promise<TestGeneratorResult> {
        const errors: string[] = [];
        const allGeneratedFiles: string[] = [];
        
        try {
            console.log(chalk.blue('🧪 Generating test infrastructure...'));
            
            // Default options
            const opts = {
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
                }
            };
            
            // Generate test configurations first
            console.log(chalk.gray('  • Generating test configurations...'));
            try {
                const configFiles = await this.configGenerator.generate(grammar, outputDir, opts.testConfig);
                allGeneratedFiles.push(...configFiles);
                console.log(chalk.green(`    ✓ Generated ${configFiles.length} configuration files`));
            } catch (error) {
                errors.push(`Failed to generate test configurations: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate test configurations`));
            }
            
            // Generate test data factories
            console.log(chalk.gray('  • Generating test data factories...'));
            try {
                const factoryFiles = await this.factoryGenerator.generate(grammar, outputDir, opts.testData);
                allGeneratedFiles.push(...factoryFiles);
                console.log(chalk.green(`    ✓ Generated ${factoryFiles.length} test data files`));
            } catch (error) {
                errors.push(`Failed to generate test data factories: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate test data factories`));
            }
            
            // Generate unit tests
            console.log(chalk.gray('  • Generating unit tests...'));
            try {
                const unitTestFiles = await this.unitTestGenerator.generate(grammar, outputDir, opts.unitTests);
                allGeneratedFiles.push(...unitTestFiles);
                console.log(chalk.green(`    ✓ Generated ${unitTestFiles.length} unit test files`));
            } catch (error) {
                errors.push(`Failed to generate unit tests: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate unit tests`));
            }
            
            // Generate integration tests
            console.log(chalk.gray('  • Generating integration tests...'));
            try {
                const integrationTestFiles = await this.integrationTestGenerator.generate(grammar, outputDir, opts.integrationTests);
                allGeneratedFiles.push(...integrationTestFiles);
                console.log(chalk.green(`    ✓ Generated ${integrationTestFiles.length} integration test files`));
            } catch (error) {
                errors.push(`Failed to generate integration tests: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate integration tests`));
            }
            
            // Generate E2E tests
            console.log(chalk.gray('  • Generating E2E tests...'));
            try {
                const e2eTestFiles = await this.e2eTestGenerator.generate(grammar, outputDir, opts.e2eTests);
                allGeneratedFiles.push(...e2eTestFiles);
                console.log(chalk.green(`    ✓ Generated ${e2eTestFiles.length} E2E test files`));
            } catch (error) {
                errors.push(`Failed to generate E2E tests: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate E2E tests`));
            }
            
            // Create additional test support files
            await this.createTestSupportFiles(outputDir, grammar);
            
            // Generate test summary
            await this.generateTestSummary(outputDir, allGeneratedFiles, opts);
            
            return {
                success: errors.length === 0,
                filesGenerated: allGeneratedFiles,
                errors: errors.length > 0 ? errors : undefined
            };
            
        } catch (error) {
            errors.push(`Test generation failed: ${error}`);
            return {
                success: false,
                filesGenerated: allGeneratedFiles,
                errors
            };
        }
    }
    
    private async createTestSupportFiles(outputDir: string, grammar: ParsedGrammar): Promise<void> {
        // Create E2E global setup
        const e2eDir = path.join(outputDir, 'src', 'test', 'e2e');
        await fs.ensureDir(e2eDir);
        
        const globalSetupContent = `import { chromium, FullConfig } from '@playwright/test';

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
`;
        
        await fs.writeFile(path.join(e2eDir, 'global-setup.ts'), globalSetupContent);
        
        const globalTeardownContent = `import { FullConfig } from '@playwright/test';

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
`;
        
        await fs.writeFile(path.join(e2eDir, 'global-teardown.ts'), globalTeardownContent);
        
        // Create page objects directory
        const pageObjectsDir = path.join(e2eDir, 'page-objects');
        await fs.ensureDir(pageObjectsDir);
        
        const basePageContent = `import { Page, Locator } from '@playwright/test';

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
`;
        
        await fs.writeFile(path.join(pageObjectsDir, 'base-page.ts'), basePageContent);
        
        // Create test utilities
        const utilsDir = path.join(outputDir, 'src', 'test', 'utils');
        await fs.ensureDir(utilsDir);
        
        const testHelpersContent = `/**
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
`;
        
        await fs.writeFile(path.join(utilsDir, 'test-helpers.ts'), testHelpersContent);
    }
    
    private async generateTestSummary(
        outputDir: string,
        generatedFiles: string[],
        options: any
    ): Promise<void> {
        const summaryPath = path.join(outputDir, 'TEST_SUMMARY.md');
        
        const summary = `# Test Infrastructure Summary

## Overview
This project includes comprehensive test coverage with unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (\`src/test/unit/\`)
- **Model Tests**: Validate data models and their constraints
- **Validation Tests**: Test validation logic for all entities
- **Type Guard Tests**: Ensure type guards work correctly
- **Coverage Target**: ${options.unitTests.coverage}%

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

Total test files generated: ${generatedFiles.length}

${generatedFiles.map(f => `- ${path.relative(outputDir, f)}`).join('\n')}
`;
        
        await fs.writeFile(summaryPath, summary);
    }
}