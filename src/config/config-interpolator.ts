import { GLSPConfig } from './types.js';
import { ParsedGrammar } from '../types/grammar.js';

export interface InterpolationContext {
    grammar: string;          // Grammar name from the file
    grammarName: string;      // Same as grammar for clarity
    projectName: string;      // Project name derived from grammar
    fileName: string;         // Original grammar file name (without extension)
    timestamp: string;        // Current timestamp
    date: string;            // Current date
    year: string;            // Current year
    [key: string]: any;      // Allow custom variables
}

/**
 * Interpolate template variables in configuration values
 */
export class ConfigInterpolator {
    private static readonly VARIABLE_PATTERN = /\$\{([^}]+)\}/g;

    /**
     * Create interpolation context from parsed grammar
     */
    static createContext(parsedGrammar: ParsedGrammar, grammarFileName: string): InterpolationContext {
        const now = new Date();
        const fileName = grammarFileName.replace(/\.[^.]+$/, ''); // Remove extension
        
        return {
            grammar: parsedGrammar.projectName,
            grammarName: parsedGrammar.projectName,
            projectName: parsedGrammar.projectName,
            fileName: fileName,
            timestamp: now.toISOString(),
            date: now.toLocaleDateString(),
            year: now.getFullYear().toString(),
            // Add more context as needed
        };
    }

    /**
     * Interpolate variables in a string value
     */
    static interpolateString(value: string, context: InterpolationContext): string {
        return value.replace(this.VARIABLE_PATTERN, (match, varName) => {
            // Support nested property access (e.g., ${grammar.name})
            const parts = varName.trim().split('.');
            let result: any = context;
            
            for (const part of parts) {
                if (result && typeof result === 'object' && part in result) {
                    result = result[part];
                } else {
                    // If variable not found, return the original placeholder
                    return match;
                }
            }
            
            // Convert result to string
            return result != null ? String(result) : match;
        });
    }

    /**
     * Recursively interpolate all string values in an object
     */
    static interpolateObject<T>(obj: T, context: InterpolationContext): T {
        if (typeof obj === 'string') {
            return this.interpolateString(obj, context) as any;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.interpolateObject(item, context)) as any;
        }
        
        if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.interpolateObject(value, context);
            }
            return result;
        }
        
        return obj;
    }

    /**
     * Interpolate all template variables in a configuration
     */
    static interpolateConfig(config: GLSPConfig, context: InterpolationContext): GLSPConfig {
        return this.interpolateObject(config, context);
    }

    /**
     * Get list of available variables for documentation
     */
    static getAvailableVariables(): string[] {
        return [
            '${grammar}',           // Grammar name from the parsed file
            '${grammarName}',       // Same as ${grammar}
            '${projectName}',       // Project name (usually same as grammar)
            '${fileName}',          // Grammar file name without extension
            '${timestamp}',         // ISO timestamp
            '${date}',             // Formatted date
            '${year}',             // Current year
        ];
    }
}