import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';

export interface ReadmeData {
    extensionName: string;
    displayName: string;
    description: string;
    languageId: string;
    interfaces: InterfaceDoc[];
    types: TypeDoc[];
    installationInstructions: string;
    quickStartExample: string;
    features: string[];
}

export interface InterfaceDoc {
    name: string;
    description: string;
    properties: PropertyDoc[];
    extends?: string[];
}

export interface PropertyDoc {
    name: string;
    type: string;
    optional: boolean;
    array: boolean;
    description: string;
}

export interface TypeDoc {
    name: string;
    description: string;
    definition: string;
    values?: string[];
}

export class ReadmeGenerator {
    private template!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplate();
        this.registerHelpers();
        // Disable HTML escaping for markdown
        Handlebars.registerHelper('raw', function(this: any, options: any) {
            return options.fn(this);
        });
    }

    private loadTemplate(): void {
        const templateContent = `# {{displayName}}

{{description}}

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Language Overview](#language-overview)
{{#if interfaces}}
  - [Interfaces](#interfaces)
{{/if}}
{{#if types}}
  - [Types](#types)
{{/if}}
- [Examples](#examples)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

{{installationInstructions}}

## Getting Started

### Quick Example

\`\`\`{{languageId}}
{{quickStartExample}}
\`\`\`

### Features

{{#each features}}
- {{this}}
{{/each}}

## Language Overview

This language supports modeling {{toLowerCase extensionName}} with a rich set of interfaces and types.

{{#if interfaces}}
## Interfaces

{{#each interfaces}}
### {{name}}

{{#if description}}{{description}}{{else}}The \`{{name}}\` interface represents a {{toLowerCase name}} in the model.{{/if}}

{{#if extends}}
**Extends:** {{#each extends}}\`{{this}}\`{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

**Properties:**

{{#each properties}}
- \`{{name}}\`: {{type}}{{#if array}}[]{{/if}}{{#if optional}} (optional){{/if}} - {{#if description}}{{description}}{{else}}The {{toLowerCase name}} property{{/if}}
{{/each}}

**Example:**

\`\`\`{{../languageId}}
{{generateExample name properties}}
\`\`\`

{{/each}}
{{/if}}

{{#if types}}
## Types

{{#each types}}
### {{name}}

{{#if description}}{{description}}{{else}}The \`{{name}}\` type defines {{toLowerCase name}} values.{{/if}}

**Definition:** \`{{definition}}\`

{{#if values}}
**Possible values:**
{{#each values}}
- \`{{this}}\`
{{/each}}
{{/if}}

{{/each}}
{{/if}}

## Examples

### Basic Model

\`\`\`{{languageId}}
{{generateBasicExample interfaces types}}
\`\`\`

### Complex Model

\`\`\`{{languageId}}
{{generateComplexExample interfaces types}}
\`\`\`

For more examples, see the [examples directory](./docs/examples/).

## API Documentation

Full API documentation is available in the [docs/api](./docs/api/) directory.

### Key APIs

- [Model Interfaces](./docs/api/interfaces.md)
- [Type Definitions](./docs/api/types.md)
- [Server API](./docs/api/server.md)
- [Client API](./docs/api/client.md)

## Grammar Visualization

View the interactive grammar railroad diagrams at [docs/grammar/railroad.html](./docs/grammar/railroad.html).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
`;
        this.template = Handlebars.compile(templateContent, { noEscape: true });
    }

    private registerHelpers(): void {
        Handlebars.registerHelper('toLowerCase', (str: string) => str?.toLowerCase() || '');
        
        Handlebars.registerHelper('generateExample', (interfaceName: string, properties: PropertyDoc[]) => {
            const lines: string[] = [`${interfaceName} {`];
            properties.forEach(prop => {
                const value = this.getExampleValue(prop.type, prop.array);
                if (!prop.optional || Math.random() > 0.5) {
                    lines.push(`    ${prop.name}: ${value}`);
                }
            });
            lines.push('}');
            return lines.join('\n');
        });

        Handlebars.registerHelper('generateBasicExample', (interfaces: InterfaceDoc[], types: TypeDoc[]) => {
            if (!interfaces || interfaces.length === 0) return '// No interfaces defined';
            
            const nodeInterface = interfaces.find(i => i.name.toLowerCase().includes('node')) || interfaces[0];
            const lines: string[] = [];
            
            lines.push(`// Basic ${nodeInterface.name} example`);
            lines.push(`${nodeInterface.name} myElement {`);
            nodeInterface.properties.slice(0, 3).forEach(prop => {
                if (!prop.optional) {
                    const value = this.getExampleValue(prop.type, prop.array);
                    lines.push(`    ${prop.name}: ${value}`);
                }
            });
            lines.push('}');
            
            return lines.join('\n');
        });

        Handlebars.registerHelper('generateComplexExample', (interfaces: InterfaceDoc[], types: TypeDoc[]) => {
            if (!interfaces || interfaces.length === 0) return '// No interfaces defined';
            
            const lines: string[] = [];
            lines.push('// Complex model with multiple elements');
            
            // Add examples for up to 3 interfaces
            interfaces.slice(0, 3).forEach((iface, index) => {
                if (index > 0) lines.push('');
                lines.push(`${iface.name} element${index + 1} {`);
                iface.properties.forEach(prop => {
                    const value = this.getExampleValue(prop.type, prop.array);
                    lines.push(`    ${prop.name}: ${value}`);
                });
                lines.push('}');
            });
            
            return lines.join('\n');
        });
    }

    private getExampleValue(type: string, isArray: boolean): string {
        const baseValue = (() => {
            switch (type.toLowerCase()) {
                case 'string':
                    return '"example"';
                case 'number':
                    return '42';
                case 'boolean':
                    return 'true';
                case 'date':
                    return '"2024-01-01"';
                default:
                    // For custom types, check if it's a reference
                    if (type[0] === type[0].toUpperCase()) {
                        return '@element1';
                    }
                    return `"${type}-value"`;
            }
        })();

        return isArray ? `[${baseValue}, ${baseValue}]` : baseValue;
    }

    async generate(grammar: ParsedGrammar, config: GLSPConfig, outputDir: string): Promise<void> {
        const data = this.prepareData(grammar, config);
        const readmeContent = this.template(data);
        
        const readmePath = path.join(outputDir, 'README.md');
        await fs.writeFile(readmePath, readmeContent);
    }

    private prepareData(grammar: ParsedGrammar, config: GLSPConfig): ReadmeData {
        // Use grammar-based name unless explicitly overridden in config
        const isDefaultConfig = config.extension.name === 'my-glsp-extension';
        const extensionName = isDefaultConfig 
            ? `${grammar.projectName}-glsp-extension`
            : config.extension.name;
        const displayName = isDefaultConfig || !config.extension.displayName
            ? `${grammar.projectName} Extension`
            : config.extension.displayName;
        
        return {
            extensionName,
            displayName,
            description: config.extension.description === 'A GLSP-based visual modeling tool'
                ? `GLSP extension for ${grammar.projectName} models`
                : config.extension.description,
            languageId: grammar.projectName.toLowerCase(),
            interfaces: this.prepareInterfaces(grammar),
            types: this.prepareTypes(grammar),
            installationInstructions: this.generateInstallationInstructions(extensionName),
            quickStartExample: this.generateQuickStartExample(grammar),
            features: this.generateFeatures(grammar)
        };
    }

    private prepareInterfaces(grammar: ParsedGrammar): InterfaceDoc[] {
        return grammar.interfaces.map(iface => ({
            name: iface.name,
            description: this.generateInterfaceDescription(iface.name),
            properties: iface.properties.map(prop => ({
                name: prop.name,
                type: prop.type,
                optional: prop.optional,
                array: prop.array,
                description: this.generatePropertyDescription(prop.name, prop.type)
            })),
            extends: iface.superTypes
        }));
    }

    private prepareTypes(grammar: ParsedGrammar): TypeDoc[] {
        return grammar.types.map(type => ({
            name: type.name,
            description: this.generateTypeDescription(type.name),
            definition: type.definition,
            values: type.unionTypes
        }));
    }

    private generateInterfaceDescription(name: string): string {
        // Generate contextual descriptions based on common patterns
        const lowerName = name.toLowerCase();
        if (lowerName.includes('node')) {
            return `Represents a node element in the ${name} model with position and properties.`;
        } else if (lowerName.includes('edge') || lowerName.includes('connection')) {
            return `Represents a connection between elements in the model.`;
        } else if (lowerName.includes('container')) {
            return `A container element that can hold other model elements.`;
        }
        return `Defines the structure and properties of a ${name} element.`;
    }

    private generatePropertyDescription(name: string, type: string): string {
        const lowerName = name.toLowerCase();
        if (lowerName === 'id') {
            return 'Unique identifier for the element';
        } else if (lowerName === 'name') {
            return 'Human-readable name of the element';
        } else if (lowerName.includes('position') || lowerName === 'x' || lowerName === 'y') {
            return 'Position coordinates in the diagram';
        } else if (lowerName.includes('size') || lowerName === 'width' || lowerName === 'height') {
            return 'Dimensions of the element';
        } else if (lowerName === 'source' || lowerName === 'target') {
            return `Reference to the ${lowerName} element of the connection`;
        }
        return `The ${name} property of type ${type}`;
    }

    private generateTypeDescription(name: string): string {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('type') || lowerName.includes('kind')) {
            return `Enumeration of possible ${name} values in the model.`;
        } else if (lowerName.includes('status') || lowerName.includes('state')) {
            return `Defines the possible states for ${name}.`;
        }
        return `Type definition for ${name} values.`;
    }

    private generateInstallationInstructions(extensionName: string): string {
        return `### Using npm

\`\`\`bash
npm install ${extensionName}
\`\`\`

### Using yarn

\`\`\`bash
yarn add ${extensionName}
\`\`\`

### Development Setup

1. Clone the repository
2. Install dependencies: \`yarn install\`
3. Build the extension: \`yarn build\`
4. Run tests: \`yarn test\``;
    }

    private generateQuickStartExample(grammar: ParsedGrammar): string {
        if (grammar.interfaces.length === 0) {
            return '// Define your model here';
        }

        const firstInterface = grammar.interfaces[0];
        const lines: string[] = [];
        
        lines.push(`// Create a simple ${firstInterface.name}`);
        lines.push(`${firstInterface.name} myFirst${firstInterface.name} {`);
        
        // Add required properties
        firstInterface.properties
            .filter(p => !p.optional)
            .slice(0, 3)
            .forEach(prop => {
                const value = this.getExampleValue(prop.type, prop.array);
                lines.push(`    ${prop.name}: ${value}`);
            });
        
        lines.push('}');
        return lines.join('\n');
    }

    private generateFeatures(grammar: ParsedGrammar): string[] {
        const features: string[] = [
            '✨ Full GLSP diagram editor support',
            '🔧 Type-safe model definition',
            '📝 Intelligent code completion',
            '✅ Real-time validation',
            '🎨 Customizable diagram rendering'
        ];

        if (grammar.interfaces.length > 5) {
            features.push(`📊 Rich model with ${grammar.interfaces.length} interfaces`);
        }

        if (grammar.types.length > 0) {
            features.push(`🏷️ ${grammar.types.length} custom type definitions`);
        }

        return features;
    }
}