export interface DocumentationData {
    overview: OverviewData;
    api: APIData;
    architecture: ArchitectureData;
    examples: ExampleData[];
}

export interface OverviewData {
    projectName: string;
    description: string;
    version: string;
    features: string[];
}

export interface APIData {
    classes: ClassDoc[];
    interfaces: InterfaceDoc[];
    types: TypeDoc[];
}

export interface ClassDoc {
    name: string;
    description: string;
    methods: MethodDoc[];
    properties: PropertyDoc[];
}

export interface InterfaceDoc {
    name: string;
    description: string;
    properties: PropertyDoc[];
}

export interface TypeDoc {
    name: string;
    description: string;
    definition: string;
}

export interface MethodDoc {
    name: string;
    description: string;
    parameters: ParameterDoc[];
    returnType: string;
}

export interface PropertyDoc {
    name: string;
    type: string;
    description: string;
    optional: boolean;
}

export interface ParameterDoc {
    name: string;
    type: string;
    description: string;
    optional: boolean;
}

export interface ArchitectureData {
    components: ComponentDoc[];
    dataFlow: DataFlowDoc[];
}

export interface ComponentDoc {
    name: string;
    description: string;
    responsibilities: string[];
    dependencies: string[];
}

export interface DataFlowDoc {
    name: string;
    description: string;
    steps: string[];
}

export interface ExampleData {
    name: string;
    description: string;
    code: string;
    language: string;
}

import { injectable, inject } from 'inversify';
import { IDocumentationCollector, IDocumentationConfig, TYPES } from './interfaces.js';

@injectable()
export class DocumentationCollector implements IDocumentationCollector {
    constructor(
        @inject(TYPES.IDocumentationConfig) private readonly config: IDocumentationConfig
    ) { }

    async collect(): Promise<DocumentationData> {
        return {
            overview: this.collectOverview(),
            api: await this.collectAPI(),
            architecture: this.collectArchitecture(),
            examples: await this.collectExamples()
        };
    }

    private collectOverview(): OverviewData {
        return {
            projectName: this.config.projectName || 'GLSP Server',
            description: this.config.description || 'Generated GLSP server for graphical modeling',
            version: this.config.version || '1.0.0',
            features: [
                'Node and edge creation',
                'Model validation',
                'Layout support',
                'Action handlers',
                'Operation handlers',
                'Custom tools'
            ]
        };
    }

    private async collectAPI(): Promise<APIData> {
        // This would analyze the generated TypeScript files
        // For now, returning placeholder data
        return {
            classes: [],
            interfaces: [],
            types: []
        };
    }

    private collectArchitecture(): ArchitectureData {
        return {
            components: [
                {
                    name: 'GLSP Server',
                    description: 'Main server component handling client connections',
                    responsibilities: [
                        'WebSocket communication',
                        'Request routing',
                        'Session management'
                    ],
                    dependencies: ['@eclipse-glsp/server']
                },
                {
                    name: 'Model Source',
                    description: 'Handles model persistence and loading',
                    responsibilities: [
                        'Load models from storage',
                        'Save model changes',
                        'Model serialization'
                    ],
                    dependencies: []
                },
                {
                    name: 'Action Handlers',
                    description: 'Process client actions',
                    responsibilities: [
                        'Handle user interactions',
                        'Update model state',
                        'Trigger model updates'
                    ],
                    dependencies: ['Model Source']
                }
            ],
            dataFlow: [
                {
                    name: 'Model Loading',
                    description: 'Process of loading a model from storage',
                    steps: [
                        'Client requests model',
                        'Server loads model from storage',
                        'Model is converted to GModel',
                        'GModel sent to client'
                    ]
                },
                {
                    name: 'Model Update',
                    description: 'Process of updating the model',
                    steps: [
                        'Client sends action',
                        'Action handler processes request',
                        'Model is updated',
                        'Changes are persisted',
                        'Update notification sent to client'
                    ]
                }
            ]
        };
    }

    private async collectExamples(): Promise<ExampleData[]> {
        // Would collect from examples directory
        return [
            {
                name: 'Creating a Node',
                description: 'Example of creating a new node in the diagram',
                code: `// Client-side code
const action = {
    kind: 'createNode',
    elementTypeId: 'node:task',
    location: { x: 100, y: 100 }
};
actionDispatcher.dispatch(action);`,
                language: 'typescript'
            },
            {
                name: 'Connecting Nodes',
                description: 'Example of creating an edge between two nodes',
                code: `// Client-side code
const action = {
    kind: 'createEdge',
    elementTypeId: 'edge:transition',
    sourceElementId: 'node1',
    targetElementId: 'node2'
};
actionDispatcher.dispatch(action);`,
                language: 'typescript'
            }
        ];
    }
}