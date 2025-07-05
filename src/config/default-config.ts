import { GLSPConfig } from './types.js';

export const DEFAULT_CONFIG: GLSPConfig = {
    extension: {
        name: 'my-glsp-extension',
        displayName: 'My GLSP Extension',
        version: '1.0.0',
        publisher: 'my-company',
        description: 'A GLSP-based visual modeling tool',
        license: 'MIT',
        fileExtension: 'sm'
    },
    dependencies: {
        '@eclipse-glsp/server': '^2.0.0',
        '@eclipse-glsp/client': '^2.0.0',
        '@eclipse-glsp/theia-integration': '^2.0.0',
        '@theia/core': '^1.35.0',
        customDeps: {}
    },
    diagram: {
        type: 'node-edge',
        features: {
            compartments: false,
            ports: false,
            routing: 'polyline',
            grid: true,
            snapToGrid: true,
            autoLayout: false,
            animation: true
        }
    },
    styling: {
        theme: 'light',
        defaultColors: {
            node: '#4A90E2',
            edge: '#333333',
            selected: '#FF6B6B',
            hover: '#FFA500',
            error: '#DC143C'
        },
        fonts: {
            default: 'Arial, sans-serif',
            monospace: 'Consolas, Monaco, monospace'
        },
        nodeDefaults: {
            width: 100,
            height: 60,
            cornerRadius: 5
        }
    },
    generation: {
        outputStructure: 'standard',
        includeExamples: true,
        generateTests: true,
        generateDocs: true,
        templateOverrides: {}
    },
    linter: {
        rules: {
            'naming-conventions': 'error',
            'no-duplicate-properties': 'error',
            'no-circular-refs': 'warning',
            'no-undefined-types': 'error'
        }
    }
};