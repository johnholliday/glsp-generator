import { FSWatcher, watch } from 'chokidar';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { GLSPGenerator } from '../generator.js';
import { DevServer } from './dev-server.js';
import { ConfigLoader } from '../config/config-loader.js';
import { GLSPConfig } from '../config/types.js';

export interface WatchOptions {
    debounceMs?: number;
    serve?: boolean;
    port?: number;
    config?: string;
    clearConsole?: boolean;
    verbose?: boolean;
}

export class GrammarWatcher {
    private watcher?: FSWatcher;
    private generator: GLSPGenerator;
    private devServer?: DevServer;
    private debounceTimer?: NodeJS.Timeout;
    private isGenerating = false;
    private lastGenerationTime = 0;
    private generationCount = 0;
    private errorCount = 0;
    private config?: GLSPConfig;
    private extensionDir?: string;

    constructor(
        private grammarPath: string,
        private outputDir: string,
        private options: WatchOptions = {}
    ) {
        // Normalize paths
        this.grammarPath = path.resolve(this.grammarPath);
        this.outputDir = path.resolve(this.outputDir);
        
        // Generator will be initialized after config is loaded
        this.generator = new GLSPGenerator();
    }
    
    private async loadConfig(): Promise<void> {
        const configLoader = new ConfigLoader();
        this.config = await configLoader.loadConfig(process.cwd(), this.options.config);
        this.generator = new GLSPGenerator(this.config);
    }

    async start(): Promise<void> {
        // Load configuration first
        await this.loadConfig();
        
        this.printHeader();
        
        // Initial generation
        await this.regenerate();
        
        // Start development server if requested
        if (this.options.serve) {
            this.devServer = new DevServer(this.outputDir, this.options.port || 3000);
            await this.devServer.start();
            console.log(chalk.cyan(`\n🌐 Development server: http://localhost:${this.options.port || 3000}`));
        }
        
        // Set up file watching
        this.setupWatcher();
        
        console.log(chalk.blue('\n👀 Watching for changes...'));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));
    }

    async stop(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close();
        }
        if (this.devServer) {
            await this.devServer.stop();
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }

    private setupWatcher(): void {
        const watchPaths = [this.grammarPath];
        
        // Also watch config file if specified
        if (this.options.config && fs.existsSync(this.options.config)) {
            watchPaths.push(this.options.config);
        }
        
        // Watch template directory if in development mode
        const templateDir = path.join(path.dirname(this.grammarPath), '../src/templates');
        if (fs.existsSync(templateDir) && this.options.verbose) {
            watchPaths.push(path.join(templateDir, '**/*.hbs'));
        }
        
        this.watcher = watch(watchPaths, {
            persistent: true,
            ignoreInitial: true,
            ignored: [
                '**/.git/**',
                '**/node_modules/**',
                '**/*.log',
                '**/*.tmp',
                '**/*~'
            ]
        });

        this.watcher.on('change', (filepath) => {
            this.handleFileChange(filepath);
        });

        this.watcher.on('error', (error) => {
            console.error(chalk.red('Watch error:'), error);
        });
    }

    private handleFileChange(filepath: string): void {
        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce rapid changes
        this.debounceTimer = setTimeout(() => {
            const relativePath = path.relative(process.cwd(), filepath);
            const timestamp = new Date().toLocaleTimeString();
            
            console.log(chalk.gray(`[${timestamp}] `) + chalk.yellow(`♻️  Changed: ${relativePath}`));
            
            this.regenerate();
        }, this.options.debounceMs || 500);
    }

    private async regenerate(): Promise<void> {
        if (this.isGenerating) {
            console.log(chalk.yellow('⏳ Generation already in progress...'));
            return;
        }

        this.isGenerating = true;
        const startTime = Date.now();
        const timestamp = new Date().toLocaleTimeString();

        try {
            if (this.options.clearConsole && this.generationCount > 0) {
                console.clear();
                this.printHeader();
            }

            console.log(chalk.gray(`[${timestamp}] `) + chalk.blue('🔄 Regenerating...'));

            // Validate grammar first
            const isValid = await this.generator.validateGrammar(this.grammarPath);
            if (!isValid) {
                throw new Error('Grammar validation failed');
            }

            // Generate extension
            const { extensionDir } = await this.generator.generateExtension(this.grammarPath, this.outputDir);
            // Store the extension directory for potential use
            this.extensionDir = extensionDir;

            const duration = Date.now() - startTime;
            this.lastGenerationTime = duration;
            this.generationCount++;
            this.errorCount = 0;

            console.log(
                chalk.gray(`[${timestamp}] `) + 
                chalk.green(`✅ Regenerated successfully in ${duration}ms`) +
                chalk.gray(` (Generation #${this.generationCount})`)
            );

            // Notify development server
            if (this.devServer) {
                this.devServer.notifyReload();
                console.log(chalk.gray(`[${timestamp}] `) + chalk.cyan('🔄 Browser reloaded'));
            }

        } catch (error) {
            this.errorCount++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.log(
                chalk.gray(`[${timestamp}] `) + 
                chalk.red(`❌ Generation failed (Error #${this.errorCount}):`)
            );
            console.error(chalk.red(errorMessage));
            
            if (this.options.verbose && error instanceof Error && error.stack) {
                console.error(chalk.gray(error.stack));
            }
            
            console.log(chalk.yellow('\n⏳ Waiting for fixes...'));
            
            // Notify development server of error
            if (this.devServer) {
                this.devServer.notifyError(errorMessage);
            }
        } finally {
            this.isGenerating = false;
        }
    }

    private printHeader(): void {
        console.log(chalk.bold.blue('GLSP Generator - Watch Mode'));
        console.log(chalk.gray('='.repeat(50)));
        console.log(chalk.cyan('Grammar:'), this.grammarPath);
        console.log(chalk.cyan('Output:'), this.outputDir);
        
        if (this.options.config) {
            console.log(chalk.cyan('Config:'), this.options.config);
        }
        
        if (this.options.serve) {
            console.log(chalk.cyan('Server:'), `http://localhost:${this.options.port || 3000}`);
        }
        
        console.log(chalk.gray('='.repeat(50)));
    }

    // Statistics for debugging
    getStats() {
        return {
            generationCount: this.generationCount,
            errorCount: this.errorCount,
            lastGenerationTime: this.lastGenerationTime,
            isGenerating: this.isGenerating
        };
    }
}