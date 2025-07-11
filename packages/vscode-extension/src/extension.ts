import * as vscode from 'vscode';
import { GeneratorRunner } from './utils/generator-runner';
import { GenerateProjectCommand } from './commands/generateProject';
import { ValidateGrammarCommand } from './commands/validateGrammar';
import { GenerateTheiaAppCommand } from './commands/generateTheiaApp';

let generatorRunner: GeneratorRunner;

export function activate(context: vscode.ExtensionContext) {
    console.log('GLSP Generator Tools is now active!');
    
    // Create generator runner
    generatorRunner = new GeneratorRunner();
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('glsp.generateProject',
            async (uri?: vscode.Uri) => {
                if (!uri) {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && activeEditor.document.fileName.endsWith('.langium')) {
                        uri = activeEditor.document.uri;
                    } else {
                        vscode.window.showErrorMessage('Please open a .langium file or right-click on one');
                        return;
                    }
                }
                await new GenerateProjectCommand(generatorRunner).execute(uri);
            }
        ),
        vscode.commands.registerCommand('glsp.validateGrammar',
            async (uri?: vscode.Uri) => {
                if (!uri) {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && activeEditor.document.fileName.endsWith('.langium')) {
                        uri = activeEditor.document.uri;
                    } else {
                        vscode.window.showErrorMessage('Please open a .langium file or right-click on one');
                        return;
                    }
                }
                await new ValidateGrammarCommand(generatorRunner).execute(uri);
            }
        ),
        vscode.commands.registerCommand('glsp.generateTheiaApp',
            async (uri?: vscode.Uri) => {
                if (!uri) {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && activeEditor.document.fileName.endsWith('.langium')) {
                        uri = activeEditor.document.uri;
                    } else {
                        vscode.window.showErrorMessage('Please open a .langium file or right-click on one');
                        return;
                    }
                }
                await new GenerateTheiaAppCommand(generatorRunner).execute(uri);
            }
        )
    );
    
    // Status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(symbol-namespace) GLSP';
    statusBar.tooltip = 'GLSP Generator Tools';
    statusBar.show();
    context.subscriptions.push(statusBar);
    
    // Register disposable
    context.subscriptions.push({
        dispose: () => {
            if (generatorRunner) {
                generatorRunner.dispose();
            }
        }
    });
}

export function deactivate() {
    if (generatorRunner) {
        generatorRunner.dispose();
    }
}