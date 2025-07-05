import { Diagnostic, LinterRule, LinterContext } from '../types.js';
import { createDiagnostic } from '../diagnostics.js';

export class NoCircularRefsRule implements LinterRule {
    code = 'no-circular-refs';
    name = 'No Circular References';
    description = 'Detects circular reference chains in the grammar';
    defaultSeverity = 'warning' as const;

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, lines, grammarFile } = context;

        // Build dependency graph
        const dependencies = new Map<string, Set<string>>();

        if (ast.rules) {
            ast.rules.forEach((rule: any) => {
                if (rule.$type === 'Interface' && rule.name) {
                    const deps = new Set<string>();

                    // Add super types
                    if (rule.superTypes) {
                        rule.superTypes.forEach((superType: any) => {
                            const typeName = this.extractTypeName(superType);
                            if (typeName) {
                                deps.add(typeName);
                            }
                        });
                    }

                    // Add reference types (properties with @)
                    if (rule.features) {
                        rule.features.forEach((feature: any) => {
                            if (feature.type && typeof feature.type === 'string' && feature.type.includes('@')) {
                                const typeName = feature.type.replace(/[@\[\]?]/g, '');
                                deps.add(typeName);
                            }
                        });
                    }

                    dependencies.set(rule.name, deps);
                }
            });
        }

        // Check for circular references
        dependencies.forEach((_deps, typeName) => {
            const visited = new Set<string>();
            const path: string[] = [];

            if (this.hasCycle(typeName, dependencies, visited, path)) {
                const location = this.findTypeLocation(typeName, lines);
                const cycle = [...path, typeName].join(' → ');

                diagnostics.push(createDiagnostic(
                    'warning',
                    'GLSP005',
                    `Circular reference detected: ${cycle}`,
                    {
                        file: grammarFile,
                        line: location.line,
                        column: location.column
                    },
                    {
                        documentation: 'Circular references may cause infinite loops during diagram generation',
                        suggestions: [{
                            description: 'Consider using a non-circular model structure or weak references',
                            changes: []
                        }]
                    }
                ));
            }
        });

        return diagnostics;
    }

    private hasCycle(
        current: string,
        dependencies: Map<string, Set<string>>,
        visited: Set<string>,
        path: string[]
    ): boolean {
        if (path.includes(current)) {
            return true;
        }

        if (visited.has(current)) {
            return false;
        }

        visited.add(current);
        path.push(current);

        const deps = dependencies.get(current);
        if (deps) {
            for (const dep of deps) {
                if (this.hasCycle(dep, dependencies, visited, path)) {
                    return true;
                }
            }
        }

        path.pop();
        return false;
    }

    private extractTypeName(typeRef: any): string | null {
        if (typeof typeRef === 'string') {
            return typeRef;
        }
        if (typeRef && typeRef.$refText) {
            return typeRef.$refText;
        }
        return null;
    }

    private findTypeLocation(typeName: string, lines: string[]): { line: number; column: number } {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(new RegExp(`interface\\s+${typeName}\\b`));
            if (match) {
                return {
                    line: i + 1,
                    column: match.index! + 'interface '.length + 1
                };
            }
        }
        return { line: 1, column: 1 };
    }
}