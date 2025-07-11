/**
 * Grammar type definitions for the GLSP generator
 */

import { ElementMetadata, GLSPMetadataConfig, GrammarMetadata } from '../metadata/config-types.js';

// Re-export for backward compatibility
export { ElementMetadata, GrammarMetadata } from '../metadata/config-types.js';

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
  metadata?: ElementMetadata;
}

export interface GrammarType {
  name: string;
  definition: string;
  unionTypes?: string[];
  metadata?: ElementMetadata;
}

export interface ParsedGrammar {
  interfaces: GrammarInterface[];
  types: GrammarType[];
  projectName: string;
  metadata?: GLSPMetadataConfig;
  grammarAST?: any; // Native Langium Grammar object for metadata extraction
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