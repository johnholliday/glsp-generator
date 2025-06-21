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