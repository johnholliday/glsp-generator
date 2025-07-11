export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Location {
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}

export interface TextEdit {
    range: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    };
    newText: string;
}

export interface Fix {
    description: string;
    changes: TextEdit[];
}

export interface Diagnostic {
    severity: DiagnosticSeverity;
    code: string; // e.g., 'GLSP001'
    message: string;
    location: Location;
    source?: string; // Code snippet
    suggestions?: Fix[];
    documentation?: string; // URL or reference
}

export interface ValidationResult {
    diagnostics: Diagnostic[];
    valid: boolean;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    hintCount: number;
}

export interface LinterRule {
    code: string;
    name: string;
    description: string;
    defaultSeverity: DiagnosticSeverity;
    validate(context: LinterContext): Diagnostic[];
}

export interface LinterContext {
    grammarFile: string;
    grammarContent: string;
    lines: string[];
    ast: any; // Langium AST
    reportDiagnostic(diagnostic: Partial<Diagnostic>): void;
}

export interface ValidationOptions {
    includeSourceContext?: boolean;
    maxDiagnostics?: number;
    enableSuggestions?: boolean;
}