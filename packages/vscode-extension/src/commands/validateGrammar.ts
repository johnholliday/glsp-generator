import * as vscode from 'vscode';
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
                `Validation error: ${error.message}`,
                vscode.DiagnosticSeverity.Error
            );
            
            diagnosticCollection.set(uri, [diagnostic]);
            vscode.window.showErrorMessage(`Validation error: ${error.message}`);
        }
    }
}