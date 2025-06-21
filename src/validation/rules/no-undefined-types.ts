import { Diagnostic, LinterRule, LinterContext } from '../types.js';
import { createDiagnostic } from '../diagnostics.js';

export class NoUndefinedTypesRule implements LinterRule {
    code = 'no-undefined-types';
    name = 'No Undefined Types';
    description = 'Ensures all referenced types are defined';
    defaultSeverity = 'error' as const;

    validate(context: LinterContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const { ast, lines, grammarFile } = context;

        // Collect all defined types
        const definedTypes = new Set<string>();
        const builtinTypes = new Set(['string', 'number', 'boolean', 'ID']);
        
        if (ast.rules) {
            ast.rules.forEach((rule: any) => {
                if (rule.name) {
                    definedTypes.add(rule.name);
                }
                // Also add type aliases
                if (rule.$type === 'Type' && rule.name) {
                    definedTypes.add(rule.name);
                }
            });
        }

        // Check all type references
        if (ast.rules) {
            ast.rules.forEach((rule: any) => {
                // Check super types
                if (rule.superTypes) {
                    rule.superTypes.forEach((superType: any) => {
                        const typeName = this.extractTypeName(superType);
                        if (typeName && !definedTypes.has(typeName) && !builtinTypes.has(typeName)) {
                            const location = this.findTypeLocation(typeName, rule, lines);
                            diagnostics.push(this.createUndefinedTypeDiagnostic(
                                typeName, 
                                location, 
                                grammarFile, 
                                Array.from(definedTypes)
                            ));
                        }
                    });
                }

                // Check property types
                if (rule.features) {
                    rule.features.forEach((feature: any) => {
                        if (feature.type) {
                            const typeName = this.extractTypeName(feature.type);
                            if (typeName && !definedTypes.has(typeName) && !builtinTypes.has(typeName)) {
                                const location = this.findTypeLocation(typeName, feature, lines);
                                diagnostics.push(this.createUndefinedTypeDiagnostic(
                                    typeName, 
                                    location, 
                                    grammarFile, 
                                    Array.from(definedTypes)
                                ));
                            }
                        }
                    });
                }

                // For Type aliases, we don't check the elements because:
                // 1. String literals like 'log' are values, not type references
                // 2. If it's a union of types (not string literals), those would be
                //    checked when used in interfaces anyway
            });
        }

        return diagnostics;
    }

    private extractTypeName(typeRef: any): string | null {
        if (typeof typeRef === 'string') {
            return typeRef.replace(/[@\[\]?]/g, '');
        }
        if (typeRef && typeRef.value) {
            return typeRef.value.replace(/[@\[\]?]/g, '');
        }
        if (typeRef && typeRef.$refText) {
            return typeRef.$refText.replace(/[@\[\]?]/g, '');
        }
        return null;
    }

    private findTypeLocation(typeName: string, node: any, lines: string[]): { line: number; column: number } {
        // Search for the type reference in the source
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const index = line.indexOf(typeName);
            if (index !== -1) {
                // Make sure it's not part of a larger word
                const before = index > 0 ? line[index - 1] : ' ';
                const after = index + typeName.length < line.length ? line[index + typeName.length] : ' ';
                if (!/[a-zA-Z0-9]/.test(before) && !/[a-zA-Z0-9]/.test(after)) {
                    return { line: i + 1, column: index + 1 };
                }
            }
        }
        return { line: 1, column: 1 };
    }

    private createUndefinedTypeDiagnostic(
        typeName: string, 
        location: { line: number; column: number },
        grammarFile: string,
        definedTypes: string[]
    ): Diagnostic {
        // Find similar type names for suggestions
        const similar = this.findSimilarTypes(typeName, definedTypes);
        const suggestions = similar.map(similarType => ({
            description: `Did you mean '${similarType}'?`,
            changes: [{
                range: {
                    start: { line: location.line, column: location.column },
                    end: { line: location.line, column: location.column + typeName.length }
                },
                newText: similarType
            }]
        }));

        return createDiagnostic(
            'error',
            'GLSP004',
            `Type '${typeName}' is not defined`,
            {
                file: grammarFile,
                line: location.line,
                column: location.column,
                endColumn: location.column + typeName.length
            },
            {
                suggestions: suggestions.length > 0 ? suggestions : undefined,
                documentation: 'All types must be defined before they can be referenced'
            }
        );
    }

    private findSimilarTypes(typeName: string, definedTypes: string[]): string[] {
        return definedTypes
            .map(defined => ({
                name: defined,
                distance: this.levenshteinDistance(typeName.toLowerCase(), defined.toLowerCase())
            }))
            .filter(item => item.distance <= 2)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(item => item.name);
    }

    private levenshteinDistance(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}