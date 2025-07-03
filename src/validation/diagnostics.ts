import chalk /* , { type ChalkInstance } */ from 'chalk';
import { Diagnostic, DiagnosticSeverity, Location } from './types.js';

export class DiagnosticFormatter {
    private readonly severityColors = {
        error: chalk.red,
        warning: chalk.yellow,
        info: chalk.blue,
        hint: chalk.gray
    };

    private readonly severityIcons = {
        error: '❌',
        warning: '⚠️ ',
        info: 'ℹ️ ',
        hint: '💡'
    };

    formatDiagnostic(diagnostic: Diagnostic, sourceLines?: string[]): string {
        const parts: string[] = [];

        // Header with severity, code, and location
        const severityText = this.severityColors[diagnostic.severity](
            diagnostic.severity.toUpperCase()
        );
        const locationText = chalk.gray(
            `at line ${diagnostic.location.line}:${diagnostic.location.column}`
        );

        parts.push(
            `${this.severityIcons[diagnostic.severity]} ${severityText} [${diagnostic.code}] ${locationText}`
        );

        // Message
        parts.push(diagnostic.message);
        parts.push('');

        // Source context if available
        if (diagnostic.source || sourceLines) {
            parts.push(this.formatSourceContext(diagnostic, sourceLines));
        }

        // Suggestions
        if (diagnostic.suggestions && diagnostic.suggestions.length > 0) {
            parts.push(chalk.green('Suggestion' + (diagnostic.suggestions.length > 1 ? 's' : '') + ':'));
            diagnostic.suggestions.forEach(fix => {
                parts.push(`  • ${fix.description}`);
            });
            parts.push('');
        }

        // Documentation link
        if (diagnostic.documentation) {
            parts.push(chalk.gray(`See: ${diagnostic.documentation}`));
            parts.push('');
        }

        return parts.join('\n');
    }

    private formatSourceContext(diagnostic: Diagnostic, sourceLines?: string[]): string {
        const location = diagnostic.location;
        const lines = diagnostic.source ? diagnostic.source.split('\n') : sourceLines;

        if (!lines) return '';

        const contextLines: string[] = [];
        const startLine = Math.max(1, location.line - 2);
        const endLine = Math.min(lines.length, (location.endLine || location.line) + 2);

        for (let i = startLine; i <= endLine; i++) {
            const lineNum = String(i).padStart(4, ' ');
            const line = lines[i - 1] || '';
            const isErrorLine = i >= location.line && i <= (location.endLine || location.line);

            if (isErrorLine) {
                contextLines.push(chalk.red(`> ${lineNum} | ${line}`));

                // Add underline for the error position
                if (i === location.line) {
                    const padding = ' '.repeat(lineNum.length + 3);
                    const startCol = location.column - 1;
                    const endCol = location.endColumn || startCol + 1;
                    const underline = ' '.repeat(startCol) + chalk.red('^'.repeat(endCol - startCol));
                    contextLines.push(chalk.red(`  ${padding}${underline}`));
                }
            } else {
                contextLines.push(chalk.gray(`  ${lineNum} | ${line}`));
            }
        }

        return contextLines.join('\n') + '\n';
    }

    formatSummary(diagnostics: Diagnostic[]): string {
        const counts = {
            error: 0,
            warning: 0,
            info: 0,
            hint: 0
        };

        diagnostics.forEach(d => counts[d.severity]++);

        const parts: string[] = [];

        if (counts.error > 0) {
            parts.push(chalk.red(`${counts.error} error${counts.error > 1 ? 's' : ''}`));
        }
        if (counts.warning > 0) {
            parts.push(chalk.yellow(`${counts.warning} warning${counts.warning > 1 ? 's' : ''}`));
        }
        if (counts.info > 0) {
            parts.push(chalk.blue(`${counts.info} info${counts.info > 1 ? 's' : ''}`));
        }
        if (counts.hint > 0) {
            parts.push(chalk.gray(`${counts.hint} hint${counts.hint > 1 ? 's' : ''}`));
        }

        if (parts.length === 0) {
            return chalk.green('✅ No issues found');
        }

        return `Summary: ${parts.join(', ')}`;
    }

    formatValidationHeader(grammarFile: string): string {
        const separator = '='.repeat(Math.min(80, grammarFile.length + 12));
        return `Validating: ${grammarFile}\n${separator}\n`;
    }

    formatValidationFooter(hasErrors: boolean): string {
        if (hasErrors) {
            return chalk.red('\nGeneration blocked due to errors. Fix errors and try again.');
        }
        return chalk.green('\n✅ Validation passed');
    }
}

export function createDiagnostic(
    severity: DiagnosticSeverity,
    code: string,
    message: string,
    location: Location,
    options?: {
        source?: string;
        suggestions?: Diagnostic['suggestions'];
        documentation?: string;
    }
): Diagnostic {
    return {
        severity,
        code,
        message,
        location,
        ...options
    };
}