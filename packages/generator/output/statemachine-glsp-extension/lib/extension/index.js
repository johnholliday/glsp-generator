// VSCode extension entry point for statemachine GLSP extension
import * as vscode from 'vscode';
/**
 * This method is called when your extension is activated.
 */
export function activate(context) {
    console.log('statemachine-glsp-extension is now active!');
    // Register a command to open the diagram
    const openDiagramCommand = vscode.commands.registerCommand('statemachine.diagram.open', async (uri) => {
        // If no URI provided, get the active editor's document URI
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            }
            else {
                // Let user select a file
                const files = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'Statemachine Files': ['sm']
                    }
                });
                if (files && files.length > 0) {
                    uri = files[0];
                }
                else {
                    return;
                }
            }
        }
        // Open the diagram view
        try {
            await vscode.commands.executeCommand('vscode.openWith', uri, 'statemachine.diagram');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open diagram: ${error}`);
        }
    });
    context.subscriptions.push(openDiagramCommand);
    // Register the custom editor provider
    const provider = new StatemachineDiagramProvider(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('statemachine.diagram', provider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
}
/**
 * Custom editor provider for statemachine diagrams
 */
class StatemachineDiagramProvider {
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview, document);
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'ready':
                    // Send the document content to the webview
                    webviewPanel.webview.postMessage({
                        type: 'update',
                        text: document.getText()
                    });
                    break;
            }
        }, undefined, this.context.subscriptions);
        // Update the webview when the document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                webviewPanel.webview.postMessage({
                    type: 'update',
                    text: document.getText()
                });
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }
    getWebviewContent(webview, document) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'style.css'));
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; img-src ${webview.cspSource} https:;">
            <title>Statemachine Diagram</title>
            <link rel="stylesheet" href="${styleUri}">
            <style>
                body {
                    padding: 0;
                    margin: 0;
                    overflow: hidden;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                #sprotty-container {
                    width: 100vw;
                    height: 100vh;
                }
                .sprotty-graph {
                    width: 100%;
                    height: 100%;
                }
            </style>
        </head>
        <body>
            <div id="sprotty-container"></div>
            <div id="sprotty-hidden" style="display: none;"></div>
            <div id="sprotty-popup" style="position: absolute; display: none;"></div>
            <script>
                window.documentUri = '${document.uri.toString()}';
                window.initialContent = ${JSON.stringify(document.getText())};
            </script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    console.log('statemachine-glsp-extension is now deactivated!');
}
//# sourceMappingURL=index.js.map