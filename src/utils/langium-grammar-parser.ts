import {
    Grammar,
    EmptyFileSystem,
    URI
} from 'langium';
import { createLangiumGrammarServices, LangiumGrammarServices } from 'langium/grammar';
import fs from 'fs-extra';
import { ParsedGrammar, GrammarInterface, GrammarProperty, GrammarType } from '../types/grammar.js';
import { LangiumMetadataParser } from '../metadata/parser.js';
import path from 'path';

/**
 * Langium parser that uses the official Langium grammar parser
 */
export class LangiumGrammarParser {
    private services: LangiumGrammarServices;
    private metadataParser: LangiumMetadataParser;

    constructor() {
        // Create Langium grammar services
        this.services = createLangiumGrammarServices(EmptyFileSystem).grammar;
        this.metadataParser = new LangiumMetadataParser();
    }

    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        const grammarContent = await fs.readFile(grammarPath, 'utf-8');
        const projectName = this.sanitizeProjectName(path.basename(grammarPath, path.extname(grammarPath)));

        // Parse the grammar using Langium's parser
        const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
            grammarContent,
            URI.file(path.resolve(grammarPath))
        );

        await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

        if (document.diagnostics && document.diagnostics.filter(d => d.severity === 1).length > 0) {
            const errors = document.diagnostics.filter(d => d.severity === 1);
            throw new Error(`Failed to parse grammar: ${errors.map(e => e.message).join(', ')}`);
        }

        const grammar = document.parseResult?.value;
        if (!grammar) {
            throw new Error('Failed to parse grammar: no parse result');
        }

        // Extract metadata from the grammar
        const metadata = this.metadataParser.extractMetadata(grammar);

        // Extract interfaces and types from the parsed AST
        const interfaces: GrammarInterface[] = [];
        const types: GrammarType[] = [];

        // Extract from parser rules that define types
        if (grammar.rules) {
            for (const rule of grammar.rules) {
                if (rule.$type === 'ParserRule' && !rule.fragment) {
                    // Parser rules create types implicitly
                    const properties = this.extractPropertiesFromRule(rule);
                    const elementMetadata = metadata.elements.get(rule.name);
                    
                    // Create interface even if no properties, if metadata exists
                    if (properties.length > 0 || elementMetadata) {
                        interfaces.push({
                            name: rule.name,
                            properties,
                            superTypes: [],
                            metadata: elementMetadata
                        });
                    }
                }
            }
        }

        // Also check for explicit interface declarations
        if (grammar.interfaces) {
            for (const iface of grammar.interfaces) {
                const interfaceObj = this.extractInterface(iface as any);
                const elementMetadata = metadata.elements.get(interfaceObj.name);
                interfaces.push({
                    ...interfaceObj,
                    metadata: elementMetadata
                });
            }
        }

        // Extract explicit type declarations
        if (grammar.types) {
            for (const type of grammar.types) {
                const typeObj = this.extractType(type as any);
                const elementMetadata = metadata.elements.get(typeObj.name);
                types.push({
                    ...typeObj,
                    metadata: elementMetadata
                });
            }
        }

        return {
            interfaces,
            types,
            projectName,
            metadata,
            grammarAST: grammar
        };
    }

    async parseGrammar(grammarContent: string): Promise<any> {
        const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
            grammarContent,
            URI.parse('memory://inline.langium')
        );

        await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

        if (document.diagnostics && document.diagnostics.filter(d => d.severity === 1).length > 0) {
            const errors = document.diagnostics.filter(d => d.severity === 1);
            throw new Error(`Failed to parse grammar: ${errors.map(e => e.message).join(', ')}`);
        }

        const grammar = document.parseResult?.value;
        if (!grammar) {
            throw new Error('Failed to parse grammar: no parse result');
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

        return {
            $type: 'Grammar',
            rules
        };
    }

    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        try {
            if (!await fs.pathExists(grammarPath)) {
                return false;
            }

            const grammarContent = await fs.readFile(grammarPath, 'utf-8');
            const document = this.services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(
                grammarContent,
                URI.file(path.resolve(grammarPath))
            );

            await this.services.shared.workspace.DocumentBuilder.build([document], { validation: true });

            // Check for parsing errors (severity 1 = Error)
            return !document.diagnostics || document.diagnostics.filter(d => d.severity === 1).length === 0;
        } catch (error) {
            return false;
        }
    }

    private extractInterface(interfaceRule: any): GrammarInterface {
        const properties: GrammarProperty[] = [];

        if (interfaceRule.attributes) {
            for (const attr of interfaceRule.attributes) {
                properties.push({
                    name: attr.name,
                    type: this.extractAttributeType(attr),
                    optional: attr.optional || false,
                    array: this.isArrayType(attr),
                    reference: this.isReferenceType(attr) || false
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

    private isReferenceType(attr: any): boolean {
        if (!attr.type) return false;
        
        // Direct reference type
        if (attr.type.$type === 'ReferenceType') return true;
        
        // Reference inside array type
        if (attr.type.$type === 'ArrayType' && attr.type.elementType) {
            return attr.type.elementType.$type === 'ReferenceType';
        }
        
        return false;
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
                const isReference = this.isReferenceAssignment(node);
                const property: GrammarProperty = {
                    name: node.feature,
                    type: this.inferTypeFromAssignment(node),
                    optional: node.operator === '?=' || node.cardinality === '?',
                    array: node.operator === '+=' || node.cardinality === '+' || node.cardinality === '*',
                    reference: isReference || false
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

    private isReferenceAssignment(assignment: any): boolean {
        return assignment.terminal && assignment.terminal.$type === 'CrossReference';
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