import { watch, FSWatcher } from 'chokidar';
import { GLSPGenerator } from '../generator.js';
import { createDevServer, DevServer } from './dev-server.js';
import { createLogger, ILogger } from '../utils/logger/index.js';
import path from 'path';

export interface WatcherOptions {
    debounceMs?: number;
    serve?: boolean;
    port?: number;
    open?: boolean;
}

export interface WatcherStats {
    generationCount: number;
    errorCount: number;
    lastGenerationTime: number;
    isGenerating: boolean;
}

export class GrammarWatcher {
    private logger: ILogger;
    private watcher?: FSWatcher;
    private devServer?: DevServer;
    private generator: GLSPGenerator;
    private debounceTimer?: NodeJS.Timeout;
    private stats: WatcherStats = {
        generationCount: 0,
        errorCount: 0,
        lastGenerationTime: 0,
        isGenerating: false
    };

    constructor(
        private grammarPath: string,
        private outputDir: string,
        private options: WatcherOptions = {}
    ) {
        this.logger = createLogger('GrammarWatcher');
        this.generator = new GLSPGenerator();
    }

    async start(): Promise<void> {
        this.logger.info('Starting grammar watcher', {
            grammarPath: this.grammarPath,
            outputDir: this.outputDir,
            options: this.options
        });

        // Start file watcher
        this.watcher = watch(this.grammarPath, {
            persistent: true,
            ignoreInitial: false
        });

        this.watcher.on('change', () => this.handleChange());
        this.watcher.on('add', () => this.handleChange());
        this.watcher.on('error', (error) => this.handleError(error as Error));

        // Start dev server if requested
        if (this.options.serve) {
            this.devServer = createDevServer(this.outputDir, this.options.port || 3000);
            await this.devServer.start();
        }

        // Initial generation
        await this.generate();
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping grammar watcher');

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (this.watcher) {
            await this.watcher.close();
        }

        if (this.devServer) {
            this.devServer.stop();
        }
    }

    getStats(): WatcherStats {
        return { ...this.stats };
    }

    private handleChange(): void {
        this.logger.debug('Grammar file changed', { path: this.grammarPath });

        // Debounce rapid changes
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.generate().catch((error) => {
                this.logger.error('Generation failed', error);
            });
        }, this.options.debounceMs || 500);
    }

    private handleError(error: Error): void {
        this.logger.error('Watcher error', error);
        this.stats.errorCount++;
    }

    private async generate(): Promise<void> {
        if (this.stats.isGenerating) {
            this.logger.debug('Generation already in progress, skipping');
            return;
        }

        this.stats.isGenerating = true;
        const startTime = Date.now();

        try {
            this.logger.info('Regenerating GLSP extension');
            
            await this.generator.generateExtension(this.grammarPath, this.outputDir, {
                // Options for watch mode
            });

            this.stats.generationCount++;
            this.stats.lastGenerationTime = Date.now() - startTime;

            this.logger.info('Generation completed', {
                duration: this.stats.lastGenerationTime,
                count: this.stats.generationCount
            });

            // Reload dev server if running
            if (this.devServer) {
                this.devServer.reload();
            }
        } catch (error) {
            this.stats.errorCount++;
            this.logger.error('Generation failed', error);
            throw error;
        } finally {
            this.stats.isGenerating = false;
        }
    }
}