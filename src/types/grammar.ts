/**
 * Grammar type definitions for the GLSP generator
 */

export interface GrammarProperty {
  name: string;
  type: string;
  optional: boolean;
  array: boolean;
  reference?: boolean;
}

export interface GrammarInterface {
  name: string;
  properties: GrammarProperty[];
  superTypes: string[];
}

export interface GrammarType {
  name: string;
  definition: string;
  unionTypes?: string[];
}

export interface ParsedGrammar {
  interfaces: GrammarInterface[];
  types: GrammarType[];
  projectName: string;
}

export interface GenerationContext {
  projectName: string;
  grammar: ParsedGrammar;
  outputDir: string;
  config: any; // GLSPConfig type
}

// Additional types needed by other modules
export interface GrammarAST {
  projectName: string;
  grammarName: string;
  rules: ParsedRule[];
  interfaces: GrammarInterface[];
  types: GrammarType[];
  imports: string[];
  metadata: {
    ruleCount: number;
    interfaceCount: number;
    parseTime: number;
    typeCount: number;
    hasComplexTypes: boolean;
    hasCircularReferences: boolean;
    optimized?: boolean;
    optimizationTime?: number;
  };
}

export interface ParsedRule {
  name: string;
  type: 'interface' | 'type' | 'union';
  properties: GrammarProperty[];
  extends?: string[];
  documentation?: string;
  definition?: string;
  references: string[];
}

export interface ParsedInterface extends GrammarInterface {
  // Alias for compatibility
}

export interface ParsedType extends GrammarType {
  // Alias for compatibility
}