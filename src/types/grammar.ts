import { AstNode } from 'langium';
import { GLSPConfig } from '../config/types.js';

export interface ParsedGrammar {
  interfaces: GrammarInterface[];
  types: GrammarType[];
  projectName: string;
}

export interface GrammarInterface {
  name: string;
  properties: GrammarProperty[];
  superTypes: string[];
}

export interface GrammarProperty {
  name: string;
  type: string;
  optional: boolean;
  array: boolean;
}

export interface GrammarType {
  name: string;
  definition: string;
  unionTypes?: string[];
}

export interface GenerationContext {
  projectName: string;
  grammar: ParsedGrammar;
  outputDir: string;
  config: GLSPConfig;
}

export interface TemplateData {
  projectName: string;
  interfaces: GrammarInterface[];
  types: GrammarType[];
  config: GLSPConfig;
  [key: string]: any;
}

// Additional interfaces for performance optimizations
export interface GrammarAST {
  projectName: string;
  grammarName: string;
  rules: ParsedRule[];
  interfaces: GrammarInterface[];
  types: GrammarType[];
  imports: string[];
  metadata?: {
    ruleCount: number;
    interfaceCount: number;
    parseTime: number;
    [key: string]: any;
  };
}

export interface ParsedRule {
  name: string;
  definition: string;
  type: string;
  properties: string[];
  references: string[];
}

// Type aliases for backward compatibility
export type ParsedInterface = GrammarInterface;
export type ParsedType = GrammarType;
export type ParsedProperty = GrammarProperty;