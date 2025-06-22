import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { GLSPGenerator } from '../generator.js';

const EXAMPLES_DIR = path.join(process.cwd(), 'examples');
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output/examples-fast-test');

describe('Grammar Examples (Fast)', () => {
    let generator: GLSPGenerator;

    beforeAll(async () => {
        await fs.ensureDir(TEST_OUTPUT_DIR);
        generator = new GLSPGenerator();
    });

    afterAll(async () => {
        // Clean up with retry logic
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

    const grammarFiles = findGrammarFiles(EXAMPLES_DIR);

    describe('Grammar Files Validation', () => {
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

        test.each(grammarFiles)('should have valid structure: %s', async (grammarFile) => {
            const content = await fs.readFile(grammarFile, 'utf-8');

            // Basic validation
            expect(content).toContain('grammar');
            expect(content).toMatch(/(?:interface\s+\w+|entry\s+\w+:\s*|\w+\s*:\s*[\r\n]|type\s+\w+\s*=)/);
            expect(content.trim().length).toBeGreaterThan(100);
        });
    });

    describe('Direct Generation Tests', () => {
        // Test a smaller subset to keep tests fast
        const quickTestGrammars = [
            'examples/basic/state-machine.langium',
            'examples/features/inheritance.langium'
        ];

        test.each(quickTestGrammars)('should generate using API: %s', async (grammarFile) => {
            const grammarName = path.basename(grammarFile, '.langium');
            const outputPath = path.join(TEST_OUTPUT_DIR, grammarName);

            // Use the generator API directly instead of CLI
            await generator.generate(grammarFile, outputPath);

            // Verify output
            const extensionPath = path.join(outputPath, `${grammarName}-glsp-extension`);
            expect(await fs.pathExists(extensionPath)).toBe(true);

            // Check package.json
            const packageJson = await fs.readJson(path.join(extensionPath, 'package.json'));
            expect(packageJson.name).toBeDefined();
            expect(packageJson.version).toBeDefined();

            // Ensure no Yarn Berry features
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            for (const [, version] of Object.entries(allDeps || {})) {
                expect(version).not.toContain('workspace:');
            }
        });
    });
});