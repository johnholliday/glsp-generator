/**
 * Langium grammar parser service
 * @module parser/services
 */

import { injectable, inject } from 'inversify';
import { Grammar, LangiumDocument, EmptyFileSystem } from 'langium';
import { createLangiumGrammarServices, LangiumGrammarServices } from 'langium/grammar';
import { URI } from 'vscode-uri';
import { TYPES } from '../../infrastructure/di/symbols';
import { IParser, IParserCache, IContentParser } from '../../core/interfaces';
import { ParseOptions } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';
import { IFileSystem } from '../../infrastructure/filesystem/FileSystemService';
import { GrammarParseError } from '../../infrastructure/errors/ErrorHierarchy';
import * as path from 'path';

/**
 * Langium grammar parser implementation
 * Implements Single Responsibility: Parses Langium grammar files using Langium API
 */
@injectable()
export class LangiumGrammarParser implements IParser, IContentParser {
  private readonly services: LangiumGrammarServices;
  private readonly documentCache = new Map<string, LangiumDocument>();

  constructor(
    @inject(TYPES.IParserCache) private readonly cache: IParserCache,
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(TYPES.IFileSystem) private readonly fileSystem: IFileSystem
  ) {
    this.services = createLangiumGrammarServices(EmptyFileSystem).grammar;
    this.logger.info('LangiumGrammarParser initialized');
  }

  /**
   * Gets the Langium services instance
   */
  getServices(): LangiumGrammarServices {
    return this.services;
  }

  /**
   * Parses a grammar file into a Langium Grammar AST
   */
  async parse(grammarPath: string, options?: ParseOptions): Promise<Grammar> {
    const normalizedPath = path.resolve(grammarPath);
    
    this.logger.debug(`Parsing grammar: ${normalizedPath}`, { options });

    // Check cache (default to true unless explicitly disabled)
    const useCache = options?.useCache !== false;
    if (useCache) {
      const cached = await this.cache.get(normalizedPath);
      if (cached) {
        this.logger.debug('Using cached Grammar', { path: normalizedPath });
        return cached;
      }
    }

    try {
      // Read grammar file
      const content = await this.readGrammarFile(normalizedPath);
      
      // Parse content into document
      const document = await this.parseContentToDocument(content, normalizedPath);
      
      // Store document in cache
      this.documentCache.set(normalizedPath, document);
      
      // Validate document (unless explicitly skipped)
      if (!(options as any)?.skipValidation) {
        await this.validateDocument(document);
      }
      
      // Extract Grammar from parsed document
      const grammar = document.parseResult.value as Grammar;
      
      if (!grammar) {
        throw new GrammarParseError(
          'Failed to parse grammar: no Grammar object in parse result',
          normalizedPath
        );
      }
      
      // Handle imports if requested
      if (options?.resolveImports) {
        await this.resolveImports(document);
      }
      
      // Cache result (default to true unless explicitly disabled)
      if (useCache) {
        await this.cache.set(normalizedPath, grammar);
      }
      
      this.logger.info('Grammar parsed successfully', {
        path: normalizedPath,
        rules: grammar.rules.length,
        interfaces: grammar.interfaces?.length || 0,
        types: grammar.types?.length || 0
      });
      
      return grammar;

    } catch (error) {
      this.logger.error('Grammar parsing failed', error instanceof Error ? error : new Error(String(error)), {
        path: normalizedPath
      });
      
      if (error instanceof GrammarParseError) {
        throw error;
      }
      
      throw new GrammarParseError(
        `Failed to parse grammar: ${(error as Error).message}`,
        normalizedPath,
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Parses grammar content from a string
   */
  async parseContent(content: string, uri?: string, options?: ParseOptions): Promise<Grammar> {
    const documentUri = uri || 'memory://inline-grammar.langium';
    
    // Check for empty content
    if (!content || content.trim().length === 0) {
      throw new GrammarParseError(
        'Cannot parse empty grammar content',
        documentUri
      );
    }
    
    this.logger.debug(`Parsing grammar content`, { uri: documentUri });
    
    // Parse content into document
    const document = await this.parseContentToDocument(content, documentUri);
    
    // Validate if requested (default true)
    if (options?.validateReferences !== false) {
      await this.validateDocument(document);
    }
    
    // Extract Grammar from parsed document
    const grammar = document.parseResult.value as Grammar;
    
    if (!grammar) {
      throw new GrammarParseError(
        'Failed to parse grammar: no Grammar object in parse result',
        documentUri
      );
    }
    
    this.logger.info('Grammar content parsed successfully', {
      uri: documentUri,
      rules: grammar.rules?.length || 0,
      interfaces: grammar.interfaces?.length || 0,
      types: grammar.types?.length || 0
    });
    
    return grammar;
  }

  /**
   * Gets the Langium document for a parsed grammar
   */
  async getDocument(grammarPath: string): Promise<LangiumDocument> {
    const normalizedPath = path.resolve(grammarPath);
    
    // Check document cache
    const cached = this.documentCache.get(normalizedPath);
    if (cached) {
      return cached;
    }
    
    // Parse if not cached
    await this.parse(grammarPath);
    
    const document = this.documentCache.get(normalizedPath);
    if (!document) {
      throw new GrammarParseError(
        'Failed to get document after parsing',
        normalizedPath
      );
    }
    
    return document;
  }

  /**
   * Private helper methods
   */
  private async readGrammarFile(filePath: string): Promise<string> {
    try {
      const exists = await this.fileSystem.exists(filePath);
      if (!exists) {
        throw new Error(`Grammar file not found: ${filePath}`);
      }
      
      const isFile = await this.fileSystem.isFile(filePath);
      if (!isFile) {
        throw new Error(`Not a file: ${filePath}`);
      }
      
      return await this.fileSystem.readFile(filePath);
    } catch (error) {
      throw new GrammarParseError(
        `Failed to read grammar file: ${(error as Error).message}`,
        filePath
      );
    }
  }

  private async parseContentToDocument(content: string, filePath: string): Promise<LangiumDocument> {
    const uri = URI.file(filePath);
    const document = this.services.shared.workspace.LangiumDocumentFactory.fromString(
      content,
      uri
    );
    
    // Parse the document using Langium's parser
    this.services.shared.workspace.DocumentBuilder.build([document], {
      validation: false // We'll validate separately
    });
    
    if (document.parseResult.lexerErrors.length > 0) {
      const error = document.parseResult.lexerErrors[0];
      throw new GrammarParseError(
        `Lexer error: ${error.message}`,
        filePath,
        {
          file: filePath,
          startLine: error.line || 1,
          startColumn: error.column || 1,
          endLine: error.line || 1,
          endColumn: (error.column || 1) + (error.length || 1)
        }
      );
    }
    
    if (document.parseResult.parserErrors.length > 0) {
      const error = document.parseResult.parserErrors[0];
      throw new GrammarParseError(
        `Parser error: ${error.message}`,
        filePath,
        {
          file: filePath,
          startLine: error.token.startLine || 1,
          startColumn: error.token.startColumn || 1,
          endLine: error.token.endLine || 1,
          endColumn: error.token.endColumn || 1
        }
      );
    }
    
    return document;
  }

  private async validateDocument(document: LangiumDocument): Promise<void> {
    // Validate using Langium's document validator
    const validator = this.services.validation.DocumentValidator;
    await validator.validateDocument(document);
    
    const diagnostics = document.diagnostics ?? [];
    const errors = diagnostics.filter(d => d.severity === 1); // Error severity
    
    if (errors.length > 0) {
      const error = errors[0];
      throw new GrammarParseError(
        `Validation error: ${error.message}`,
        document.uri.fsPath,
        {
          file: document.uri.fsPath,
          startLine: (error.range.start.line || 0) + 1,
          startColumn: (error.range.start.character || 0) + 1,
          endLine: (error.range.end.line || 0) + 1,
          endColumn: (error.range.end.character || 0) + 1
        }
      );
    }
  }

  private async resolveImports(document: LangiumDocument): Promise<void> {
    // Langium handles imports automatically through its workspace management
    // The DocumentBuilder already resolves imports when building the document
    const grammar = document.parseResult.value as Grammar;
    
    if (grammar.imports && grammar.imports.length > 0) {
      this.logger.debug(`Grammar has ${grammar.imports.length} imports`, {
        imports: grammar.imports.map(imp => imp.path)
      });
      
      // Langium's DocumentBuilder handles import resolution
      // We just need to ensure the workspace is properly configured
      await this.services.shared.workspace.DocumentBuilder.build([document], {
        validation: true
      });
    }
  }
}