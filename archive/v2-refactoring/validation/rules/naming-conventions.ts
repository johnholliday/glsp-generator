import { Diagnostic, LinterRule, LinterContext } from '../types.js';
import { createDiagnostic } from '../diagnostics.js';

export class NamingConventionsRule implements LinterRule {
    code = 'naming-conventions';
    name = 'Naming Conventions';
    description = 'Enforces naming conventions for interfaces and types';
    defaultSeverity = 'error' as const;

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, lines, grammarFile } = context;

        // Check interface names
        if (ast.rules) {
            ast.rules.forEach((rule: any) => {
                if (rule.$type === 'Interface' && rule.name) {
                    const name = rule.name;
                    if (!this.isPascalCase(name)) {
                        const location = this.getLocation(rule, lines);
                        diagnostics.push(createDiagnostic(
                            'error',
                            'GLSP001',
                            `Interface name '${name}' should be PascalCase`,
                            {
                                file: grammarFile,
                                line: location.line,
                                column: location.column,
                                endColumn: location.column + name.length
                            },
                            {
                                suggestions: [{
                                    description: `Rename to '${this.toPascalCase(name)}'`,
                                    changes: [{
                                        range: {
                                            start: { line: location.line, column: location.column },
                                            end: { line: location.line, column: location.column + name.length }
                                        },
                                        newText: this.toPascalCase(name)
                                    }]
                                }],
                                documentation: 'https://docs.glsp.io/naming-conventions'
                            }
                        ));
                    }
                }

                // Check property names
                if (rule.features) {
                    rule.features.forEach((feature: any) => {
                        if (feature.name && !this.isCamelCase(feature.name)) {
                            const location = this.getLocation(feature, lines);
                            diagnostics.push(createDiagnostic(
                                'warning',
                                'GLSP002',
                                `Property name '${feature.name}' should be camelCase`,
                                {
                                    file: grammarFile,
                                    line: location.line,
                                    column: location.column,
                                    endColumn: location.column + feature.name.length
                                },
                                {
                                    suggestions: [{
                                        description: `Rename to '${this.toCamelCase(feature.name)}'`,
                                        changes: [{
                                            range: {
                                                start: { line: location.line, column: location.column },
                                                end: { line: location.line, column: location.column + feature.name.length }
                                            },
                                            newText: this.toCamelCase(feature.name)
                                        }]
                                    }]
                                }
                            ));
                        }
                    });
                }
            });
        }

        return diagnostics;
    }

    private isPascalCase(str: string): boolean {
        return /^[A-Z][a-zA-Z0-9]*$/.test(str);
    }

    private isCamelCase(str: string): boolean {
        return /^[a-z][a-zA-Z0-9]*$/.test(str);
    }

    private toPascalCase(str: string): string {
        return str
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private toCamelCase(str: string): string {
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }

    private getLocation(node: any, lines: string[]): { line: number; column: number } {
        // Simple location tracking - in real implementation would use Langium's CST
        const text = node.name || '';
        for (let i = 0; i < lines.length; i++) {
            const col = lines[i].indexOf(text);
            if (col !== -1) {
                return { line: i + 1, column: col + 1 };
            }
        }
        return { line: 1, column: 1 };
    }
}