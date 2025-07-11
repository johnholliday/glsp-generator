import { LinterRule, LinterContext, Diagnostic, DiagnosticSeverity, Fix } from '../types.js';

export class NamingConventionsRule implements LinterRule {
    code = 'naming-conventions';
    name = 'Naming Conventions';
    description = 'Enforce naming conventions for interfaces, types, and properties';
    defaultSeverity: DiagnosticSeverity = 'error';

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, grammarFile } = context;

        // Check interfaces
        if (ast.rules) {
            for (const rule of ast.rules) {
                if (rule.$type === 'Interface' && rule.name) {
                    // Interface names should be PascalCase
                    if (!this.isPascalCase(rule.name)) {
                        diagnostics.push({
                            severity: 'error',
                            code: 'GLSP001',
                            message: `Interface name "${rule.name}" should be PascalCase`,
                            location: {
                                file: grammarFile,
                                line: rule.$cstNode?.range?.start?.line || 1,
                                column: rule.$cstNode?.range?.start?.character || 1
                            },
                            suggestions: [{
                                description: `Rename to "${this.toPascalCase(rule.name)}"`,
                                changes: []
                            }]
                        });
                    }

                    // Check property names (should be camelCase)
                    if (rule.features) {
                        for (const feature of rule.features) {
                            if (feature.name && !this.isCamelCase(feature.name)) {
                                diagnostics.push({
                                    severity: 'error',
                                    code: 'GLSP002',
                                    message: `Property name "${feature.name}" should be camelCase`,
                                    location: {
                                        file: grammarFile,
                                        line: feature.$cstNode?.range?.start?.line || 1,
                                        column: feature.$cstNode?.range?.start?.character || 1
                                    },
                                    suggestions: [{
                                        description: `Rename to "${this.toCamelCase(feature.name)}"`,
                                        changes: []
                                    }]
                                });
                            }
                        }
                    }
                }
            }
        }

        return diagnostics;
    }

    private isPascalCase(name: string): boolean {
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    }

    private isCamelCase(name: string): boolean {
        return /^[a-z][a-zA-Z0-9]*$/.test(name);
    }

    private toPascalCase(name: string): string {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    private toCamelCase(name: string): string {
        return name.charAt(0).toLowerCase() + name.slice(1);
    }
}