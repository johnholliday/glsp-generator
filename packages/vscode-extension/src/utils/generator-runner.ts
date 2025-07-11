import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import { ApiClient } from './api-client';

export interface GeneratorResult {
    success: boolean;
    output?: string;
    error?: string;
}

export class GeneratorRunner {
    private outputChannel: vscode.OutputChannel;
    private apiClient?: ApiClient;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('GLSP Generator');
        
        // Check if API mode is enabled
        const config = vscode.workspace.getConfiguration('glsp.generator');
        const useApi = config.get<boolean>('useApi');
        this.outputChannel.appendLine(`API mode enabled: ${useApi}`);
        
        if (useApi) {
            const apiUrl = config.get<string>('apiUrl') || 'http://localhost:51620';
            this.outputChannel.appendLine(`Creating API client with URL: ${apiUrl}`);
            this.apiClient = new ApiClient(apiUrl);
        } else {
            this.outputChannel.appendLine('API mode disabled, using CLI');
        }
    }

    async generateProject(grammarPath: string, outputDir: string): Promise<GeneratorResult> {
        return this.runGenerator(['generate', grammarPath, outputDir, '--no-vscode', '--no-subdir']);
    }

    async validateGrammar(grammarPath: string): Promise<GeneratorResult> {
        if (this.apiClient) {
            const result = await this.apiClient.validateGrammar(grammarPath);
            return {
                success: result.success,
                error: result.error
            };
        }
        // Use a proper validate output directory
        const grammarName = path.basename(grammarPath, '.langium');
        const validateDir = path.join(path.dirname(grammarPath), `${grammarName}.validate`);
        return this.runGenerator(['generate', grammarPath, validateDir, '--no-vscode', '--no-glsp', '--no-model-server']).then(result => {
            // The validation-only output can be used for inspection
            return result;
        });
    }
    
    async generateTheiaApp(grammarPath: string, outputDir: string): Promise<GeneratorResult> {
        if (this.apiClient) {
            const result = await this.apiClient.generateTheiaApp(grammarPath, outputDir);
            return {
                success: result.success,
                output: result.filePath,
                error: result.error
            };
        }
        // Generate full Theia application with all components
        return this.runGenerator(['generate', grammarPath, outputDir]);
    }

    private runGenerator(args: string[]): Promise<GeneratorResult> {
        return new Promise((resolve) => {
            this.outputChannel.clear();
            this.outputChannel.show();
            
            console.log('GeneratorRunner.runGenerator called with args:', args);
            this.outputChannel.appendLine(`Starting generator with args: ${args.join(' ')}`);
            
            // Try different command names, prioritizing glspgen
            const commands = ['glspgen', 'glsp', 'node'];
            let commandIndex = 0;

            const tryNextCommand = () => {
                if (commandIndex >= commands.length) {
                    resolve({
                        success: false,
                        error: 'GLSP Generator not found. Please ensure it is installed globally.'
                    });
                    return;
                }

                const command = commands[commandIndex];
                let finalArgs = args;

                // Special handling for node
                if (command === 'node') {
                    // Try multiple paths for cross-platform support
                    const possiblePaths = [
                        // WSL path from Windows
                        path.join('\\\\wsl$', 'Ubuntu', 'home', 'john', 'projects', 'utils', 'glsp-generator', 'packages', 'generator', 'dist', 'cli.js'),
                        // Relative path in monorepo
                        path.join(__dirname, '..', '..', '..', '..', 'generator', 'dist', 'cli.js'),
                        // Direct path if running from source
                        path.join(process.cwd(), 'packages', 'generator', 'dist', 'cli.js')
                    ];
                    
                    let cliPath = possiblePaths[0]; // Default to WSL path
                    for (const testPath of possiblePaths) {
                        if (require('fs').existsSync(testPath)) {
                            cliPath = testPath;
                            break;
                        }
                    }
                    
                    finalArgs = [cliPath, ...args];
                    this.outputChannel.appendLine(`Resolved CLI path: ${cliPath}`);
                }

                this.outputChannel.appendLine(`Trying: ${command} ${finalArgs.join(' ')}`);
                this.outputChannel.appendLine(`Working directory: ${path.dirname(args[1])}`);
                this.outputChannel.appendLine(`Full command: ${command} ${finalArgs.join(' ')}`);

                // Try without shell first for better error reporting
                const useShell = command !== 'node';
                const proc = spawn(command, finalArgs, {
                    shell: useShell,
                    cwd: path.dirname(args[1]), // Use grammar file directory as cwd
                    env: { ...process.env, DEBUG: 'glsp-generator:*' }, // Enable debug logging
                    windowsHide: true
                });

                let output = '';
                let error = '';
                let fullOutput = '';

                proc.stdout.on('data', (data) => {
                    const text = data.toString();
                    output += text;
                    fullOutput += text;
                    this.outputChannel.append(text);
                });

                proc.stderr.on('data', (data) => {
                    const text = data.toString();
                    error += text;
                    fullOutput += text;
                    this.outputChannel.append(text);
                });

                proc.on('error', (err) => {
                    commandIndex++;
                    tryNextCommand();
                });

                proc.on('close', (code) => {
                    // Check if generation was successful based on output content
                    const isSuccess = fullOutput.includes('Generation complete') || 
                                    fullOutput.includes('Ecosystem generated successfully') ||
                                    fullOutput.includes('VSIX generated') ||
                                    fullOutput.includes('VSIX package ready');
                    
                    this.outputChannel.appendLine(`\n=== Process exited with code ${code} ===`);
                    this.outputChannel.appendLine(`Success check: ${isSuccess}`);
                    this.outputChannel.appendLine(`Full output length: ${fullOutput.length} chars`);
                    
                    if (code === 0 || isSuccess) {
                        resolve({ success: true, output: fullOutput });
                    } else if (commandIndex < commands.length - 1) {
                        commandIndex++;
                        tryNextCommand();
                    } else {
                        // Return the full output for better error diagnosis
                        resolve({ success: false, error: fullOutput || `Process exited with code ${code}` });
                    }
                });
            };

            tryNextCommand();
        });
    }

    dispose() {
        this.outputChannel.dispose();
        if (this.apiClient) {
            this.apiClient.dispose();
        }
    }
}