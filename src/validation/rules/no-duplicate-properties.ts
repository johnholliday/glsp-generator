import { Diagnostic, LinterRule, LinterContext } from '../types.js';
import { createDiagnostic } from '../diagnostics.js';

export class NoDuplicatePropertiesRule implements LinterRule {
    code = 'no-duplicate-properties';
    name = 'No Duplicate Properties';
    description = 'Prevents duplicate property names in interfaces';
    defaultSeverity = 'error' as const;

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, lines, grammarFile } = context;

        if (ast.rules) {
            ast.rules.forEach((rule: any) => {
                if (rule.$type === 'Interface' && rule.features) {
                    const propertyNames = new Map<string, any[]>();

                    // Collect all property names
                    rule.features.forEach((feature: any) => {
                        if (feature.name) {
                            if (!propertyNames.has(feature.name)) {
                                propertyNames.set(feature.name, []);
                            }
                            propertyNames.get(feature.name)!.push(feature);
                        }
                    });

                    // Check for duplicates
                    propertyNames.forEach((occurrences, propertyName) => {
                        if (occurrences.length > 1) {
                            // Report all occurrences except the first
                            occurrences.slice(1).forEach((duplicate, _index) => {
                                const location = this.getLocation(duplicate, propertyName, lines);
                                const firstLocation = this.getLocation(occurrences[0], propertyName, lines);

                                diagnostics.push(createDiagnostic(
                                    'error',
                                    'GLSP003',
                                    `Interface '${rule.name}' has duplicate property '${propertyName}'`,
                                    {
                                        file: grammarFile,
                                        line: location.line,
                                        column: location.column,
                                        endColumn: location.column + propertyName.length
                                    },
                                    {
                                        source: this.getSourceContext(location.line, lines),
                                        suggestions: [{
                                            description: 'Remove duplicate property definition',
                                            changes: [{
                                                range: {
                                                    start: { line: location.line, column: 1 },
                                                    end: { line: location.line + 1, column: 1 }
                                                },
                                                newText: ''
                                            }]
                                        }],
                                        documentation: `First occurrence at line ${firstLocation.line}`
                                    }
                                ));
                            });
                        }
                    });
                }
            });
        }

        return diagnostics;
    }

    private getLocation(_node: any, propertyName: string, lines: string[]): { line: number; column: number } {
        // Find the line containing the property
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(new RegExp(`\\b${propertyName}\\s*:`));
            if (match) {
                return {
                    line: i + 1,
                    column: match.index! + 1
                };
            }
        }
        return { line: 1, column: 1 };
    }

    private getSourceContext(lineNumber: number, lines: string[]): string {
        const contextStart = Math.max(0, lineNumber - 3);
        const contextEnd = Math.min(lines.length, lineNumber + 2);
        return lines.slice(contextStart, contextEnd).join('\n');
    }
}