import fs from 'fs-extra';
import path from 'path';
import { Diagnostic, ValidationResult } from './types.js';

export class ValidationReporter {
    async generateMarkdownReport(
        result: ValidationResult,
        grammarFile: string,
        outputPath: string
    ): Promise<void> {
        const content = this.buildMarkdownContent(result, grammarFile);
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    async generateHtmlReport(
        result: ValidationResult,
        grammarFile: string,
        outputPath: string
    ): Promise<void> {
        const content = this.buildHtmlContent(result, grammarFile);
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    private buildMarkdownContent(result: ValidationResult, grammarFile: string): string {
        const lines: string[] = [];
        
        // Header
        lines.push(`# Validation Report for ${path.basename(grammarFile)}`);
        lines.push('');
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        lines.push('');
        
        // Summary
        lines.push('## Summary');
        lines.push('');
        lines.push(`- **Total Issues**: ${result.diagnostics.length}`);
        lines.push(`- **Errors**: ${result.errorCount}`);
        lines.push(`- **Warnings**: ${result.warningCount}`);
        lines.push(`- **Info**: ${result.infoCount}`);
        lines.push(`- **Hints**: ${result.hintCount}`);
        lines.push(`- **Status**: ${result.valid ? '✅ PASSED' : '❌ FAILED'}`);
        lines.push('');
        
        // Issue breakdown
        if (result.diagnostics.length > 0) {
            lines.push('## Issues');
            lines.push('');
            
            // Group by severity
            const grouped = this.groupBySeverity(result.diagnostics);
            
            ['error', 'warning', 'info', 'hint'].forEach(severity => {
                const diagnostics = grouped.get(severity as any);
                if (diagnostics && diagnostics.length > 0) {
                    lines.push(`### ${this.capitalize(severity)}s`);
                    lines.push('');
                    
                    diagnostics.forEach((diagnostic, index) => {
                        lines.push(`#### ${index + 1}. [${diagnostic.code}] ${diagnostic.message}`);
                        lines.push('');
                        lines.push(`**Location**: Line ${diagnostic.location.line}, Column ${diagnostic.location.column}`);
                        lines.push('');
                        
                        if (diagnostic.source) {
                            lines.push('```');
                            lines.push(diagnostic.source);
                            lines.push('```');
                            lines.push('');
                        }
                        
                        if (diagnostic.suggestions && diagnostic.suggestions.length > 0) {
                            lines.push('**Suggestions**:');
                            diagnostic.suggestions.forEach(suggestion => {
                                lines.push(`- ${suggestion.description}`);
                            });
                            lines.push('');
                        }
                        
                        if (diagnostic.documentation) {
                            lines.push(`**See**: ${diagnostic.documentation}`);
                            lines.push('');
                        }
                    });
                }
            });
        }
        
        // Recommendations
        lines.push('## Recommendations');
        lines.push('');
        if (result.errorCount > 0) {
            lines.push('1. Fix all errors before generating GLSP extension');
        }
        if (result.warningCount > 0) {
            lines.push('2. Review warnings as they may cause runtime issues');
        }
        lines.push('3. Consider addressing info and hint messages for better code quality');
        
        return lines.join('\n');
    }

    private buildHtmlContent(result: ValidationResult, grammarFile: string): string {
        const severityColors = {
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            hint: '#6c757d'
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report - ${path.basename(grammarFile)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid transparent;
        }
        .stat-card.error { border-color: ${severityColors.error}; }
        .stat-card.warning { border-color: ${severityColors.warning}; }
        .stat-card.info { border-color: ${severityColors.info}; }
        .stat-card.hint { border-color: ${severityColors.hint}; }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .diagnostic {
            background: #f8f9fa;
            border-left: 4px solid #ccc;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .diagnostic.error { border-left-color: ${severityColors.error}; }
        .diagnostic.warning { border-left-color: ${severityColors.warning}; }
        .diagnostic.info { border-left-color: ${severityColors.info}; }
        .diagnostic.hint { border-left-color: ${severityColors.hint}; }
        .diagnostic-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .diagnostic-code {
            font-family: monospace;
            background: #e9ecef;
            padding: 2px 8px;
            border-radius: 3px;
        }
        .source-code {
            background: #263238;
            color: #aed581;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Monaco', 'Consolas', monospace;
            margin: 10px 0;
        }
        .suggestion {
            background: #e8f5e9;
            padding: 10px;
            border-radius: 4px;
            margin: 5px 0;
        }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Validation Report</h1>
        <p><strong>File:</strong> ${grammarFile}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> <span class="${result.valid ? 'status-passed' : 'status-failed'}">${result.valid ? '✅ PASSED' : '❌ FAILED'}</span></p>
        
        <h2>Summary</h2>
        <div class="summary">
            <div class="stat-card error">
                <div>Errors</div>
                <div class="stat-number">${result.errorCount}</div>
            </div>
            <div class="stat-card warning">
                <div>Warnings</div>
                <div class="stat-number">${result.warningCount}</div>
            </div>
            <div class="stat-card info">
                <div>Info</div>
                <div class="stat-number">${result.infoCount}</div>
            </div>
            <div class="stat-card hint">
                <div>Hints</div>
                <div class="stat-number">${result.hintCount}</div>
            </div>
        </div>
        
        ${this.buildHtmlDiagnostics(result.diagnostics)}
    </div>
</body>
</html>`;
    }

    private buildHtmlDiagnostics(diagnostics: Diagnostic[]): string {
        if (diagnostics.length === 0) {
            return '<h2>No Issues Found</h2><p>Your grammar passes all validation checks! 🎉</p>';
        }

        const grouped = this.groupBySeverity(diagnostics);
        const sections: string[] = [];

        ['error', 'warning', 'info', 'hint'].forEach(severity => {
            const items = grouped.get(severity as any);
            if (items && items.length > 0) {
                sections.push(`<h2>${this.capitalize(severity)}s</h2>`);
                
                items.forEach(diagnostic => {
                    sections.push(`
                        <div class="diagnostic ${severity}">
                            <div class="diagnostic-header">
                                <strong>${diagnostic.message}</strong>
                                <span class="diagnostic-code">${diagnostic.code}</span>
                            </div>
                            <p>Line ${diagnostic.location.line}, Column ${diagnostic.location.column}</p>
                            ${diagnostic.source ? `<div class="source-code"><pre>${this.escapeHtml(diagnostic.source)}</pre></div>` : ''}
                            ${diagnostic.suggestions && diagnostic.suggestions.length > 0 ? `
                                <div>
                                    <strong>Suggestions:</strong>
                                    ${diagnostic.suggestions.map(s => `<div class="suggestion">${s.description}</div>`).join('')}
                                </div>
                            ` : ''}
                            ${diagnostic.documentation ? `<p><small>Documentation: ${diagnostic.documentation}</small></p>` : ''}
                        </div>
                    `);
                });
            }
        });

        return sections.join('\n');
    }

    private groupBySeverity(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
        const grouped = new Map<string, Diagnostic[]>();
        
        diagnostics.forEach(diagnostic => {
            if (!grouped.has(diagnostic.severity)) {
                grouped.set(diagnostic.severity, []);
            }
            grouped.get(diagnostic.severity)!.push(diagnostic);
        });
        
        return grouped;
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}