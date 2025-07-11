
const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

function activate(context) {
    console.log('GLSP Generator context menus activated');

    // Helper function to run CLI commands
    function runCommand(args, cwd) {
        const cliPath = path.join(context.extensionPath, '..', '..', '..', 'dist', 'cli.js');
        const command = `node "${cliPath}" ${args}`;
        
        const terminal = vscode.window.createTerminal({
            name: 'GLSP Generator',
            cwd: cwd
        });
        terminal.show();
        terminal.sendText(command);
    }

    // Register commands
    const commands = [
        {
            id: 'glsp-generator.generateVSIX',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(`generate "${uri.fsPath}" "${outputDir}"`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateDev',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(`generate "${uri.fsPath}" "${outputDir}" --dev`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateDebug',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(`generate "${uri.fsPath}" "${outputDir}" --debug`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateProject',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(`generate "${uri.fsPath}" "${outputDir}" --no-vsix`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.validate',
            handler: (uri) => {
                runCommand(`validate "${uri.fsPath}"`, vscode.workspace.rootPath);
            }
        }
    ];

    commands.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(cmd.id, cmd.handler);
        context.subscriptions.push(disposable);
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
