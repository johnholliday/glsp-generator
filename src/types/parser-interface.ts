import { ParsedGrammar } from './grammar.js';

/**
 * Interface for grammar parsers
 * This enables dependency injection and easier testing
 */
export interface IGrammarParser {
  /**
   * Parse a grammar file and extract interfaces and types
   * @param grammarPath Path to the grammar file
   * @returns Parsed grammar with interfaces and types
   */
  parseGrammarFile(grammarPath: string): Promise<ParsedGrammar>;

  /**
   * Parse grammar content from a string
   * @param grammarContent Grammar content as string
   * @returns Parsed AST or grammar object
   */
  parseGrammar(grammarContent: string): Promise<any>;

  /**
   * Validate if a grammar file is syntactically correct
   * @param grammarPath Path to the grammar file
   * @returns True if valid, false otherwise
   */
  validateGrammarFile(grammarPath: string): Promise<boolean>;
}