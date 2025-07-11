import * as vscode from 'vscode';
import * as path from 'path';
import { GeneratorRunner } from '../utils/generator-runner';

export class GenerateProjectCommand {
    constructor(private runner: GeneratorRunner) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const config = vscode.workspace.getConfiguration('glsp.generator');
        
        // Get default output directory from settings
        const defaultOutputDir = config.get<string>('outputDirectory', '.');
        const outputRelativeToGrammar = config.get<boolean>('outputRelativeToGrammar', true);
        
        // Calculate default value based on settings
        let defaultValue: string;
        if (defaultOutputDir === '.') {
            // Use grammar name-based default
            defaultValue = path.basename(grammarPath, '.langium') + '-vscode';
        } else {
            // Use configured default
            defaultValue = defaultOutputDir;
        }
        
        // Ask user for output directory
        const outputDirName = await vscode.window.showInputBox({
            prompt: 'Enter output directory name',
            value: defaultValue,
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Directory name cannot be empty';
                }
                return null;
            }
        });
        
        if (!outputDirName) {
            return;
        }
        
        // Determine base directory based on settings
        let baseDir: string;
        if (outputRelativeToGrammar) {
            baseDir = path.dirname(grammarPath);
        } else if (workspaceFolder) {
            baseDir = workspaceFolder.uri.fsPath;
        } else {
            baseDir = path.dirname(grammarPath);
        }
        
        // Construct final output directory
        const outputDir = path.isAbsolute(outputDirName) 
            ? outputDirName 
            : path.join(baseDir, outputDirName);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating GLSP Project",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Parsing grammar..." });
                
                const result = await this.runner.generateProject(grammarPath, outputDir);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                if (result.success) {
                    const openProject = await vscode.window.showInformationMessage(
                        `Project generated at: ${outputDirName}`,
                        'Open in New Window',
                        'Open Folder'
                    );
                    
                    if (openProject === 'Open in New Window') {
                        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(outputDir), true);
                    } else if (openProject === 'Open Folder') {
                        vscode.env.openExternal(vscode.Uri.file(outputDir));
                    }
                } else {
                    vscode.window.showErrorMessage(`Generation failed: ${result.error || 'Unknown error'}`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Generation failed: ${error.message}`);
            }
        });
    }
}