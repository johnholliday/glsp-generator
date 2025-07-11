import { describe, test, expect } from 'vitest';
import { GrammarLinter } from './linter.js';
import { DiagnosticFormatter } from './diagnostics.js';

describe('GrammarLinter', () => {
    let linter: GrammarLinter;
    
    beforeEach(() => {
        linter = new GrammarLinter();
    });

    describe('naming conventions', () => {
        test('should detect lowercase interface names', async () => {
            const grammarContent = `
interface state {
    name: string
}`;
            const ast = {
                $type: 'Grammar',
                rules: [{
                    $type: 'Interface',
                    name: 'state',
                    features: [{ name: 'name', type: 'string' }]
                }]
            };

            const result = await linter.lintGrammar('test.langium', grammarContent, ast);
            
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.diagnostics).toContainEqual(
                expect.objectContaining({
                    code: 'GLSP001',
                    message: expect.stringContaining("should be PascalCase")
                })
            );
        });

        test('should detect uppercase property names', async () => {
            const grammarContent = `
interface State {
    Name: string
}`;
            const ast = {
                $type: 'Grammar',
                rules: [{
                    $type: 'Interface',
                    name: 'State',
                    features: [{ name: 'Name', type: 'string' }]
                }]
            };

            const result = await linter.lintGrammar('test.langium', grammarContent, ast);
            
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.diagnostics).toContainEqual(
                expect.objectContaining({
                    code: 'GLSP002',
                    message: expect.stringContaining("should be camelCase")
                })
            );
        });
    });

    describe('duplicate properties', () => {
        test('should detect duplicate property names', async () => {
            const grammarContent = `
interface State {
    name: string
    name: ID
}`;
            const ast = {
                $type: 'Grammar',
                rules: [{
                    $type: 'Interface',
                    name: 'State',
                    features: [
                        { name: 'name', type: 'string' },
                        { name: 'name', type: 'ID' }
                    ]
                }]
            };

            const result = await linter.lintGrammar('test.langium', grammarContent, ast);
            
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.diagnostics).toContainEqual(
                expect.objectContaining({
                    code: 'GLSP003',
                    message: expect.stringContaining("Duplicate property")
                })
            );
        });
    });

    describe('undefined types', () => {
        test('should detect undefined type references', async () => {
            const grammarContent = `
interface State {
    region: Region
}`;
            const ast = {
                $type: 'Grammar',
                rules: [{
                    $type: 'Interface',
                    name: 'State',
                    features: [{ name: 'region', type: 'Region' }]
                }]
            };

            const result = await linter.lintGrammar('test.langium', grammarContent, ast);
            
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.diagnostics).toContainEqual(
                expect.objectContaining({
                    code: 'GLSP005',
                    message: expect.stringContaining("Reference to undefined type")
                })
            );
        });
    });

    describe('circular references', () => {
        test('should detect circular reference chains', async () => {
            const grammarContent = `
interface A extends B {
    name: string
}
interface B extends A {
    value: number
}`;
            const ast = {
                $type: 'Grammar',
                rules: [
                    {
                        $type: 'Interface',
                        name: 'A',
                        superTypes: ['B'],
                        features: [{ name: 'name', type: 'string' }]
                    },
                    {
                        $type: 'Interface',
                        name: 'B',
                        superTypes: ['A'],
                        features: [{ name: 'value', type: 'number' }]
                    }
                ]
            };

            const result = await linter.lintGrammar('test.langium', grammarContent, ast);
            
            expect(result.warningCount).toBeGreaterThan(0);
            expect(result.diagnostics).toContainEqual(
                expect.objectContaining({
                    code: 'GLSP004',
                    message: expect.stringContaining("Circular inheritance detected")
                })
            );
        });
    });
});

describe('DiagnosticFormatter', () => {
    let formatter: DiagnosticFormatter;
    
    beforeEach(() => {
        formatter = new DiagnosticFormatter();
    });

    test('should format diagnostic with source context', () => {
        const diagnostic = {
            severity: 'error' as const,
            code: 'TEST001',
            message: 'Test error message',
            location: {
                file: 'test.langium',
                line: 3,
                column: 5,
                endColumn: 10
            }
        };
        
        const sourceLines = [
            'interface State {',
            '    name: string',
            '    value: number',
            '}'
        ];

        const formatted = formatter.formatDiagnostic(diagnostic, sourceLines);
        
        expect(formatted).toContain('ERROR');
        expect(formatted).toContain('[TEST001]');
        expect(formatted).toContain('Test error message');
        expect(formatted).toContain('line 3:5');
        expect(formatted).toContain('value: number');
    });

    test('should format summary correctly', () => {
        const diagnostics = [
            { severity: 'error' as const, code: 'E1', message: 'Error 1', location: { file: 'test', line: 1, column: 1 } },
            { severity: 'error' as const, code: 'E2', message: 'Error 2', location: { file: 'test', line: 2, column: 1 } },
            { severity: 'warning' as const, code: 'W1', message: 'Warning 1', location: { file: 'test', line: 3, column: 1 } },
            { severity: 'info' as const, code: 'I1', message: 'Info 1', location: { file: 'test', line: 4, column: 1 } }
        ];

        const summary = formatter.formatSummary(diagnostics);
        
        expect(summary).toContain('2 errors');
        expect(summary).toContain('1 warning');
        expect(summary).toContain('1 info');
    });
});