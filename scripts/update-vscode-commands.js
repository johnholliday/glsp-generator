#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsDir = path.join(__dirname, '..', 'packages', 'vscode-extension', 'src', 'commands');

// Update imports in all command files
const commands = {
    'generateProject.ts': `import * as vscode from 'vscode';
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
        
        // Ask user for output directory
        const outputDirName = await vscode.window.showInputBox({
            prompt: 'Enter output directory name',
            value: path.basename(grammarPath, '.langium') + '-project',
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
        
        const outputDir = workspaceFolder 
            ? path.join(workspaceFolder.uri.fsPath, outputDirName)
            : path.join(path.dirname(grammarPath), outputDirName);
        
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
                        \`Project generated at: \${outputDirName}\`,
                        'Open in New Window',
                        'Open Folder'
                    );
                    
                    if (openProject === 'Open in New Window') {
                        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(outputDir), true);
                    } else if (openProject === 'Open Folder') {
                        vscode.env.openExternal(vscode.Uri.file(outputDir));
                    }
                } else {
                    vscode.window.showErrorMessage(\`Generation failed: \${result.error || 'Unknown error'}\`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(\`Generation failed: \${error.message}\`);
            }
        });
    }
}`,

    'testVSIX.ts': `import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GeneratorRunner } from '../utils/generator-runner';

export class TestVSIXCommand {
    constructor(private runner: GeneratorRunner) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const outputDir = path.dirname(grammarPath);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Testing GLSP Extension",
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Generate VSIX
                progress.report({ increment: 0, message: "Generating VSIX..." });
                const result = await this.runner.generateVSIX(grammarPath, outputDir);
                
                if (!result.success) {
                    throw new Error(result.error || 'Generation failed');
                }
                
                // Step 2: Find the generated VSIX
                progress.report({ increment: 50, message: "Preparing Extension Host..." });
                const vsixFiles = await fs.readdir(outputDir);
                const vsixFile = vsixFiles.find(f => f.endsWith('.vsix'));
                
                if (!vsixFile) {
                    throw new Error('No VSIX file found');
                }
                
                const vsixPath = path.join(outputDir, vsixFile);
                
                // Step 3: Launch Extension Development Host
                progress.report({ increment: 80, message: "Launching Extension Host..." });
                
                // Create a test workspace if it doesn't exist
                const testWorkspace = path.join(outputDir, 'test-workspace');
                await fs.ensureDir(testWorkspace);
                
                // Create a sample file for testing
                const sampleFile = path.join(testWorkspace, 'example.txt');
                await fs.writeFile(sampleFile, 'Test your GLSP extension here!');
                
                // Open new window with the extension
                const extensionDevHost = vscode.Uri.file(testWorkspace);
                await vscode.commands.executeCommand('vscode.openFolder', extensionDevHost, true);
                
                // Note: Auto-installing the VSIX in the new window requires additional setup
                vscode.window.showInformationMessage(
                    \`Extension Host launched! Install the VSIX manually: \${vsixFile}\`,
                    'Copy Path'
                ).then(selection => {
                    if (selection === 'Copy Path') {
                        vscode.env.clipboard.writeText(vsixPath);
                    }
                });
                
            } catch (error: any) {
                vscode.window.showErrorMessage(\`Test failed: \${error.message}\`);
            }
        });
    }
}`,

    'validateGrammar.ts': `import * as vscode from 'vscode';
import { GeneratorRunner } from '../utils/generator-runner';

export class ValidateGrammarCommand {
    constructor(private runner: GeneratorRunner) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const diagnosticCollection = vscode.languages.createDiagnosticCollection('glsp-grammar');
        
        try {
            const result = await this.runner.validateGrammar(grammarPath);
            
            if (result.success) {
                diagnosticCollection.clear();
                vscode.window.showInformationMessage('Grammar is valid! ✅');
            } else {
                // In a real implementation, we'd parse specific errors
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    result.error || 'Grammar validation failed',
                    vscode.DiagnosticSeverity.Error
                );
                
                diagnosticCollection.set(uri, [diagnostic]);
                vscode.window.showErrorMessage('Grammar validation failed. See Problems panel for details.');
            }
        } catch (error: any) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                \`Validation error: \${error.message}\`,
                vscode.DiagnosticSeverity.Error
            );
            
            diagnosticCollection.set(uri, [diagnostic]);
            vscode.window.showErrorMessage(\`Validation error: \${error.message}\`);
        }
    }
}`
};

async function updateCommands() {
    console.log('Updating VSCode extension commands...');
    
    for (const [filename, content] of Object.entries(commands)) {
        const filePath = path.join(commandsDir, filename);
        await fs.writeFile(filePath, content);
        console.log(`Updated ${filename}`);
    }
    
    console.log('All commands updated!');
}

updateCommands().catch(console.error);