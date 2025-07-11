import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, ParsedInterface, ParsedType } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';

export interface APIDocumentation {
    interfaces: InterfaceAPIDoc[];
    types: TypeAPIDoc[];
    serverAPI: ServerAPIDoc;
    clientAPI: ClientAPIDoc;
}

export interface InterfaceAPIDoc {
    name: string;
    description: string;
    extends?: string[];
    properties: PropertyAPIDoc[];
    methods?: MethodAPIDoc[];
    examples: CodeExample[];
}

export interface PropertyAPIDoc {
    name: string;
    type: string;
    optional: boolean;
    array: boolean;
    description: string;
    jsdoc?: string;
}

export interface MethodAPIDoc {
    name: string;
    description: string;
    parameters: ParameterDoc[];
    returnType: string;
    examples: CodeExample[];
}

export interface ParameterDoc {
    name: string;
    type: string;
    description: string;
    optional?: boolean;
}

export interface TypeAPIDoc {
    name: string;
    description: string;
    definition: string;
    values?: string[];
    usage: CodeExample[];
}

export interface ServerAPIDoc {
    handlers: HandlerDoc[];
    commands: CommandDoc[];
    validators: ValidatorDoc[];
}

export interface ClientAPIDoc {
    commands: CommandDoc[];
    views: ViewDoc[];
    actions: ActionDoc[];
}

export interface HandlerDoc {
    name: string;
    description: string;
    handles: string;
    methods: MethodAPIDoc[];
}

export interface CommandDoc {
    id: string;
    label: string;
    description: string;
    keybinding?: string;
}

export interface ValidatorDoc {
    name: string;
    validates: string;
    rules: string[];
}

export interface ViewDoc {
    id: string;
    name: string;
    description: string;
}

export interface ActionDoc {
    kind: string;
    description: string;
}

export interface CodeExample {
    title: string;
    code: string;
    language: string;
}

export class APIDocumentationGenerator {
    async generate(grammar: ParsedGrammar, config: GLSPConfig, outputDir: string): Promise<void> {
        const apiDir = path.join(outputDir, 'docs', 'api');
        await fs.ensureDir(apiDir);

        // Generate API documentation
        const apiDocs = this.collectAPIDocs(grammar, config);

        // Generate index page
        await this.generateIndexPage(apiDocs, apiDir);

        // Generate interfaces documentation
        await this.generateInterfacesDoc(apiDocs.interfaces, apiDir);

        // Generate types documentation
        await this.generateTypesDoc(apiDocs.types, apiDir);

        // Generate server API documentation
        await this.generateServerAPIDoc(apiDocs.serverAPI, apiDir);

        // Generate client API documentation
        await this.generateClientAPIDoc(apiDocs.clientAPI, apiDir);
    }

    private collectAPIDocs(grammar: ParsedGrammar, config: GLSPConfig): APIDocumentation {
        return {
            interfaces: this.collectInterfaceDocs(grammar.interfaces),
            types: this.collectTypeDocs(grammar.types),
            serverAPI: this.collectServerAPIDocs(grammar, config),
            clientAPI: this.collectClientAPIDocs(grammar, config)
        };
    }

    private collectInterfaceDocs(interfaces: ParsedInterface[]): InterfaceAPIDoc[] {
        return interfaces.map(iface => ({
            name: iface.name,
            description: this.generateInterfaceDescription(iface),
            extends: iface.superTypes,
            properties: iface.properties.map(prop => ({
                name: prop.name,
                type: prop.type,
                optional: prop.optional,
                array: prop.array,
                description: this.generatePropertyDescription(prop),
                jsdoc: this.generatePropertyJSDoc(prop)
            })),
            methods: this.generateInterfaceMethods(iface),
            examples: this.generateInterfaceExamples(iface)
        }));
    }

    private collectTypeDocs(types: ParsedType[]): TypeAPIDoc[] {
        return types.map(type => ({
            name: type.name,
            description: this.generateTypeDescription(type),
            definition: type.definition,
            values: type.unionTypes,
            usage: this.generateTypeUsageExamples(type)
        }));
    }

    private collectServerAPIDocs(_grammar: ParsedGrammar, _config: GLSPConfig): ServerAPIDoc {
        return {
            handlers: this.generateHandlerDocs(_grammar),
            commands: this.generateServerCommandDocs(_grammar),
            validators: this.generateValidatorDocs(_grammar)
        };
    }

    private collectClientAPIDocs(_grammar: ParsedGrammar, _config: GLSPConfig): ClientAPIDoc {
        return {
            commands: this.generateClientCommandDocs(_grammar),
            views: this.generateViewDocs(_grammar),
            actions: this.generateActionDocs(_grammar)
        };
    }

    private async generateIndexPage(apiDocs: APIDocumentation, apiDir: string): Promise<void> {
        const content = `# API Documentation

## Overview

This document provides comprehensive API documentation for the GLSP extension.

## Table of Contents

- [Interfaces](./interfaces.md) - Model interface definitions
- [Types](./types.md) - Type definitions and enumerations
- [Server API](./server.md) - Server-side handlers and commands
- [Client API](./client.md) - Client-side commands and views

## Quick Links

### Core Interfaces
${apiDocs.interfaces.slice(0, 5).map(i => `- [${i.name}](./interfaces.md#${i.name.toLowerCase()}) - ${i.description}`).join('\n')}

### Key Types
${apiDocs.types.slice(0, 5).map(t => `- [${t.name}](./types.md#${t.name.toLowerCase()}) - ${t.description}`).join('\n')}

## Getting Started

To use these APIs in your project:

\`\`\`typescript
import { ${apiDocs.interfaces.slice(0, 3).map(i => i.name).join(', ')} } from 'extension-name';

// Create a new model element
const element: ${apiDocs.interfaces[0]?.name || 'Element'} = {
    // ... properties
};
\`\`\`

## API Conventions

- All model interfaces extend from base interfaces
- Properties marked as optional can be undefined
- Array properties default to empty arrays
- References use the \`@id\` notation
`;

        await fs.writeFile(path.join(apiDir, 'index.md'), content);
    }

    private async generateInterfacesDoc(interfaces: InterfaceAPIDoc[], apiDir: string): Promise<void> {
        const content = `# Interface Documentation

${interfaces.map(iface => this.generateInterfaceSection(iface)).join('\n\n---\n\n')}
`;

        await fs.writeFile(path.join(apiDir, 'interfaces.md'), content);
    }

    private generateInterfaceSection(iface: InterfaceAPIDoc): string {
        return `## ${iface.name}

${iface.description}

${iface.extends ? `**Extends:** ${iface.extends.map(e => `\`${e}\``).join(', ')}\n` : ''}

### Properties

${iface.properties.map(prop => `#### ${prop.name}

- **Type:** \`${prop.type}${prop.array ? '[]' : ''}\`
- **Required:** ${!prop.optional}
- **Description:** ${prop.description}

${prop.jsdoc ? `\`\`\`typescript\n${prop.jsdoc}\n\`\`\`\n` : ''}
`).join('\n')}

${iface.methods && iface.methods.length > 0 ? `### Methods

${iface.methods.map(method => this.generateMethodDoc(method)).join('\n\n')}` : ''}

### Examples

${iface.examples.map(ex => `**${ex.title}**

\`\`\`${ex.language}
${ex.code}
\`\`\`
`).join('\n')}`;
    }

    private generateMethodDoc(method: MethodAPIDoc): string {
        return `#### ${method.name}

${method.description}

**Parameters:**
${method.parameters.map(p => `- \`${p.name}\`: ${p.type} - ${p.description}`).join('\n')}

**Returns:** \`${method.returnType}\`

${method.examples.map(ex => `\`\`\`${ex.language}\n${ex.code}\n\`\`\``).join('\n\n')}`;
    }

    private async generateTypesDoc(types: TypeAPIDoc[], apiDir: string): Promise<void> {
        const content = `# Type Documentation

${types.map(type => this.generateTypeSection(type)).join('\n\n---\n\n')}
`;

        await fs.writeFile(path.join(apiDir, 'types.md'), content);
    }

    private generateTypeSection(type: TypeAPIDoc): string {
        return `## ${type.name}

${type.description}

**Definition:** \`${type.definition}\`

${type.values ? `### Possible Values

${type.values.map(v => `- \`${v}\``).join('\n')}` : ''}

### Usage Examples

${type.usage.map(ex => `**${ex.title}**

\`\`\`${ex.language}
${ex.code}
\`\`\`
`).join('\n')}`;
    }

    private async generateServerAPIDoc(serverAPI: ServerAPIDoc, apiDir: string): Promise<void> {
        const content = `# Server API Documentation

## Handlers

${serverAPI.handlers.map(handler => `### ${handler.name}

${handler.description}

**Handles:** \`${handler.handles}\`

${handler.methods.map(m => this.generateMethodDoc(m)).join('\n\n')}
`).join('\n\n')}

## Commands

${serverAPI.commands.map(cmd => `### ${cmd.id}

- **Label:** ${cmd.label}
- **Description:** ${cmd.description}
${cmd.keybinding ? `- **Keybinding:** ${cmd.keybinding}` : ''}
`).join('\n\n')}

## Validators

${serverAPI.validators.map(val => `### ${val.name}

**Validates:** ${val.validates}

**Rules:**
${val.rules.map(r => `- ${r}`).join('\n')}
`).join('\n\n')}
`;

        await fs.writeFile(path.join(apiDir, 'server.md'), content);
    }

    private async generateClientAPIDoc(clientAPI: ClientAPIDoc, apiDir: string): Promise<void> {
        const content = `# Client API Documentation

## Commands

${clientAPI.commands.map(cmd => `### ${cmd.id}

- **Label:** ${cmd.label}
- **Description:** ${cmd.description}
${cmd.keybinding ? `- **Keybinding:** ${cmd.keybinding}` : ''}
`).join('\n\n')}

## Views

${clientAPI.views.map(view => `### ${view.id}

- **Name:** ${view.name}
- **Description:** ${view.description}
`).join('\n\n')}

## Actions

${clientAPI.actions.map(action => `### ${action.kind}

${action.description}
`).join('\n\n')}
`;

        await fs.writeFile(path.join(apiDir, 'client.md'), content);
    }

    // Helper methods
    private generateInterfaceDescription(iface: ParsedInterface): string {
        const name = iface.name.toLowerCase();
        if (name.includes('node')) return `Represents a node in the diagram with properties and connections.`;
        if (name.includes('edge')) return `Represents an edge connecting two nodes in the diagram.`;
        if (name.includes('container')) return `A container that can hold other elements.`;
        return `Model interface for ${iface.name} elements.`;
    }

    private generatePropertyDescription(prop: any): string {
        const name = prop.name.toLowerCase();
        if (name === 'id') return 'Unique identifier for the element';
        if (name === 'name') return 'Display name of the element';
        if (name.includes('position')) return 'Position coordinates in the diagram';
        if (name.includes('size')) return 'Dimensions of the element';
        return `Property ${prop.name} of type ${prop.type}`;
    }

    private generatePropertyJSDoc(prop: any): string {
        return `/**
 * ${this.generatePropertyDescription(prop)}
 * @type {${prop.type}${prop.array ? '[]' : ''}}
 * ${prop.optional ? '@optional' : '@required'}
 */
${prop.name}${prop.optional ? '?' : ''}: ${prop.type}${prop.array ? '[]' : ''};`;
    }

    private generateInterfaceMethods(iface: ParsedInterface): MethodAPIDoc[] {
        // Generate common methods based on interface type
        const methods: MethodAPIDoc[] = [];

        if (iface.name.toLowerCase().includes('node')) {
            methods.push({
                name: 'getConnectedEdges',
                description: 'Returns all edges connected to this node',
                parameters: [],
                returnType: 'Edge[]',
                examples: [{
                    title: 'Get connected edges',
                    code: 'const edges = node.getConnectedEdges();',
                    language: 'typescript'
                }]
            });
        }

        return methods;
    }

    private generateInterfaceExamples(iface: ParsedInterface): CodeExample[] {
        const examples: CodeExample[] = [];

        // Creation example
        examples.push({
            title: `Creating a ${iface.name}`,
            code: `const ${iface.name.toLowerCase()}: ${iface.name} = {
${iface.properties.filter(p => !p.optional).map(p =>
                `    ${p.name}: ${this.getExampleValue(p.type, p.array)}`
            ).join(',\n')}
};`,
            language: 'typescript'
        });

        // Validation example
        examples.push({
            title: `Validating a ${iface.name}`,
            code: `function validate${iface.name}(obj: ${iface.name}): boolean {
    return ${iface.properties.filter(p => !p.optional).map(p =>
                `obj.${p.name} !== undefined`
            ).join(' && ')};
}`,
            language: 'typescript'
        });

        return examples;
    }

    private generateTypeDescription(type: ParsedType): string {
        const name = type.name.toLowerCase();
        if (name.includes('type') || name.includes('kind')) return `Enumeration of ${type.name} values`;
        if (name.includes('status')) return `Status values for elements`;
        return `Type definition for ${type.name}`;
    }

    private generateTypeUsageExamples(type: ParsedType): CodeExample[] {
        return [{
            title: 'Using the type',
            code: `const value: ${type.name} = ${type.unionTypes?.[0] ? `'${type.unionTypes[0]}'` : 'undefined'};

// Type guard
function is${type.name}(value: string): value is ${type.name} {
    return [${type.unionTypes?.map(v => `'${v}'`).join(', ') || ''}].includes(value);
}`,
            language: 'typescript'
        }];
    }

    private generateHandlerDocs(grammar: ParsedGrammar): HandlerDoc[] {
        return grammar.interfaces.filter(i => i.name.toLowerCase().includes('node')).map(iface => ({
            name: `Create${iface.name}Handler`,
            description: `Handler for creating ${iface.name} elements`,
            handles: `create${iface.name}`,
            methods: [{
                name: 'execute',
                description: `Creates a new ${iface.name} element`,
                parameters: [{
                    name: 'action',
                    type: `Create${iface.name}Action`,
                    description: 'The creation action'
                }],
                returnType: 'void',
                examples: []
            }]
        }));
    }

    private generateServerCommandDocs(_grammar: ParsedGrammar): CommandDoc[] {
        return [{
            id: 'server.validate',
            label: 'Validate Model',
            description: 'Validates the current model'
        }];
    }

    private generateValidatorDocs(_grammar: ParsedGrammar): ValidatorDoc[] {
        return [{
            name: 'ModelValidator',
            validates: 'All model elements',
            rules: [
                'All elements must have unique IDs',
                'References must point to existing elements',
                'Required properties must be defined'
            ]
        }];
    }

    private generateClientCommandDocs(grammar: ParsedGrammar): CommandDoc[] {
        return grammar.interfaces.slice(0, 3).map(iface => ({
            id: `create.${iface.name.toLowerCase()}`,
            label: `Create ${iface.name}`,
            description: `Creates a new ${iface.name} element`,
            keybinding: `Ctrl+Shift+${iface.name[0]}`
        }));
    }

    private generateViewDocs(_grammar: ParsedGrammar): ViewDoc[] {
        return [{
            id: 'modelExplorer',
            name: 'Model Explorer',
            description: 'Tree view of all model elements'
        }, {
            id: 'propertyView',
            name: 'Properties',
            description: 'Properties panel for selected elements'
        }];
    }

    private generateActionDocs(_grammar: ParsedGrammar): ActionDoc[] {
        return [{
            kind: 'create',
            description: 'Actions for creating new elements'
        }, {
            kind: 'delete',
            description: 'Actions for deleting elements'
        }, {
            kind: 'update',
            description: 'Actions for updating element properties'
        }];
    }

    private getExampleValue(type: string, isArray: boolean): string {
        const base = type === 'string' ? '"value"' :
            type === 'number' ? '42' :
                type === 'boolean' ? 'true' :
                    `${type}Value`;
        return isArray ? `[${base}]` : base;
    }
}