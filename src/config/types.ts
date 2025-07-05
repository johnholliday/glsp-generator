export interface ExtensionMetadata {
    name: string;
    displayName: string;
    version: string;
    publisher: string;
    description: string;
    license: string;
    repository?: string;
    author?: string;
    keywords?: string[];
    fileExtension?: string;
}

export interface DependencyConfig {
    '@eclipse-glsp/server': string;
    '@eclipse-glsp/client': string;
    '@eclipse-glsp/theia-integration': string;
    '@theia/core': string;
    customDeps: Record<string, string>;
}

export interface DiagramFeatures {
    compartments: boolean;
    ports: boolean;
    routing: 'manhattan' | 'polyline' | 'bezier';
    grid: boolean;
    snapToGrid: boolean;
    autoLayout: boolean;
    animation: boolean;
}

export interface DiagramConfig {
    type: 'node-edge' | 'compartment' | 'port' | 'hierarchical';
    features: DiagramFeatures;
}

export interface ColorConfig {
    node: string;
    edge: string;
    selected: string;
    hover: string;
    error: string;
}

export interface FontConfig {
    default: string;
    monospace: string;
}

export interface NodeDefaults {
    width: number;
    height: number;
    cornerRadius: number;
}

export interface StylingConfig {
    theme: 'light' | 'dark' | 'auto';
    defaultColors: ColorConfig;
    fonts: FontConfig;
    nodeDefaults: NodeDefaults;
}

export interface GenerationConfig {
    outputStructure: 'standard' | 'flat' | 'custom';
    includeExamples: boolean;
    generateTests: boolean;
    generateDocs: boolean;
    templateOverrides: Record<string, string>;
}

export interface GLSPConfig {
    $schema?: string;
    extension: ExtensionMetadata;
    dependencies: DependencyConfig;
    diagram: DiagramConfig;
    styling: StylingConfig;
    generation: GenerationConfig;
    linter?: LinterConfig;
}

export interface LinterConfig {
    rules: {
        [ruleName: string]: string | 'off' | [string, any];
    };
    ignore?: string[];
}

export interface ConfigOverrides {
    [key: string]: any;
}