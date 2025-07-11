import { LinterRule, LinterContext, Diagnostic, DiagnosticSeverity } from '../types.js';

export class NoCircularRefsRule implements LinterRule {
    code = 'no-circular-refs';
    name = 'No Circular References';
    description = 'Detect circular inheritance chains';
    defaultSeverity: DiagnosticSeverity = 'warning';

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, grammarFile } = context;

        const inheritanceMap = new Map<string, string[]>();

        // Build inheritance map
        if (ast.rules) {
            for (const rule of ast.rules) {
                if (rule.$type === 'Interface' && rule.name) {
                    const superTypes: string[] = [];
                    if (rule.superTypes) {
                        for (const superType of rule.superTypes) {
                            if (typeof superType === 'string') {
                                superTypes.push(superType);
                            } else if (superType.name) {
                                superTypes.push(superType.name);
                            }
                        }
                    }
                    inheritanceMap.set(rule.name, superTypes);
                }
            }
        }

        // Check for circular references
        for (const [interfaceName, superTypes] of inheritanceMap) {
            const visited = new Set<string>();
            if (this.hasCircularRef(interfaceName, inheritanceMap, visited)) {
                diagnostics.push({
                    severity: 'warning',
                    code: 'GLSP004',
                    message: `Circular inheritance detected for interface "${interfaceName}"`,
                    location: {
                        file: grammarFile,
                        line: 1, // TODO: Get actual line number
                        column: 1
                    },
                    suggestions: [{
                                description: `Break the circular inheritance chain`,
                                changes: []
                            }]
                });
            }
        }

        return diagnostics;
    }

    private hasCircularRef(
        interfaceName: string,
        inheritanceMap: Map<string, string[]>,
        visited: Set<string>,
        path: string[] = []
    ): boolean {
        if (visited.has(interfaceName)) {
            return path.includes(interfaceName);
        }

        visited.add(interfaceName);
        path.push(interfaceName);

        const superTypes = inheritanceMap.get(interfaceName) || [];
        for (const superType of superTypes) {
            if (this.hasCircularRef(superType, inheritanceMap, visited, path)) {
                return true;
            }
        }

        path.pop();
        return false;
    }
}