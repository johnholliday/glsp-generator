import {
    Grammar,
    EmptyFileSystem,
    URI
} from 'langium';
import { createLangiumGrammarServices, LangiumGrammarServices } from 'langium/grammar';
import path from 'path';
import { ParsedGrammar, GrammarInterface, GrammarProperty, GrammarType } from '../types/grammar.js';
import {
    IGrammarParserService,
    IFileSystemService,
    ILoggerService,
    ICacheService,
    IMetricsService
} from '../config/di/interfaces.js';
import { injectable, inject, postConstruct, preDestroy } from 'inversify';
import { TYPES } from '../config/di/types.inversify.js';
import { LogMethod } from './decorators/log-method.js';

/**
 * Langium parser that uses the official Langium grammar parser with dependency injection
 */
@injectable()
export class LangiumGrammarParser implements IGrammarParserService {
    private services!: LangiumGrammarServices;
    private initialized = false;

    constructor(
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMetricsService) private readonly metrics: IMetricsService
    ) {
        this.logger.debug('LangiumGrammarParser constructor called');
    }

    @postConstruct()
    private _initialize(): void {
        this.logger.info('Initializing Langium grammar services');
        this.services = createLangiumGrammarServices(EmptyFileSystem).grammar;
        this.initialized = true;
        this.logger.debug('Langium grammar services initialized successfully');
    }

    @preDestroy()
    private _cleanup(): void {
        this.logger.info('Cleaning up LangiumGrammarParser resources');
        this.initialized = false;
    }

    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('grammar.parse.attempts', { type: 'file' });

        try {
            // Check cache first
            const cacheKey = `grammar:${grammarPath}:${await this.getFileHash(grammarPath)}`;
            const cached = await this.cache.get<ParsedGrammar>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached grammar parse result', { grammarPath });
                this.metrics.incrementCounter('grammar.parse.cache_hits');
                return cached;
            }

            this.logger.info('Parsing grammar file', { grammarPath });

            const grammarContent = await this.fileSystem.readFile(grammarPath, 'utf-8');
            const projectName = this.sanitizeProjectName(path.basename(grammarPath, path.extname(grammarPath)));

            // Parse the grammar using Langium's parser
            const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
                grammarContent,
                URI.file(path.resolve(grammarPath))
            );

            await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

            if (document.diagnostics && document.diagnostics.filter(d => d.severity === 1).length > 0) {
                const errors = document.diagnostics.filter(d => d.severity === 1);
                const errorMessage = `Failed to parse grammar: ${errors.map(e => e.message).join(', ')}`;
                this.logger.error('Grammar parsing failed', new Error(errorMessage), { grammarPath, errors });
                this.metrics.incrementCounter('grammar.parse.errors');
                throw new Error(errorMessage);
            }

            const grammar = document.parseResult?.value;
            if (!grammar) {
                const error = new Error('Failed to parse grammar: no parse result');
                this.logger.error('No parse result from grammar', error, { grammarPath });
                this.metrics.incrementCounter('grammar.parse.errors');
                throw error;
            }

            // Extract interfaces and types from the parsed AST
            const interfaces: GrammarInterface[] = [];
            const types: GrammarType[] = [];

            // Extract from parser rules that define types
            if (grammar.rules) {
                for (const rule of grammar.rules) {
                    if (rule.$type === 'ParserRule' && !rule.fragment) {
                        // Parser rules create types implicitly
                        const properties = this.extractPropertiesFromRule(rule);
                        if (properties.length > 0) {
                            interfaces.push({
                                name: rule.name,
                                properties,
                                superTypes: []
                            });
                        }
                    }
                }
            }

            // Also check for explicit interface declarations
            if (grammar.interfaces) {
                for (const iface of grammar.interfaces) {
                    interfaces.push(this.extractInterface(iface as any));
                }
            }

            // Extract explicit type declarations
            if (grammar.types) {
                for (const type of grammar.types) {
                    types.push(this.extractType(type as any));
                }
            }

            const result: ParsedGrammar = {
                interfaces,
                types,
                projectName
            };

            // Cache the result
            await this.cache.set(cacheKey, result, 3600000); // 1 hour TTL

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.parse.file', duration);
            this.metrics.incrementCounter('grammar.parse.success', { type: 'file' });

            this.logger.info('Grammar file parsed successfully', {
                grammarPath,
                interfaceCount: interfaces.length,
                typeCount: types.length,
                duration: Math.round(duration)
            });

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.parse.file.error', duration);
            this.metrics.incrementCounter('grammar.parse.errors', { type: 'file' });
            throw error;
        }
    }

    @LogMethod({ logArgs: false, logResult: false, logDuration: true })
    async parseGrammar(grammarContent: string): Promise<any> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('grammar.parse.attempts', { type: 'content' });

        try {
            // Check cache first
            const cacheKey = `grammar:content:${this.hashString(grammarContent)}`;
            const cached = await this.cache.get<any>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached grammar parse result for content');
                this.metrics.incrementCounter('grammar.parse.cache_hits');
                return cached;
            }

            this.logger.debug('Parsing grammar content');

            const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
                grammarContent,
                URI.parse('memory://inline.langium')
            );

            await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

            if (document.diagnostics && document.diagnostics.filter(d => d.severity === 1).length > 0) {
                const errors = document.diagnostics.filter(d => d.severity === 1);
                const errorMessage = `Failed to parse grammar: ${errors.map(e => e.message).join(', ')}`;
                this.logger.error('Grammar content parsing failed', new Error(errorMessage), { errors });
                this.metrics.incrementCounter('grammar.parse.errors');
                throw new Error(errorMessage);
            }

            const grammar = document.parseResult?.value;
            if (!grammar) {
                const error = new Error('Failed to parse grammar: no parse result');
                this.logger.error('No parse result from grammar content', error);
                this.metrics.incrementCounter('grammar.parse.errors');
                throw error;
            }

            // Convert to AST format expected by validation rules
            const rules: any[] = [];

            // Add interfaces to rules
            if (grammar.interfaces) {
                for (const iface of grammar.interfaces) {
                    const interfaceRule = iface as any;
                    const features = (interfaceRule.attributes || []).map((attr: any) => ({
                        name: attr.name,
                        type: this.extractAttributeType(attr),
                        optional: attr.optional || false,
                        array: this.isArrayType(attr)
                    }));

                    rules.push({
                        $type: 'Interface',
                        name: interfaceRule.name,
                        superTypes: (interfaceRule.superTypes || []).map((ref: any) => ref.$refText || ''),
                        features
                    });
                }
            }

            // Add types to rules
            if (grammar.types) {
                for (const type of grammar.types) {
                    const typeRule = type as any;
                    rules.push({
                        $type: 'Type',
                        name: typeRule.name,
                        type: this.extractTypeDefinition(typeRule.type)
                    });
                }
            }

            const result = {
                $type: 'Grammar',
                rules
            };

            // Cache the result
            await this.cache.set(cacheKey, result, 1800000); // 30 minutes TTL

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.parse.content', duration);
            this.metrics.incrementCounter('grammar.parse.success', { type: 'content' });

            this.logger.debug('Grammar content parsed successfully', {
                ruleCount: rules.length,
                duration: Math.round(duration)
            });

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.parse.content.error', duration);
            this.metrics.incrementCounter('grammar.parse.errors', { type: 'content' });
            throw error;
        }
    }

    @LogMethod({ logArgs: true, logResult: true, logDuration: true })
    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('grammar.validate.attempts');

        try {
            this.logger.debug('Validating grammar file', { grammarPath });

            if (!await this.fileSystem.pathExists(grammarPath)) {
                this.logger.warn('Grammar file does not exist', { grammarPath });
                this.metrics.incrementCounter('grammar.validate.file_not_found');
                return false;
            }

            const grammarContent = await this.fileSystem.readFile(grammarPath, 'utf-8');
            const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
                grammarContent,
                URI.file(path.resolve(grammarPath))
            );

            await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

            // Check for parsing errors (severity 1 = Error)
            const isValid = !document.diagnostics || document.diagnostics.filter(d => d.severity === 1).length === 0;

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.validate', duration);

            if (isValid) {
                this.metrics.incrementCounter('grammar.validate.success');
                this.logger.debug('Grammar file validation successful', { grammarPath, duration: Math.round(duration) });
            } else {
                this.metrics.incrementCounter('grammar.validate.failed');
                const errors = document.diagnostics?.filter(d => d.severity === 1) || [];
                this.logger.warn('Grammar file validation failed', {
                    grammarPath,
                    errorCount: errors.length,
                    duration: Math.round(duration)
                });
            }

            return isValid;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('grammar.validate.error', duration);
            this.metrics.incrementCounter('grammar.validate.errors');
            this.logger.error('Grammar validation error', error as Error, { grammarPath });
            return false;
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('LangiumGrammarParser not initialized. Call initialize() first.');
        }
    }

    private async getFileHash(filePath: string): Promise<string> {
        try {
            const stats = await import('fs').then(fs => fs.promises.stat(filePath));
            return `${stats.mtime.getTime()}-${stats.size}`;
        } catch {
            return Date.now().toString();
        }
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    private extractInterface(interfaceRule: any): GrammarInterface {
        const properties: GrammarProperty[] = [];

        if (interfaceRule.attributes) {
            for (const attr of interfaceRule.attributes) {
                properties.push({
                    name: attr.name,
                    type: this.extractAttributeType(attr),
                    optional: attr.optional || false,
                    array: this.isArrayType(attr)
                });
            }
        }

        return {
            name: interfaceRule.name,
            properties,
            superTypes: (interfaceRule.superTypes || []).map((ref: any) => ref.$refText || '')
        };
    }

    private extractType(typeRule: any): GrammarType {
        const definition = this.getTypeDefinitionString(typeRule.type);
        const unionTypes = this.extractUnionTypes(typeRule.type);

        return {
            name: typeRule.name,
            definition,
            unionTypes: unionTypes.length > 1 ? unionTypes : undefined
        };
    }

    private extractAttributeType(attr: any): string {
        if (!attr.type) return 'unknown';

        // Handle reference types (@Type)
        if (attr.type.$type === 'ReferenceType' && attr.type.referenceType) {
            const refText = attr.type.referenceType.$refText || '';
            return refText.startsWith('@') ? refText.substring(1) : refText;
        }

        // Handle simple types (string, number, boolean)
        if (attr.type.$type === 'SimpleType' && attr.type.primitiveType) {
            return attr.type.primitiveType;
        }

        // Handle array types
        if (attr.type.$type === 'ArrayType' && attr.type.elementType) {
            return this.extractTypeFromTypeAttribute(attr.type.elementType);
        }

        // Handle union types
        if (attr.type.$type === 'UnionType') {
            return this.getTypeDefinitionString(attr.type);
        }

        return this.extractTypeFromTypeAttribute(attr.type);
    }

    private extractTypeFromTypeAttribute(type: any): string {
        if (!type) return 'unknown';

        if (type.$type === 'ReferenceType' && type.referenceType) {
            const refText = type.referenceType.$refText || '';
            return refText.startsWith('@') ? refText.substring(1) : refText;
        }

        if (type.$type === 'SimpleType' && type.primitiveType) {
            return type.primitiveType;
        }

        if (type.primitiveType) {
            return type.primitiveType;
        }

        if (type.$refText) {
            return type.$refText;
        }

        return 'unknown';
    }

    private isArrayType(attr: any): boolean {
        return attr.type && attr.type.$type === 'ArrayType';
    }

    private getTypeDefinitionString(type: any): string {
        if (!type) return 'unknown';

        if (type.$type === 'UnionType' && type.types) {
            return type.types.map((t: any) => this.getTypeDefinitionString(t)).join(' | ');
        }

        if (type.$type === 'SimpleType') {
            if (type.primitiveType) {
                return type.primitiveType;
            }
            if (type.stringType) {
                return `'${type.stringType}'`;
            }
        }

        if (type.$type === 'ReferenceType' && type.referenceType) {
            return type.referenceType.$refText || 'unknown';
        }

        if (type.$type === 'ArrayType' && type.elementType) {
            return `${this.getTypeDefinitionString(type.elementType)}[]`;
        }

        // Handle direct string literals in union types
        if (type.value && typeof type.value === 'string') {
            return `'${type.value}'`;
        }

        return 'unknown';
    }

    private extractUnionTypes(type: any): string[] {
        if (!type || type.$type !== 'UnionType' || !type.types) {
            return [];
        }

        const types: string[] = [];

        for (const t of type.types) {
            if (t.$type === 'SimpleType' && t.stringType) {
                types.push(t.stringType);
            } else if (t.value && typeof t.value === 'string') {
                types.push(t.value);
            }
        }

        return types;
    }

    private extractTypeDefinition(type: any): any {
        if (type && type.$type === 'UnionType' && type.types) {
            const elements: string[] = [];

            for (const t of type.types) {
                if (t.$type === 'SimpleType' && t.stringType) {
                    elements.push(t.stringType);
                } else if (t.value && typeof t.value === 'string') {
                    elements.push(t.value);
                }
            }

            return { elements };
        }

        return { elements: [] };
    }

    private extractPropertiesFromRule(rule: any): GrammarProperty[] {
        const properties: GrammarProperty[] = [];

        if (!rule.definition) return properties;

        // Walk through the rule definition to find assignments
        this.walkDefinition(rule.definition, (node: any) => {
            if (node.$type === 'Assignment') {
                const property: GrammarProperty = {
                    name: node.feature,
                    type: this.inferTypeFromAssignment(node),
                    optional: node.operator === '?=' || node.cardinality === '?',
                    array: node.operator === '+=' || node.cardinality === '+' || node.cardinality === '*'
                };

                // Avoid duplicates
                if (!properties.find(p => p.name === property.name)) {
                    properties.push(property);
                }
            }
        });

        return properties;
    }

    private walkDefinition(node: any, callback: (node: any) => void): void {
        if (!node) return;

        callback(node);

        // Recursively walk through the AST
        if (node.elements) {
            for (const element of node.elements) {
                this.walkDefinition(element, callback);
            }
        }

        if (node.alternatives) {
            for (const alt of node.alternatives) {
                this.walkDefinition(alt, callback);
            }
        }

        if (node.element) {
            this.walkDefinition(node.element, callback);
        }

        if (node.terminal) {
            this.walkDefinition(node.terminal, callback);
        }
    }

    private inferTypeFromAssignment(assignment: any): string {
        if (!assignment.terminal) return 'string';

        const terminal = assignment.terminal;

        // Check for cross-references
        if (terminal.$type === 'CrossReference') {
            const typeName = terminal.type?.ref?.$refText || terminal.type?.$refText || 'unknown';
            return typeName;
        }

        // Check for rule calls
        if (terminal.$type === 'RuleCall' && terminal.rule?.ref) {
            const ruleName = terminal.rule.ref.$refText || terminal.rule.ref.name;

            // Check if it's a terminal rule that maps to a type
            switch (ruleName) {
                case 'ID':
                case 'STRING':
                    return 'string';
                case 'NUMBER':
                case 'INT':
                    return 'number';
                case 'BOOLEAN':
                    return 'boolean';
                default:
                    return ruleName;
            }
        }

        // Check for keywords (string literals)
        if (terminal.$type === 'Keyword') {
            return 'string';
        }

        return 'string';
    }

    private sanitizeProjectName(name: string): string {
        return name.toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }
}