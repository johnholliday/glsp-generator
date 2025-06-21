import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const EXAMPLES_DIR = path.join(process.cwd(), 'examples');
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output/examples-test');

describe('Grammar Examples', () => {
    beforeAll(async () => {
        await fs.ensureDir(TEST_OUTPUT_DIR);
    });

    afterAll(async () => {
        // Add delay and retry logic for Windows file locking issues
        let retries = 3;
        while (retries > 0) {
            try {
                if (await fs.pathExists(TEST_OUTPUT_DIR)) {
                    await fs.remove(TEST_OUTPUT_DIR);
                }
                break;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.warn(`Failed to clean up test directory: ${error}`);
                } else {
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    });

    // Helper to find all .langium files
    function findGrammarFiles(dir: string): string[] {
        const files: string[] = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && item !== 'node_modules') {
                files.push(...findGrammarFiles(fullPath));
            } else if (item.endsWith('.langium')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    // Get all grammar files
    const grammarFiles = findGrammarFiles(EXAMPLES_DIR);

    describe('Grammar Files Exist', () => {
        test('should have example grammar files', () => {
            expect(grammarFiles.length).toBeGreaterThan(0);
            expect(grammarFiles.length).toBe(19); // We have 19 examples
        });

        test('should have all categories', () => {
            const categories = ['basic', 'advanced', 'features', 'edge-cases'];
            for (const category of categories) {
                const categoryFiles = grammarFiles.filter(f =>
                    f.replace(/\\/g, '/').includes(`examples/${category}/`)
                );
                expect(categoryFiles.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Grammar Structure', () => {
        test.each(grammarFiles)('should have valid structure: %s', async (grammarFile) => {
            const content = await fs.readFile(grammarFile, 'utf-8');

            // Basic validation - should have grammar declaration
            expect(content).toContain('grammar');

            // Should have at least one interface or parser rule
            expect(content).toMatch(/(?:interface\s+\w+|entry\s+\w+:\s*|\w+\s*:\s*[\r\n]|type\s+\w+\s*=)/);

            // Should not be empty
            expect(content.trim().length).toBeGreaterThan(100);
        });
    });

    describe('Code Generation via CLI', () => {
        // Test a subset of grammars to avoid long test times
        const testGrammars = [
            'examples/basic/state-machine.langium',
            'examples/advanced/hierarchical-fsm.langium',
            'examples/features/inheritance.langium',
            'examples/edge-cases/empty.langium'
        ];

        test.each(testGrammars)('should generate extension for %s', async (grammarFile) => {
            const grammarName = path.basename(grammarFile, '.langium');
            const outputPath = path.join(TEST_OUTPUT_DIR, grammarName);

            // Use CLI to generate
            try {
                execSync(`node dist/cli.js generate "${grammarFile}" "${outputPath}"`, {
                    cwd: process.cwd(),
                    stdio: 'pipe'
                });
            } catch (error) {
                // If generation fails, fail the test with error message
                expect(error).toBeUndefined();
            }

            // Check output exists
            expect(await fs.pathExists(outputPath)).toBe(true);

            // The actual extension is in a subdirectory
            const extensionPath = path.join(outputPath, `${grammarName}-glsp-extension`);
            expect(await fs.pathExists(extensionPath)).toBe(true);

            // Check required files exist
            const requiredFiles = [
                'package.json',
                'tsconfig.json',
                'src/common',
                'src/browser',
                'src/server'
            ];

            for (const file of requiredFiles) {
                const filePath = path.join(extensionPath, file);
                expect(await fs.pathExists(filePath)).toBe(true);
            }

            // Validate package.json
            const packageJson = await fs.readJson(path.join(extensionPath, 'package.json'));

            // Should have basic fields
            expect(packageJson.name).toBeDefined();
            expect(packageJson.version).toBeDefined();
            expect(packageJson.dependencies).toBeDefined();
            expect(packageJson.devDependencies).toBeDefined();

            // Should not have Yarn Berry features
            expect(packageJson.packageManager).toBeUndefined();

            // Check dependencies for workspace protocol
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
                ...packageJson.peerDependencies
            };

            for (const [name, version] of Object.entries(allDeps || {})) {
                expect(version).not.toContain('workspace:');
            }

            // Should not have .yarnrc.yml
            const yarnrcPath = path.join(extensionPath, '.yarnrc.yml');
            expect(await fs.pathExists(yarnrcPath)).toBe(false);
        }, 30000); // 30 second timeout per test
    });

    describe('Special Cases', () => {
        test('empty grammar should generate minimal valid extension', async () => {
            const emptyGrammar = path.join(EXAMPLES_DIR, 'edge-cases/empty.langium');
            const outputPath = path.join(TEST_OUTPUT_DIR, 'empty-special-test');

            execSync(`node dist/cli.js generate "${emptyGrammar}" "${outputPath}"`, {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            // Should still generate valid structure
            expect(await fs.pathExists(outputPath)).toBe(true);

            const extensionPath = path.join(outputPath, 'empty-glsp-extension');
            expect(await fs.pathExists(extensionPath)).toBe(true);

            // Check model file has minimal content
            const modelPath = path.join(extensionPath, 'src/common/empty-model.ts');
            expect(await fs.pathExists(modelPath)).toBe(true);

            const modelContent = await fs.readFile(modelPath, 'utf-8');
            expect(modelContent).toContain('MinimalElement');
        });

        test('large grammar should complete in reasonable time', async () => {
            const largeGrammar = path.join(EXAMPLES_DIR, 'edge-cases/large-grammar.langium');
            const outputPath = path.join(TEST_OUTPUT_DIR, 'large-grammar-perf');

            const startTime = Date.now();

            execSync(`node dist/cli.js generate "${largeGrammar}" "${outputPath}"`, {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            const duration = Date.now() - startTime;

            // Should complete within 15 seconds even for large grammar
            expect(duration).toBeLessThan(15000);

            // Should generate all files
            expect(await fs.pathExists(outputPath)).toBe(true);
        });
    });
});