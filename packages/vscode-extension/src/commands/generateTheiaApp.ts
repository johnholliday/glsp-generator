import * as vscode from 'vscode';
import * as path from 'path';
import { GeneratorRunner } from '../utils/generator-runner';

export class GenerateTheiaAppCommand {
    constructor(private runner: GeneratorRunner) {}
    
    async execute(uri: vscode.Uri) {
        console.log('GenerateTheiaAppCommand.execute called with uri:', uri);
        
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const grammarName = path.basename(grammarPath, '.langium');
        const grammarDir = path.dirname(grammarPath);
        // Create output directory as {grammar-name}.theia in the same directory as the grammar
        const outputDir = path.join(grammarDir, `${grammarName}.theia`);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Theia Application",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Parsing grammar..." });
                
                console.log('Calling runner.generateTheiaApp with:', { grammarPath, outputDir });
                const result = await this.runner.generateTheiaApp(grammarPath, outputDir);
                console.log('Generator result:', result);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Theia application generated in: ${grammarName}.theia`,
                        'Open Folder',
                        'View Instructions'
                    ).then(selection => {
                        if (selection === 'Open Folder') {
                            vscode.env.openExternal(vscode.Uri.file(outputDir));
                        } else if (selection === 'View Instructions') {
                            // Show instructions in output channel
                            const output = vscode.window.createOutputChannel('GLSP Generator Instructions');
                            output.clear();
                            output.appendLine(`Theia Application Generated: ${grammarName}`);
                            output.appendLine('');
                            output.appendLine('Next steps:');
                            output.appendLine(`  1. cd ${outputDir}`);
                            output.appendLine('  2. yarn install');
                            output.appendLine('  3. yarn build');
                            output.appendLine('  4. yarn start:browser  # for browser app');
                            output.appendLine('  5. yarn start:electron # for desktop app');
                            output.show();
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(`Generation failed: ${result.error || 'Unknown error'}`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Generation failed: ${error.message}`);
            }
        });
    }
}