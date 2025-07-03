import { injectable } from 'inversify';
import { LangiumGrammarParser as LangiumParser } from './langium-grammar-parser.js';
import { ParsedGrammar } from '../types/grammar.js';
import { IGrammarParser } from '../types/parser-interface.js';

/**
 * Facade for the Langium parser
 */
@injectable()
export class LangiumGrammarParser implements IGrammarParser {
    private grammarParser: LangiumParser;

    constructor() {
        this.grammarParser = new LangiumParser();
    }

    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        return this.grammarParser.parseGrammarFile(grammarPath);
    }

    async parseGrammar(grammarContent: string): Promise<any> {
        return this.grammarParser.parseGrammar(grammarContent);
    }

    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        return this.grammarParser.validateGrammarFile(grammarPath);
    }
}