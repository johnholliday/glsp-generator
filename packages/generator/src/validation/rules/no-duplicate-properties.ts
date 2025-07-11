import { LinterRule, LinterContext, Diagnostic, DiagnosticSeverity } from '../types.js';

export class NoDuplicatePropertiesRule implements LinterRule {
    code = 'no-duplicate-properties';
    name = 'No Duplicate Properties';
    description = 'Disallow duplicate property names within an interface';
    defaultSeverity: DiagnosticSeverity = 'error';

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, grammarFile } = context;

        if (ast.rules) {
            for (const rule of ast.rules) {
                if (rule.$type === 'Interface' && rule.features) {
                    const propertyNames = new Map<string, any>();

                    for (const feature of rule.features) {
                        if (feature.name) {
                            if (propertyNames.has(feature.name)) {
                                diagnostics.push({
                                    severity: 'error',
                                    code: 'GLSP003',
                                    message: `Duplicate property "${feature.name}" in interface "${rule.name}"`,
                                    location: {
                                        file: grammarFile,
                                        line: feature.$cstNode?.range?.start?.line || 1,
                                        column: feature.$cstNode?.range?.start?.character || 1
                                    },
                                    suggestions: [{
                                description: `Remove duplicate property or rename it`,
                                changes: []
                            }]
                                });
                            } else {
                                propertyNames.set(feature.name, feature);
                            }
                        }
                    }
                }
            }
        }

        return diagnostics;
    }
}