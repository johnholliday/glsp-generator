import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GrammarWatcher } from './watcher.js';

// Mock dependencies
vi.mock('chokidar');
vi.mock('./dev-server.js');
vi.mock('../generator.js');

describe('GrammarWatcher', () => {
    let watcher: GrammarWatcher;
    const testGrammarPath = '/test/grammar.langium';
    const testOutputDir = '/test/output';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        test('should create watcher with default options', () => {
            watcher = new GrammarWatcher(testGrammarPath, testOutputDir);
            expect(watcher).toBeDefined();
        });

        test('should create watcher with custom options', () => {
            watcher = new GrammarWatcher(testGrammarPath, testOutputDir, {
                debounceMs: 1000,
                serve: true,
                port: 8080
            });
            expect(watcher).toBeDefined();
        });
    });

    describe('statistics', () => {
        test('should track generation statistics', () => {
            watcher = new GrammarWatcher(testGrammarPath, testOutputDir);
            const stats = watcher.getStats();

            expect(stats).toEqual({
                generationCount: 0,
                errorCount: 0,
                lastGenerationTime: 0,
                isGenerating: false
            });
        });
    });

    describe('cleanup', () => {
        test('should not throw on stop when not started', async () => {
            watcher = new GrammarWatcher(testGrammarPath, testOutputDir);
            await expect(watcher.stop()).resolves.not.toThrow();
        });
    });
});