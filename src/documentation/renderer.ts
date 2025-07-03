import * as path from 'path';
import { injectable, inject } from 'inversify';
import {
    DocumentationData,
    ClassDoc,
    InterfaceDoc,
    MethodDoc,
    PropertyDoc,
    ComponentDoc,
    ExampleData
} from './collector.js';
import { IDocumentationRenderer, IDocumentationConfig, IFileSystemService, TYPES } from './interfaces.js';

@injectable()
export class DocumentationRenderer implements IDocumentationRenderer {
    private templatesDir: string;

    constructor(
        @inject(TYPES.IDocumentationConfig) private readonly config: IDocumentationConfig,
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService
    ) {
        this.templatesDir = this.config.templatesDir || path.join(__dirname, 'templates');
    }

    async renderOverview(data: DocumentationData): Promise<string> {
        const template = await this.loadTemplate('overview.md');
        return this.render(template, {
            projectName: data.overview.projectName,
            description: data.overview.description,
            version: data.overview.version,
            features: data.overview.features.map(f => `- ${f}`).join('\n')
        });
    }

    async renderAPI(data: DocumentationData): Promise<string> {
        let content = '# API Documentation\n\n';

        // Classes
        if (data.api.classes.length > 0) {
            content += '## Classes\n\n';
            for (const classDoc of data.api.classes) {
                content += this.renderClass(classDoc);
            }
        }

        // Interfaces
        if (data.api.interfaces.length > 0) {
            content += '## Interfaces\n\n';
            for (const interfaceDoc of data.api.interfaces) {
                content += this.renderInterface(interfaceDoc);
            }
        }

        // Types
        if (data.api.types.length > 0) {
            content += '## Types\n\n';
            for (const typeDoc of data.api.types) {
                content += this.renderType(typeDoc);
            }
        }

        return content;
    }

    async renderArchitecture(data: DocumentationData): Promise<string> {
        const template = await this.loadTemplate('architecture.md');

        const componentsSection = data.architecture.components
            .map(c => this.renderComponent(c))
            .join('\n\n');

        const dataFlowSection = data.architecture.dataFlow
            .map(df => this.renderDataFlow(df))
            .join('\n\n');

        return this.render(template, {
            components: componentsSection,
            dataFlow: dataFlowSection
        });
    }

    async renderExamples(data: DocumentationData): Promise<string> {
        const template = await this.loadTemplate('examples.md');

        const examplesSection = data.examples
            .map(ex => this.renderExample(ex))
            .join('\n\n');

        return this.render(template, {
            examples: examplesSection
        });
    }

    private renderClass(classDoc: ClassDoc): string {
        let content = `### ${classDoc.name}\n\n`;
        content += `${classDoc.description}\n\n`;

        if (classDoc.properties.length > 0) {
            content += '#### Properties\n\n';
            content += this.renderProperties(classDoc.properties);
        }

        if (classDoc.methods.length > 0) {
            content += '#### Methods\n\n';
            for (const method of classDoc.methods) {
                content += this.renderMethod(method);
            }
        }

        return content;
    }

    private renderInterface(interfaceDoc: InterfaceDoc): string {
        let content = `### ${interfaceDoc.name}\n\n`;
        content += `${interfaceDoc.description}\n\n`;

        if (interfaceDoc.properties.length > 0) {
            content += '#### Properties\n\n';
            content += this.renderProperties(interfaceDoc.properties);
        }

        return content;
    }

    private renderType(typeDoc: any): string {
        let content = `### ${typeDoc.name}\n\n`;
        content += `${typeDoc.description}\n\n`;
        content += '```typescript\n';
        content += `type ${typeDoc.name} = ${typeDoc.definition};\n`;
        content += '```\n\n';
        return content;
    }

    private renderMethod(method: MethodDoc): string {
        let content = `##### ${method.name}\n\n`;
        content += `${method.description}\n\n`;

        content += '```typescript\n';
        content += `${method.name}(`;
        content += method.parameters
            .map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
            .join(', ');
        content += `): ${method.returnType}\n`;
        content += '```\n\n';

        if (method.parameters.length > 0) {
            content += '**Parameters:**\n\n';
            for (const param of method.parameters) {
                content += `- \`${param.name}\` (${param.type})${param.optional ? ' _optional_' : ''}: ${param.description}\n`;
            }
            content += '\n';
        }

        return content;
    }

    private renderProperties(properties: PropertyDoc[]): string {
        let content = '| Property | Type | Description |\n';
        content += '|----------|------|-------------|\n';

        for (const prop of properties) {
            content += `| ${prop.name}${prop.optional ? '?' : ''} | \`${prop.type}\` | ${prop.description} |\n`;
        }

        content += '\n';
        return content;
    }

    private renderComponent(component: ComponentDoc): string {
        let content = `### ${component.name}\n\n`;
        content += `${component.description}\n\n`;

        content += '**Responsibilities:**\n';
        content += component.responsibilities.map(r => `- ${r}`).join('\n');
        content += '\n\n';

        if (component.dependencies.length > 0) {
            content += '**Dependencies:**\n';
            content += component.dependencies.map(d => `- ${d}`).join('\n');
            content += '\n';
        }

        return content;
    }

    private renderDataFlow(dataFlow: any): string {
        let content = `### ${dataFlow.name}\n\n`;
        content += `${dataFlow.description}\n\n`;

        content += '**Steps:**\n';
        dataFlow.steps.forEach((step: string, index: number) => {
            content += `${index + 1}. ${step}\n`;
        });

        return content;
    }

    private renderExample(example: ExampleData): string {
        let content = `### ${example.name}\n\n`;
        content += `${example.description}\n\n`;
        content += `\`\`\`${example.language}\n`;
        content += example.code;
        content += '\n```\n';
        return content;
    }

    private async loadTemplate(filename: string): Promise<string> {
        const templatePath = path.join(this.templatesDir, filename);
        try {
            const exists = await this.fileSystem.exists(templatePath);
            if (exists) {
                return await this.fileSystem.readFile(templatePath);
            }
            return this.getDefaultTemplate(filename);
        } catch (error) {
            // Return a default template if file doesn't exist
            return this.getDefaultTemplate(filename);
        }
    }

    private getDefaultTemplate(filename: string): string {
        switch (filename) {
            case 'overview.md':
                return `# {{projectName}}

{{description}}

Version: {{version}}

## Features

{{features}}

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Running the Server

\`\`\`bash
npm start
\`\`\`

## Documentation

- [API Documentation](./api.md)
- [Architecture](./architecture.md)
- [Examples](./examples.md)
`;

            case 'architecture.md':
                return `# Architecture

## Components

{{components}}

## Data Flow

{{dataFlow}}
`;

            case 'examples.md':
                return `# Examples

This document provides practical examples of using the GLSP server.

{{examples}}
`;

            default:
                return '';
        }
    }

    private render(template: string, data: Record<string, string>): string {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
}