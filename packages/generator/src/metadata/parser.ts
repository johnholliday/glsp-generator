import { Grammar } from 'langium';
import { GrammarMetadata, ElementMetadata } from '../types/grammar.js';

/**
 * Parser for extracting metadata from Langium grammar comments and attributes
 */
export class LangiumMetadataParser {
    /**
     * Extract metadata from a Langium grammar AST
     */
    extractMetadata(grammar: Grammar): GrammarMetadata {
        const metadata: GrammarMetadata = {
            name: grammar.name || 'Unknown',
            version: '1.0.0',
            description: '',
            elements: new Map<string, ElementMetadata>()
        };

        // Extract metadata from grammar-level comments
        if (grammar.$cstNode) {
            const leadingComments = this.extractLeadingComments(grammar.$cstNode);
            const grammarMeta = this.parseMetadataComments(leadingComments);
            if (grammarMeta.version) metadata.version = grammarMeta.version;
            if (grammarMeta.description) metadata.description = grammarMeta.description;
        }

        // Extract metadata from rules
        if (grammar.rules) {
            for (const rule of grammar.rules) {
                if (rule.$type === 'ParserRule' && rule.name && rule.$cstNode) {
                    const leadingComments = this.extractLeadingComments(rule.$cstNode);
                    const elementMeta = this.parseElementMetadata(leadingComments);
                    if (Object.keys(elementMeta).length > 0) {
                        metadata.elements.set(rule.name, elementMeta);
                    }
                }
            }
        }

        // Extract metadata from interfaces
        if (grammar.interfaces) {
            for (const iface of grammar.interfaces) {
                if (iface.name && iface.$cstNode) {
                    const leadingComments = this.extractLeadingComments(iface.$cstNode);
                    const elementMeta = this.parseElementMetadata(leadingComments);
                    if (Object.keys(elementMeta).length > 0) {
                        metadata.elements.set(iface.name, elementMeta);
                    }
                }
            }
        }

        // Extract metadata from types
        if (grammar.types) {
            for (const type of grammar.types) {
                if (type.name && type.$cstNode) {
                    const leadingComments = this.extractLeadingComments(type.$cstNode);
                    const elementMeta = this.parseElementMetadata(leadingComments);
                    if (Object.keys(elementMeta).length > 0) {
                        metadata.elements.set(type.name, elementMeta);
                    }
                }
            }
        }

        return metadata;
    }

    /**
     * Extract leading comments from a CST node
     */
    private extractLeadingComments(cstNode: any): string[] {
        const comments: string[] = [];
        
        // Look for hidden tokens (comments) before the node
        if (cstNode.hidden) {
            for (const hidden of cstNode.hidden) {
                if (hidden.text && (hidden.text.startsWith('//') || hidden.text.startsWith('/*'))) {
                    comments.push(hidden.text);
                }
            }
        }

        return comments;
    }

    /**
     * Parse metadata from comment strings
     */
    private parseMetadataComments(comments: string[]): Record<string, string> {
        const metadata: Record<string, string> = {};

        for (const comment of comments) {
            // Remove comment markers
            const text = comment
                .replace(/^\/\//gm, '')
                .replace(/^\/\*+/, '')
                .replace(/\*+\/$/, '')
                .replace(/^\s*\*\s?/gm, '')
                .trim();

            // Look for @metadata tags
            const metadataRegex = /@(\w+)\s+(.+)/g;
            let match;
            while ((match = metadataRegex.exec(text)) !== null) {
                metadata[match[1]] = match[2].trim();
            }

            // If no tags, use as description
            if (Object.keys(metadata).length === 0 && text) {
                metadata.description = text;
            }
        }

        return metadata;
    }

    /**
     * Parse element-specific metadata
     */
    private parseElementMetadata(comments: string[]): ElementMetadata {
        const metadata: ElementMetadata = {};
        const parsed = this.parseMetadataComments(comments);

        // Map common metadata fields
        if (parsed.glspType) metadata.glspType = parsed.glspType;
        if (parsed.icon) metadata.icon = parsed.icon;
        if (parsed.label) metadata.label = parsed.label;
        if (parsed.description) metadata.description = parsed.description;
        if (parsed.category) metadata.category = parsed.category;
        if (parsed.abstract === 'true') metadata.abstract = true;
        if (parsed.resizable === 'false') metadata.resizable = false;
        if (parsed.deletable === 'false') metadata.deletable = false;
        if (parsed.moveable === 'false') metadata.moveable = false;

        // Parse layout hints
        if (parsed.layout) {
            metadata.layoutOptions = {
                algorithm: parsed.layout
            };
        }

        // Store any additional custom metadata
        for (const [key, value] of Object.entries(parsed)) {
            if (!['glspType', 'icon', 'label', 'description', 'category', 
                  'abstract', 'resizable', 'deletable', 'moveable', 'layout'].includes(key)) {
                if (!metadata.customProperties) {
                    metadata.customProperties = {};
                }
                metadata.customProperties[key] = value;
            }
        }

        return metadata;
    }
}