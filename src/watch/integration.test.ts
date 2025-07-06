import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const testDir = __filename ? path.dirname(__filename) : process.cwd();

describe('Watch Mode Integration Tests', () => {
    const TEST_DIR = path.join(process.cwd(), 'src', '__tests__', 'temp-output', 'watch-integration');
    const GRAMMAR_FILE = path.join(TEST_DIR, 'test.langium');
    const OUTPUT_DIR = path.join(TEST_DIR, 'output');
    let watchProcess: ChildProcess | null = null;

    beforeAll(async () => {
        // Set up test environment
        await fs.ensureDir(TEST_DIR);
        await fs.writeFile(GRAMMAR_FILE, `
grammar TestGrammar

interface Element {
    id: string
    name: string
}
        `);
    });

    afterAll(async () => {
        // Clean up
        if (watchProcess) {
            watchProcess.kill('SIGTERM');
            // Wait for process to actually terminate
            await new Promise(resolve => {
                if (watchProcess) {
                    watchProcess.on('exit', resolve);
                    // Force kill after 2 seconds if it doesn't exit gracefully
                    setTimeout(() => {
                        if (watchProcess && !watchProcess.killed) {
                            watchProcess.kill('SIGKILL');
                        }
                        resolve(undefined);
                    }, 2000);
                } else {
                    resolve(undefined);
                }
            });
        }

        // Wait a bit more for file handles to be released
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            await fs.remove(TEST_DIR);
        } catch (error) {
            // On Windows, sometimes files are still locked, try again
            console.warn('First cleanup attempt failed, retrying...', error);
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                await fs.remove(TEST_DIR);
            } catch (retryError) {
                console.warn('Cleanup failed, leaving test files:', retryError);
            }
        }
    });

    test.skip('should start watch mode and generate on changes', async () => {
        // Start watch mode
        watchProcess = spawn('node', [
            'dist/cli.js',
            'watch',
            GRAMMAR_FILE,
            OUTPUT_DIR,
            '--debounce', '100'
        ], {
            cwd: process.cwd()
        });

        let output = '';
        watchProcess.stdout?.on('data', (data) => {
            output += data.toString();
        });
        watchProcess.stderr?.on('data', (data) => {
            output += data.toString();
        });

        // Wait for initial generation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Debug output
        console.log('Captured output:', output);

        // Check initial generation
        expect(output).toContain('Regenerated successfully');
        expect(output).toContain('(Generation #1)');

        const extensionDir = path.join(OUTPUT_DIR, 'testgrammar-glsp-extension');
        expect(await fs.pathExists(extensionDir)).toBe(true);

        // Make a change
        await fs.appendFile(GRAMMAR_FILE, `
interface Node extends Element {
    x: number
    y: number
}
        `);

        // Wait for regeneration
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check regeneration happened
        expect(output).toContain('(Generation #2)');

        // Clean up process
        if (watchProcess) {
            watchProcess.kill('SIGTERM');
            // Wait for process to terminate
            await new Promise(resolve => {
                if (watchProcess) {
                    watchProcess.on('exit', resolve);
                    setTimeout(() => {
                        if (watchProcess && !watchProcess.killed) {
                            watchProcess.kill('SIGKILL');
                        }
                        resolve(undefined);
                    }, 1000);
                } else {
                    resolve(undefined);
                }
            });
            watchProcess = null;
        }
    }, 10000); // 10 second timeout
});