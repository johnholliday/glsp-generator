import { LinterRule, LinterContext, Diagnostic, DiagnosticSeverity } from '../types.js';

export class NoUndefinedTypesRule implements LinterRule {
    code = 'no-undefined-types';
    name = 'No Undefined Types';
    description = 'Detect references to undefined types';
    defaultSeverity: DiagnosticSeverity = 'error';

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, grammarFile } = context;

        // Collect all defined types
        const definedTypes = new Set<string>();
        
        // Add built-in types
        definedTypes.add('string');
        definedTypes.add('number');
        definedTypes.add('boolean');
        definedTypes.add('Date');

        // Collect interface names
        if (ast.rules) {
            for (const rule of ast.rules) {
                if ((rule.$type === 'Interface' || rule.$type === 'ParserRule') && rule.name) {
                    definedTypes.add(rule.name);
                }
            }
        }

        // Collect type names
        if (ast.types) {
            for (const type of ast.types) {
                if (type.name) {
                    definedTypes.add(type.name);
                }
            }
        }

        // Check property types
        if (ast.rules) {
            for (const rule of ast.rules) {
                if (rule.$type === 'Interface' && rule.features) {
                    for (const feature of rule.features) {
                        if (feature.type) {
                            const typeName = this.extractTypeName(feature.type);
                            if (typeName && !definedTypes.has(typeName)) {
                                diagnostics.push({
                                    severity: 'error',
                                    code: 'GLSP005',
                                    message: `Reference to undefined type "${typeName}"`,
                                    location: {
                                        file: grammarFile,
                                        line: feature.$cstNode?.range?.start?.line || 1,
                                        column: feature.$cstNode?.range?.start?.character || 1
                                    },
                                    suggestions: [{
                                description: `Define type "${typeName}" or use a built-in type`,
                                changes: []
                            }]
                                });
                            }
                        }
                    }
                }

                // Check super types
                if (rule.$type === 'Interface' && rule.superTypes) {
                    for (const superType of rule.superTypes) {
                        const superTypeName = typeof superType === 'string' ? superType : superType.name;
                        if (superTypeName && !definedTypes.has(superTypeName)) {
                            diagnostics.push({
                                severity: 'error',
                                code: 'GLSP006',
                                message: `Reference to undefined super type "${superTypeName}"`,
                                location: {
                                    file: grammarFile,
                                    line: rule.$cstNode?.range?.start?.line || 1,
                                    column: rule.$cstNode?.range?.start?.character || 1
                                },
                                suggestions: [{
                                description: `Define interface "${superTypeName}"`,
                                changes: []
                            }]
                            });
                        }
                    }
                }
            }
        }

        return diagnostics;
    }

    private extractTypeName(type: any): string | null {
        if (typeof type === 'string') {
            return type;
        }
        if (type.$type === 'SimpleType' && type.typeRef) {
            return type.typeRef.name || null;
        }
        if (type.name) {
            return type.name;
        }
        return null;
    }
}