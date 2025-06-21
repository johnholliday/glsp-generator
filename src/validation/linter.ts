import {
    Diagnostic,
    LinterRule,
    LinterContext,
    ValidationResult,
    DiagnosticSeverity
} from './types.js';
import { LinterConfig } from '../config/types.js';
import { DiagnosticFormatter } from './diagnostics.js';
import * as rules from './rules/index.js';

export class GrammarLinter {
    private rules: Map<string, LinterRule> = new Map();
    private config: LinterConfig;
    private formatter: DiagnosticFormatter;

    constructor(config?: LinterConfig) {
        this.config = config || this.getDefaultConfig();
        this.formatter = new DiagnosticFormatter();
        this.registerBuiltinRules();
    }

    private getDefaultConfig(): LinterConfig {
        return {
            rules: {
                'naming-conventions': 'error',
                'no-duplicate-properties': 'error',
                'no-circular-refs': 'warning',
                'no-undefined-types': 'error'
                // Additional rules will be enabled as they are implemented:
                // 'prefer-arrays-over-many': 'info',
                // 'max-inheritance-depth': ['warning', 5],
                // 'glsp-compatible-types': 'error',
                // 'no-empty-interfaces': 'warning',
                // 'consistent-property-types': 'info'
            }
        };
    }

    private registerBuiltinRules(): void {
        // Register all built-in rules
        Object.values(rules).forEach(RuleClass => {
            const rule = new RuleClass();
            this.rules.set(rule.code, rule);
        });
    }

    async lintGrammar(
        grammarFile: string,
        grammarContent: string,
        ast: any
    ): Promise<ValidationResult> {
        const lines = grammarContent.split('\n');
        const diagnostics: Diagnostic[] = [];

        // Create linter context
        const context: LinterContext = {
            grammarFile,
            grammarContent,
            lines,
            ast,
            reportDiagnostic: (diagnostic) => {
                const fullDiagnostic: Diagnostic = {
                    severity: diagnostic.severity || 'error',
                    code: diagnostic.code || 'GLSP000',
                    message: diagnostic.message || 'Unknown error',
                    location: diagnostic.location || { file: grammarFile, line: 1, column: 1 },
                    source: diagnostic.source,
                    suggestions: diagnostic.suggestions,
                    documentation: diagnostic.documentation
                };
                diagnostics.push(fullDiagnostic);
            }
        };

        // Run each enabled rule
        for (const [ruleName, ruleConfig] of Object.entries(this.config.rules)) {
            if (ruleConfig === 'off') continue;

            const rule = this.rules.get(ruleName);
            if (!rule) {
                console.warn(`Unknown linter rule: ${ruleName}`);
                continue;
            }

            // Determine severity and options
            let severity: DiagnosticSeverity;
            let options: any = {};

            if (Array.isArray(ruleConfig)) {
                severity = ruleConfig[0] as DiagnosticSeverity;
                options = ruleConfig[1];
            } else {
                severity = ruleConfig as DiagnosticSeverity;
            }

            // Run the rule
            try {
                const ruleDiagnostics = rule.validate(context);

                // Apply configured severity
                ruleDiagnostics.forEach(d => {
                    d.severity = severity;
                    diagnostics.push(d);
                });
            } catch (error) {
                console.error(`Error running rule ${ruleName}:`, error);
            }
        }

        // Sort diagnostics by location
        diagnostics.sort((a, b) => {
            if (a.location.line !== b.location.line) {
                return a.location.line - b.location.line;
            }
            return a.location.column - b.location.column;
        });

        // Count by severity
        const errorCount = diagnostics.filter(d => d.severity === 'error').length;
        const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
        const infoCount = diagnostics.filter(d => d.severity === 'info').length;
        const hintCount = diagnostics.filter(d => d.severity === 'hint').length;

        return {
            diagnostics,
            valid: errorCount === 0,
            errorCount,
            warningCount,
            infoCount,
            hintCount
        };
    }

    formatResults(result: ValidationResult, grammarFile: string, sourceLines?: string[]): string {
        const parts: string[] = [];

        // Header
        parts.push(this.formatter.formatValidationHeader(grammarFile));

        // Format each diagnostic
        result.diagnostics.forEach(diagnostic => {
            parts.push(this.formatter.formatDiagnostic(diagnostic, sourceLines));
        });

        // Summary
        parts.push(this.formatter.formatSummary(result.diagnostics));

        // Footer
        parts.push(this.formatter.formatValidationFooter(!result.valid));

        return parts.join('\n');
    }

    updateConfig(config: Partial<LinterConfig>): void {
        this.config = {
            ...this.config,
            ...config,
            rules: {
                ...this.config.rules,
                ...(config.rules || {})
            }
        };
    }
}