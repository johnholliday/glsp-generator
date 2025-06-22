import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, ParsedInterface, ParsedType } from '../types/grammar.js';

export interface ExampleGeneratorOptions {
    complexity?: 'basic' | 'intermediate' | 'advanced';
    includeComments?: boolean;
    realWorldScenario?: boolean;
}

export class ExampleModelGenerator {
    async generate(grammar: ParsedGrammar, outputDir: string, options?: ExampleGeneratorOptions): Promise<void> {
        const examplesDir = path.join(outputDir, 'docs', 'examples');
        await fs.ensureDir(examplesDir);

        // Generate different complexity examples
        await this.generateBasicExample(grammar, examplesDir);
        await this.generateIntermediateExample(grammar, examplesDir);
        await this.generateAdvancedExample(grammar, examplesDir);
        await this.generateRealWorldExample(grammar, examplesDir);

        // Generate tutorial
        await this.generateTutorial(grammar, examplesDir);

        // Generate validation examples
        await this.generateValidationExamples(grammar, examplesDir);
    }

    private async generateBasicExample(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createBasicExample(grammar);
        await fs.writeFile(path.join(outputDir, 'basic.model'), content);
    }

    private createBasicExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            `// Basic ${grammar.projectName} Model Example`,
            '// This example demonstrates the fundamental elements and syntax',
            ''
        ];

        // Add simple examples for each interface
        grammar.interfaces.slice(0, 3).forEach((iface, index) => {
            if (index > 0) lines.push('');
            lines.push(`// Creating a simple ${iface.name}`);
            lines.push(`${iface.name} ${this.camelCase(iface.name)}${index + 1} {`);

            // Add required properties only
            iface.properties
                .filter(p => !p.optional)
                .forEach(prop => {
                    const value = this.generateSimpleValue(prop.type, prop.array, index);
                    lines.push(`    ${prop.name}: ${value}`);
                });

            lines.push('}');
        });

        // Add a simple type usage example
        if (grammar.types.length > 0) {
            lines.push('');
            lines.push('// Using custom types');
            const firstType = grammar.types[0];
            const iface = grammar.interfaces.find(i =>
                i.properties.some(p => p.type === firstType.name)
            );

            if (iface) {
                lines.push(`${iface.name} typedElement {`);
                iface.properties.forEach(prop => {
                    const value = prop.type === firstType.name && firstType.unionTypes?.[0]
                        ? `'${firstType.unionTypes[0]}'`
                        : this.generateSimpleValue(prop.type, prop.array, 0);
                    lines.push(`    ${prop.name}: ${value}`);
                });
                lines.push('}');
            }
        }

        return lines.join('\n');
    }

    private async generateIntermediateExample(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createIntermediateExample(grammar);
        await fs.writeFile(path.join(outputDir, 'intermediate.model'), content);
    }

    private createIntermediateExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            `// Intermediate ${grammar.projectName} Model Example`,
            '// This example shows relationships, arrays, and optional properties',
            ''
        ];

        // Create interconnected elements
        const nodeInterface = grammar.interfaces.find(i => i.name.toLowerCase().includes('node'))
            || grammar.interfaces[0];
        const edgeInterface = grammar.interfaces.find(i => i.name.toLowerCase().includes('edge'));

        // Create multiple nodes
        for (let i = 1; i <= 3; i++) {
            lines.push(`${nodeInterface.name} node${i} {`);
            nodeInterface.properties.forEach(prop => {
                const value = this.generateIntermediateValue(prop.type, prop.array, i, prop.optional);
                if (value !== null) {
                    lines.push(`    ${prop.name}: ${value}`);
                }
            });
            lines.push('}');
            lines.push('');
        }

        // Create edges if edge interface exists
        if (edgeInterface) {
            lines.push('// Connections between nodes');
            lines.push(`${edgeInterface.name} connection1 {`);
            edgeInterface.properties.forEach(prop => {
                let value: string;
                if (prop.name === 'source') value = '@node1';
                else if (prop.name === 'target') value = '@node2';
                else value = this.generateIntermediateValue(prop.type, prop.array, 1, prop.optional) || '""';

                if (!prop.optional || value !== null) {
                    lines.push(`    ${prop.name}: ${value}`);
                }
            });
            lines.push('}');
        }

        // Show array usage
        const arrayProp = grammar.interfaces
            .flatMap(i => i.properties)
            .find(p => p.array);

        if (arrayProp) {
            lines.push('');
            lines.push('// Example with array properties');
            const iface = grammar.interfaces.find(i =>
                i.properties.some(p => p.array)
            );
            if (iface) {
                lines.push(`${iface.name} arrayExample {`);
                iface.properties.forEach(prop => {
                    const value = prop.array
                        ? `[${this.generateSimpleValue(prop.type, false, 1)}, ${this.generateSimpleValue(prop.type, false, 2)}]`
                        : this.generateSimpleValue(prop.type, false, 1);
                    lines.push(`    ${prop.name}: ${value}`);
                });
                lines.push('}');
            }
        }

        return lines.join('\n');
    }

    private async generateAdvancedExample(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createAdvancedExample(grammar);
        await fs.writeFile(path.join(outputDir, 'advanced.model'), content);
    }

    private createAdvancedExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            `// Advanced ${grammar.projectName} Model Example`,
            '// This example demonstrates complex scenarios and all language features',
            '',
            '/*',
            ' * This model represents a complete system with:',
            ' * - Multiple interconnected elements',
            ' * - All property types (required, optional, arrays)',
            ' * - Cross-references between elements',
            ' * - Usage of all defined types',
            ' */',
            ''
        ];

        // Create a complex interconnected model
        const elements = new Map<string, string[]>();

        // Generate instances for all interfaces
        grammar.interfaces.forEach((iface, ifaceIndex) => {
            const instances = [];

            // Create 2-3 instances of each interface
            const instanceCount = iface.name.toLowerCase().includes('edge') ? 3 : 2;

            for (let i = 1; i <= instanceCount; i++) {
                const instanceName = `${this.camelCase(iface.name)}${i}`;
                instances.push(instanceName);

                lines.push(`// ${iface.name} instance ${i}/${instanceCount}`);
                lines.push(`${iface.name} ${instanceName} {`);

                // Add all properties
                iface.properties.forEach((prop, propIndex) => {
                    // Skip some optional properties randomly, but always include arrays for demonstration
                    if (prop.optional && !prop.array && Math.random() > 0.7) {
                        lines.push(`    // ${prop.name}: <omitted optional property>`);
                        return;
                    }

                    let value: string;

                    // Generate contextual values
                    if (prop.type === 'string') {
                        if (prop.name === 'id') {
                            value = `"${instanceName}_id"`;
                        } else if (prop.name === 'name') {
                            value = `"${iface.name} ${i}"`;
                        } else if (prop.name.includes('description')) {
                            value = `"Advanced example of ${iface.name} with full property configuration"`;
                        } else {
                            value = `"${prop.name}_value_${i}"`;
                        }
                    } else if (prop.type === 'number') {
                        if (prop.name === 'x' || prop.name === 'y') {
                            value = `${100 * i + propIndex * 50}`;
                        } else if (prop.name === 'width' || prop.name === 'height') {
                            value = `${100 + propIndex * 20}`;
                        } else {
                            value = `${42 + i * 10 + propIndex}`;
                        }
                    } else if (prop.type === 'boolean') {
                        value = i % 2 === 0 ? 'true' : 'false';
                    } else if (this.isCustomType(prop.type, grammar)) {
                        const type = grammar.types.find(t => t.name === prop.type);
                        if (type?.unionTypes && type.unionTypes.length > 0) {
                            value = `'${type.unionTypes[i % type.unionTypes.length]}'`;
                        } else {
                            value = `"${prop.type}_value"`;
                        }
                    } else {
                        // Reference to another element
                        const targetInterface = grammar.interfaces.find(ifc => ifc.name === prop.type);
                        if (targetInterface && elements.has(targetInterface.name)) {
                            const targets = elements.get(targetInterface.name)!;
                            value = `@${targets[Math.min(i - 1, targets.length - 1)]}`;
                        } else {
                            value = `@${this.camelCase(prop.type)}1`;
                        }
                    }

                    // Handle arrays
                    if (prop.array) {
                        const item1 = value;
                        const item2 = value.includes('@')
                            ? value.replace(/1/, '2')
                            : value.replace(/_\d+/, `_${i + 1}`);
                        value = `[${item1}, ${item2}]`;
                    }

                    lines.push(`    ${prop.name}: ${value}`);
                });

                lines.push('}');
                lines.push('');
            }

            elements.set(iface.name, instances);
        });

        // Add a section showing all types in use
        if (grammar.types.length > 0) {
            lines.push('// Demonstration of all type values');
            lines.push('');

            grammar.types.forEach(type => {
                if (type.unionTypes && type.unionTypes.length > 0) {
                    lines.push(`// All possible values for ${type.name}:`);
                    type.unionTypes.forEach(value => {
                        lines.push(`// - '${value}'`);
                    });
                    lines.push('');
                }
            });
        }

        return lines.join('\n');
    }

    private async generateRealWorldExample(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createRealWorldExample(grammar);
        await fs.writeFile(path.join(outputDir, 'real-world.model'), content);
    }

    private createRealWorldExample(grammar: ParsedGrammar): string {
        const projectName = grammar.projectName.toLowerCase();

        // Generate contextual real-world example based on project name
        if (projectName.includes('flow') || projectName.includes('process')) {
            return this.createWorkflowExample(grammar);
        } else if (projectName.includes('state') || projectName.includes('machine')) {
            return this.createStateMachineExample(grammar);
        } else if (projectName.includes('graph') || projectName.includes('network')) {
            return this.createNetworkExample(grammar);
        } else {
            return this.createGenericSystemExample(grammar);
        }
    }

    private createWorkflowExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            '// Real-World Example: Order Processing Workflow',
            '// This model represents a complete e-commerce order processing system',
            ''
        ];

        const nodeInterface = grammar.interfaces.find(i => i.name.toLowerCase().includes('node'))
            || grammar.interfaces[0];
        const edgeInterface = grammar.interfaces.find(i => i.name.toLowerCase().includes('edge'));

        // Create workflow nodes
        const workflowSteps = [
            { id: 'start', name: 'Order Received', x: 100, y: 100 },
            { id: 'validate', name: 'Validate Order', x: 300, y: 100 },
            { id: 'payment', name: 'Process Payment', x: 500, y: 100 },
            { id: 'inventory', name: 'Check Inventory', x: 300, y: 250 },
            { id: 'ship', name: 'Ship Order', x: 500, y: 250 },
            { id: 'complete', name: 'Order Complete', x: 700, y: 175 }
        ];

        workflowSteps.forEach(step => {
            lines.push(`${nodeInterface.name} ${step.id} {`);
            nodeInterface.properties.forEach(prop => {
                let value: string;
                if (prop.name === 'id') value = `"${step.id}"`;
                else if (prop.name === 'name') value = `"${step.name}"`;
                else if (prop.name === 'x') value = step.x.toString();
                else if (prop.name === 'y') value = step.y.toString();
                else value = this.generateContextualValue(prop, step.id);

                lines.push(`    ${prop.name}: ${value}`);
            });
            lines.push('}');
            lines.push('');
        });

        // Create workflow transitions
        if (edgeInterface) {
            const transitions = [
                { from: 'start', to: 'validate', label: 'Auto' },
                { from: 'validate', to: 'payment', label: 'Valid' },
                { from: 'validate', to: 'inventory', label: 'Invalid' },
                { from: 'payment', to: 'inventory', label: 'Paid' },
                { from: 'inventory', to: 'ship', label: 'In Stock' },
                { from: 'ship', to: 'complete', label: 'Shipped' }
            ];

            lines.push('// Workflow transitions');
            transitions.forEach((trans, index) => {
                lines.push(`${edgeInterface.name} transition${index + 1} {`);
                edgeInterface.properties.forEach(prop => {
                    let value: string;
                    if (prop.name === 'source') value = `@${trans.from}`;
                    else if (prop.name === 'target') value = `@${trans.to}`;
                    else if (prop.name === 'label' || prop.name === 'name') value = `"${trans.label}"`;
                    else value = this.generateContextualValue(prop, `transition${index + 1}`);

                    lines.push(`    ${prop.name}: ${value}`);
                });
                lines.push('}');
                lines.push('');
            });
        }

        return lines.join('\n');
    }

    private createStateMachineExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            '// Real-World Example: Traffic Light State Machine',
            '// This model represents a traffic light control system',
            ''
        ];

        const stateInterface = grammar.interfaces.find(i =>
            i.name.toLowerCase().includes('state') || i.name.toLowerCase().includes('node')
        ) || grammar.interfaces[0];

        // Create states
        const states = [
            { id: 'red', name: 'Red Light', duration: 60 },
            { id: 'yellow', name: 'Yellow Light', duration: 5 },
            { id: 'green', name: 'Green Light', duration: 45 },
            { id: 'flashing_yellow', name: 'Flashing Yellow', duration: 0 }
        ];

        states.forEach(state => {
            lines.push(`${stateInterface.name} ${state.id} {`);
            stateInterface.properties.forEach(prop => {
                let value: string;
                if (prop.name === 'id') value = `"${state.id}"`;
                else if (prop.name === 'name') value = `"${state.name}"`;
                else if (prop.name === 'duration' && prop.type === 'number') value = state.duration.toString();
                else value = this.generateContextualValue(prop, state.id);

                lines.push(`    ${prop.name}: ${value}`);
            });
            lines.push('}');
            lines.push('');
        });

        return lines.join('\n');
    }

    private createNetworkExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            '// Real-World Example: Company Network Topology',
            '// This model represents a corporate network infrastructure',
            ''
        ];

        const nodeInterface = grammar.interfaces.find(i => i.name.toLowerCase().includes('node'))
            || grammar.interfaces[0];

        // Create network nodes
        const devices = [
            { id: 'router_main', name: 'Main Router', type: 'router', ip: '192.168.1.1' },
            { id: 'switch_floor1', name: 'Floor 1 Switch', type: 'switch', ip: '192.168.1.10' },
            { id: 'switch_floor2', name: 'Floor 2 Switch', type: 'switch', ip: '192.168.1.20' },
            { id: 'server_web', name: 'Web Server', type: 'server', ip: '192.168.1.100' },
            { id: 'server_db', name: 'Database Server', type: 'server', ip: '192.168.1.101' }
        ];

        devices.forEach(device => {
            lines.push(`${nodeInterface.name} ${device.id} {`);
            nodeInterface.properties.forEach(prop => {
                let value: string;
                if (prop.name === 'id') value = `"${device.id}"`;
                else if (prop.name === 'name') value = `"${device.name}"`;
                else if (prop.name === 'type') value = `"${device.type}"`;
                else if (prop.name === 'ip' || prop.name === 'address') value = `"${device.ip}"`;
                else value = this.generateContextualValue(prop, device.id);

                lines.push(`    ${prop.name}: ${value}`);
            });
            lines.push('}');
            lines.push('');
        });

        return lines.join('\n');
    }

    private createGenericSystemExample(grammar: ParsedGrammar): string {
        const lines: string[] = [
            `// Real-World Example: Project Management System`,
            `// This model represents a project structure with tasks and dependencies`,
            ''
        ];

        // Use the most appropriate interfaces
        const interfaces = grammar.interfaces.slice(0, Math.min(3, grammar.interfaces.length));

        interfaces.forEach((iface, index) => {
            const contextualNames = ['project_setup', 'development_phase', 'testing_phase', 'deployment'];

            lines.push(`${iface.name} ${contextualNames[index] || `element${index + 1}`} {`);
            iface.properties.forEach(prop => {
                const value = this.generateContextualValue(prop, contextualNames[index] || `element${index + 1}`);
                lines.push(`    ${prop.name}: ${value}`);
            });
            lines.push('}');
            lines.push('');
        });

        return lines.join('\n');
    }

    private async generateTutorial(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createTutorial(grammar);
        await fs.writeFile(path.join(outputDir, 'tutorial.md'), content);
    }

    private createTutorial(grammar: ParsedGrammar): string {
        return `# ${grammar.projectName} Model Tutorial

## Introduction

This tutorial will guide you through creating ${grammar.projectName} models step by step.

## Prerequisites

- Basic understanding of modeling languages
- Text editor with syntax highlighting (recommended)

## Lesson 1: Creating Your First Element

Let's start with the simplest possible model element.

### Step 1: Basic Structure

Every element in ${grammar.projectName} follows this pattern:

\`\`\`
InterfaceName elementName {
    property1: value1
    property2: value2
}
\`\`\`

### Step 2: Your First ${grammar.interfaces[0]?.name || 'Element'}

\`\`\`
${grammar.interfaces[0]?.name || 'Element'} myFirst {
${grammar.interfaces[0]?.properties.filter(p => !p.optional).slice(0, 2).map(p =>
            `    ${p.name}: ${this.generateSimpleValue(p.type, p.array, 1)}`
        ).join('\n')}
}
\`\`\`

## Lesson 2: Understanding Properties

### Required vs Optional Properties

- **Required properties** must always be specified
- **Optional properties** (marked with ?) can be omitted

\`\`\`
${grammar.interfaces[0]?.name || 'Element'} example {
    // Required properties
${grammar.interfaces[0]?.properties.filter(p => !p.optional).map(p =>
            `    ${p.name}: ${this.generateSimpleValue(p.type, p.array, 1)}`
        ).join('\n')}
    
    // Optional properties (can be omitted)
${grammar.interfaces[0]?.properties.filter(p => p.optional).slice(0, 2).map(p =>
            `    ${p.name}: ${this.generateSimpleValue(p.type, p.array, 1)}`
        ).join('\n')}
}
\`\`\`

## Lesson 3: Working with Types

${grammar.types.length > 0 ? `### Custom Types

The language defines these custom types:

${grammar.types.map(type => `- **${type.name}**: ${type.unionTypes?.join(', ') || type.definition}`).join('\n')}

Example usage:

\`\`\`
${(() => {
                    const typeUsage = grammar.interfaces.find(i =>
                        i.properties.some(p => grammar.types.some(t => t.name === p.type))
                    );
                    if (typeUsage) {
                        const prop = typeUsage.properties.find(p =>
                            grammar.types.some(t => t.name === p.type)
                        );
                        const type = grammar.types.find(t => t.name === prop?.type);
                        return `${typeUsage.name} typed {
    ${prop?.name}: '${type?.unionTypes?.[0] || 'value'}'
}`;
                    }
                    return '// No type usage example available';
                })()}
\`\`\`
` : `### Built-in Types

The language supports standard types like string, number, and boolean.`}

## Lesson 4: References and Relationships

Elements can reference each other using the @ symbol:

\`\`\`
${grammar.interfaces[0]?.name || 'Element'} element1 {
    ${grammar.interfaces[0]?.properties.find(p => !p.optional)?.name || 'id'}: "elem1"
}

${grammar.interfaces[1]?.name || grammar.interfaces[0]?.name || 'Element'} element2 {
    ${grammar.interfaces[1]?.properties.find(p => !p.optional)?.name || 'id'}: "elem2"
    ${(() => {
                const refProp = grammar.interfaces[1]?.properties.find(p =>
                    p.type[0] === p.type[0].toUpperCase() && !['String', 'Number', 'Boolean'].includes(p.type)
                );
                return refProp ? `${refProp.name}: @element1` : '// reference: @element1';
            })()}
}
\`\`\`

## Lesson 5: Arrays

Properties can hold multiple values using array notation:

\`\`\`
${(() => {
                const ifaceWithArray = grammar.interfaces.find(i =>
                    i.properties.some(p => p.array)
                );
                if (ifaceWithArray) {
                    const arrayProp = ifaceWithArray.properties.find(p => p.array);
                    return `${ifaceWithArray.name} container {
    ${arrayProp?.name}: [${this.generateSimpleValue(arrayProp?.type || 'string', false, 1)}, ${this.generateSimpleValue(arrayProp?.type || 'string', false, 2)}]
}`;
                }
                return '// Array example: property: [value1, value2]';
            })()}
\`\`\`

## Best Practices

1. **Use meaningful names** for your elements
2. **Keep models organized** with comments
3. **Validate your models** regularly
4. **Start simple** and add complexity gradually

## Next Steps

- Explore the [advanced examples](./advanced.model)
- Read the [API documentation](../api/)
- Try creating your own models!
`;
    }

    private async generateValidationExamples(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = this.createValidationExamples(grammar);
        await fs.writeFile(path.join(outputDir, 'validation-examples.model'), content);
    }

    private createValidationExamples(grammar: ParsedGrammar): string {
        const lines: string[] = [
            '// Validation Examples',
            '// This file demonstrates both valid and invalid model configurations',
            '',
            '// ============================================',
            '// VALID EXAMPLES',
            '// ============================================',
            ''
        ];

        // Valid examples
        const mainInterface = grammar.interfaces[0];
        if (mainInterface) {
            lines.push('// Valid: All required properties present');
            lines.push(`${mainInterface.name} validComplete {`);
            mainInterface.properties.forEach(prop => {
                if (!prop.optional) {
                    lines.push(`    ${prop.name}: ${this.generateSimpleValue(prop.type, prop.array, 1)}`);
                }
            });
            lines.push('}');
            lines.push('');

            lines.push('// Valid: With optional properties');
            lines.push(`${mainInterface.name} validWithOptional {`);
            mainInterface.properties.forEach(prop => {
                lines.push(`    ${prop.name}: ${this.generateSimpleValue(prop.type, prop.array, 1)}`);
            });
            lines.push('}');
        }

        lines.push('');
        lines.push('// ============================================');
        lines.push('// INVALID EXAMPLES (will cause validation errors)');
        lines.push('// ============================================');
        lines.push('');
        lines.push('/*');
        lines.push('// Invalid: Missing required property');
        if (mainInterface) {
            lines.push(`${mainInterface.name} invalidMissing {`);
            const required = mainInterface.properties.filter(p => !p.optional);
            if (required.length > 1) {
                lines.push(`    ${required[0].name}: ${this.generateSimpleValue(required[0].type, required[0].array, 1)}`);
                lines.push(`    // Missing: ${required[1].name}`);
            }
            lines.push('}');
        }
        lines.push('');
        lines.push('// Invalid: Wrong type');
        if (mainInterface) {
            const stringProp = mainInterface.properties.find(p => p.type === 'string');
            const numberProp = mainInterface.properties.find(p => p.type === 'number');
            if (stringProp && numberProp) {
                lines.push(`${mainInterface.name} invalidType {`);
                lines.push(`    ${stringProp.name}: 123  // Should be string`);
                lines.push(`    ${numberProp.name}: "text"  // Should be number`);
                lines.push('}');
            }
        }
        lines.push('');
        lines.push('// Invalid: Unknown property');
        if (mainInterface) {
            lines.push(`${mainInterface.name} invalidUnknown {`);
            mainInterface.properties.filter(p => !p.optional).forEach(prop => {
                lines.push(`    ${prop.name}: ${this.generateSimpleValue(prop.type, prop.array, 1)}`);
            });
            lines.push('    unknownProperty: "This property does not exist"');
            lines.push('}');
        }
        lines.push('*/');

        return lines.join('\n');
    }

    // Helper methods
    private generateSimpleValue(type: string, isArray: boolean, index: number): string {
        const baseValue = this.getBaseValue(type, index);
        return isArray ? `[${baseValue}]` : baseValue;
    }

    private generateIntermediateValue(type: string, isArray: boolean, index: number, isOptional: boolean): string | null {
        if (isOptional && Math.random() > 0.5) {
            return null;
        }

        const baseValue = this.getBaseValue(type, index);

        if (isArray) {
            const secondValue = this.getBaseValue(type, index + 1);
            return `[${baseValue}, ${secondValue}]`;
        }

        return baseValue;
    }

    private generateContextualValue(prop: any, context: string): string {
        const { name, type, array } = prop;

        if (type === 'string') {
            if (name === 'id') return `"${context}_id"`;
            if (name === 'name' || name === 'label') return `"${context.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"`;
            if (name.includes('description')) return `"Description for ${context}"`;
            if (name.includes('status')) return '"active"';
            return `"${name}_${context}"`;
        } else if (type === 'number') {
            if (name === 'x') return (Math.floor(Math.random() * 500) + 100).toString();
            if (name === 'y') return (Math.floor(Math.random() * 300) + 100).toString();
            if (name === 'width' || name === 'height') return (Math.floor(Math.random() * 100) + 50).toString();
            if (name.includes('priority')) return Math.floor(Math.random() * 10).toString();
            if (name.includes('duration') || name.includes('time')) return (Math.floor(Math.random() * 60) + 10).toString();
            return Math.floor(Math.random() * 100).toString();
        } else if (type === 'boolean') {
            if (name.includes('enabled') || name.includes('active')) return 'true';
            if (name.includes('disabled') || name.includes('hidden')) return 'false';
            return Math.random() > 0.5 ? 'true' : 'false';
        }

        const baseValue = this.getBaseValue(type, 1);
        return array ? `[${baseValue}]` : baseValue;
    }

    private getBaseValue(type: string, index: number): string {
        switch (type.toLowerCase()) {
            case 'string':
                return `"value${index}"`;
            case 'number':
                return (index * 10).toString();
            case 'boolean':
                return index % 2 === 0 ? 'true' : 'false';
            case 'date':
                return `"2024-01-${String(index).padStart(2, '0')}"`;
            default:
                // For custom types or references
                if (type[0] === type[0].toUpperCase()) {
                    return `@${this.camelCase(type)}${index}`;
                }
                return `"${type}_value"`;
        }
    }

    private isCustomType(type: string, grammar: ParsedGrammar): boolean {
        return grammar.types.some(t => t.name === type);
    }

    private camelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
}