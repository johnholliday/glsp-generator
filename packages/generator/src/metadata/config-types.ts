/**
 * Metadata configuration types for GLSP elements
 */

export interface ElementMetadata {
    glspType?: string;
    icon?: string;
    label?: string;
    description?: string;
    category?: string;
    abstract?: boolean;
    resizable?: boolean;
    deletable?: boolean;
    moveable?: boolean;
    layoutOptions?: {
        algorithm?: string;
        [key: string]: any;
    };
    customProperties?: Record<string, any>;
}

export interface GLSPMetadataConfig {
    defaultNodeType?: string;
    defaultEdgeType?: string;
    categories?: string[];
    layoutAlgorithm?: string;
    description?: string;
    version?: string;
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
    };
}

export interface GrammarMetadata {
    name: string;
    version: string;
    description: string;
    elements: Map<string, ElementMetadata>;
}