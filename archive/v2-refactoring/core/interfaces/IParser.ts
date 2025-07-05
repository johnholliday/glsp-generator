/**
 * Parser interfaces following Interface Segregation Principle
 * @module core/interfaces
 * @remarks
 * This module provides parser interfaces that exclusively use Langium's native AST.
 * No custom AST conversion is performed, ensuring compatibility and maintainability.
 */

import { Grammar, LangiumDocument } from 'langium';
import { ParseError, ParseOptions } from '../models';

/**
 * Core parser interface for grammar parsing using Langium AST
 * @interface IParser
 * @public
 * @remarks
 * This interface provides the primary parsing functionality for Langium grammars.
 * It returns native Langium Grammar objects without any custom transformations,
 * following the principle of using Langium API exclusively.
 * 
 * @see {@link https://langium.org/docs/grammar-language/} for Langium grammar syntax
 */
export interface IParser {
  /**
   * Parses a grammar file into a Langium Grammar AST
   * @param grammarPath - Path to the Langium grammar file
   * @param options - Optional parsing configuration
   * @returns Promise resolving to the parsed Langium Grammar AST
   * @throws {@link ParseError} When parsing fails due to syntax errors or invalid grammar
   * 
   * @remarks
   * This method:
   * - Reads the grammar file from the filesystem
   * - Parses it using Langium's built-in parser
   * - Optionally resolves imports and validates references
   * - Returns the native Langium Grammar object
   * 
   * @example
   * Basic parsing:
   * ```typescript
   * const grammar = await parser.parse('./my-dsl.langium');
   * console.log(`Parsed grammar: ${grammar.name}`);
   * ```
   * 
   * @example
   * Parsing with validation:
   * ```typescript
   * const grammar = await parser.parse('./my-dsl.langium', {
   *   resolveImports: true,
   *   validateReferences: true,
   *   throwOnWarnings: false
   * });
   * 
   * // Access grammar elements
   * grammar.rules.forEach(rule => {
   *   console.log(`Rule: ${rule.name}`);
   * });
   * ```
   */
  parse(grammarPath: string, options?: ParseOptions): Promise<Grammar>;

  /**
   * Gets the Langium document for a parsed grammar
   * @param grammarPath - Path to the grammar file
   * @returns Promise resolving to the Langium document
   * 
   * @remarks
   * The LangiumDocument provides access to:
   * - Parse result with the Grammar AST
   * - Diagnostics (errors and warnings)
   * - Text document information
   * - URI and file metadata
   * 
   * @example
   * ```typescript
   * const document = await parser.getDocument('./my-dsl.langium');
   * 
   * // Check for errors
   * if (document.diagnostics?.length > 0) {
   *   document.diagnostics.forEach(diagnostic => {
   *     console.error(`Error at line ${diagnostic.range.start.line}: ${diagnostic.message}`);
   *   });
   * }
   * ```
   */
  getDocument(grammarPath: string): Promise<LangiumDocument>;

  /**
   * Gets the Langium services instance
   * @returns The configured Langium services
   * 
   * @remarks
   * Returns the Langium services object that provides access to all Langium infrastructure including:
   * - Document builder for parsing
   * - Validation services
   * - Reference resolver
   * - Scope provider
   * - Type system
   * 
   * This is useful for advanced scenarios where direct access to
   * Langium internals is needed.
   * 
   * @example
   * ```typescript
   * const services = parser.getServices();
   * const validator = services.validation.DocumentValidator;
   * ```
   */
  getServices(): any; // Returns LangiumGrammarServices but kept generic for flexibility
}

/**
 * Grammar content parser for string-based parsing
 * @interface IContentParser
 * @public
 * @remarks
 * This interface enables parsing of grammar content from strings rather than files.
 * Useful for testing, REPL environments, or when grammar is generated dynamically.
 */
export interface IContentParser {
  /**
   * Parses grammar content from a string
   * @param content - Grammar content as a string
   * @param uri - Document URI for identification and error reporting
   * @param options - Optional parsing configuration
   * @returns Promise resolving to the parsed Langium Grammar
   * @throws {@link ParseError} When parsing fails due to syntax errors
   * 
   * @remarks
   * The URI parameter is used for:
   * - Error reporting (showing the source of errors)
   * - Document identification in the Langium workspace
   * - Import resolution (as a base URI)
   * 
   * @example
   * Basic string parsing:
   * ```typescript
   * const grammarContent = `
   *   grammar MyDSL
   *   entry Model: elements+=Element*;
   *   Element: 'element' name=ID;
   *   terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*\/;
   * `;
   * 
   * const grammar = await parser.parseContent(
   *   grammarContent,
   *   'memory://my-dsl.langium'
   * );
   * ```
   * 
   * @example
   * Parsing with custom URI and options:
   * ```typescript
   * const grammar = await parser.parseContent(
   *   grammarString,
   *   'virtual://generated-grammar.langium',
   *   {
   *     validateReferences: true,
   *     resolveImports: false
   *   }
   * );
   * ```
   */
  parseContent(content: string, uri: string, options?: ParseOptions): Promise<Grammar>;
}

/**
 * Parser cache interface for performance optimization
 * @interface IParserCache
 * @public
 * @remarks
 * Provides caching functionality to avoid re-parsing unchanged grammars.
 * Implementations should handle cache invalidation based on file timestamps
 * or content hashes.
 */
export interface IParserCache {
  /**
   * Gets cached Grammar if available
   * @param key - Cache key (typically the file path)
   * @returns Cached Grammar object or null if not found
   * 
   * @example
   * ```typescript
   * const cached = cache.get('/path/to/grammar.langium');
   * if (cached) {
   *   console.log('Using cached grammar');
   *   return cached;
   * }
   * ```
   */
  get(key: string): Grammar | null;

  /**
   * Sets Grammar in cache
   * @param key - Cache key for later retrieval
   * @param grammar - Grammar object to cache
   * 
   * @example
   * ```typescript
   * const grammar = await parser.parse(filePath);
   * cache.set(filePath, grammar);
   * ```
   */
  set(key: string, grammar: Grammar): void;

  /**
   * Gets cached document if available
   * @param key - Cache key
   * @returns Cached LangiumDocument or null if not found
   * 
   * @remarks
   * Documents contain additional metadata like diagnostics
   * that may be useful to cache alongside the Grammar.
   */
  getDocument(key: string): LangiumDocument | null;

  /**
   * Sets document in cache
   * @param key - Cache key for later retrieval
   * @param document - LangiumDocument to cache
   */
  setDocument(key: string, document: LangiumDocument): void;

  /**
   * Invalidates cache entry
   * @param key - Cache key to invalidate
   * 
   * @remarks
   * Use this when a grammar file has been modified or deleted.
   * Both the Grammar and Document entries should be removed.
   * 
   * @example
   * ```typescript
   * // File watcher detects change
   * fileWatcher.on('change', (filePath) => {
   *   cache.invalidate(filePath);
   * });
   * ```
   */
  invalidate(key: string): void;

  /**
   * Clears entire cache
   * 
   * @remarks
   * Use sparingly as this forces re-parsing of all grammars.
   * Typically used when:
   * - Memory pressure requires cache cleanup
   * - Major configuration changes occur
   * - Testing requires a clean state
   * 
   * @example
   * ```typescript
   * // Clear cache on configuration change
   * config.on('change', () => {
   *   cache.clear();
   * });
   * ```
   */
  clear(): void;
}

/**
 * Parser diagnostics interface for error reporting
 * @interface IParserDiagnostics
 * @public
 * @remarks
 * Provides structured access to parsing diagnostics including errors and warnings.
 * Useful for validation workflows and error reporting.
 */
export interface IParserDiagnostics {
  /**
   * Gets all parsing errors
   * @returns Array of parse errors
   * 
   * @example
   * ```typescript
   * const errors = diagnostics.getErrors();
   * errors.forEach(error => {
   *   console.error(`${error.file}:${error.line} - ${error.message}`);
   * });
   * ```
   */
  getErrors(): ParseError[];

  /**
   * Gets all parsing warnings
   * @returns Array of parse warnings
   * 
   * @example
   * ```typescript
   * const warnings = diagnostics.getWarnings();
   * if (warnings.length > 0 && config.strict) {
   *   throw new Error('Warnings found in strict mode');
   * }
   * ```
   */
  getWarnings(): ParseError[];

  /**
   * Checks if parsing had errors
   * @returns True if any errors exist
   * 
   * @example
   * ```typescript
   * if (diagnostics.hasErrors()) {
   *   throw new Error('Grammar has errors');
   * }
   * ```
   */
  hasErrors(): boolean;

  /**
   * Clears all diagnostics
   * 
   * @remarks
   * Resets the diagnostics state. Typically called before a new parse operation.
   */
  clear(): void;
}