import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar, ParsedInterface, ParsedType } from '../types/grammar.js';

export interface RailroadDiagram {
    svg: string;
    html: string;
}

export interface DiagramOptions {
    theme?: 'light' | 'dark';
    interactive?: boolean;
    showTypes?: boolean;
    showOptional?: boolean;
}

export class RailroadDiagramGenerator {
    private defaultOptions: DiagramOptions = {
        theme: 'light',
        interactive: true,
        showTypes: true,
        showOptional: true
    };

    async generate(grammar: ParsedGrammar, outputDir: string, options?: DiagramOptions): Promise<void> {
        const opts = { ...this.defaultOptions, ...options };
        const grammarDir = path.join(outputDir, 'docs', 'grammar');
        await fs.ensureDir(grammarDir);
        
        const diagramsDir = path.join(grammarDir, 'diagrams');
        await fs.ensureDir(diagramsDir);

        // Generate individual SVG diagrams
        const diagrams: Map<string, string> = new Map();
        
        // Generate interface diagrams
        for (const iface of grammar.interfaces) {
            const svg = this.generateInterfaceDiagram(iface, opts);
            diagrams.set(iface.name, svg);
            await fs.writeFile(path.join(diagramsDir, `${iface.name}.svg`), svg);
        }

        // Generate type diagrams
        for (const type of grammar.types) {
            const svg = this.generateTypeDiagram(type, opts);
            diagrams.set(type.name, svg);
            await fs.writeFile(path.join(diagramsDir, `${type.name}.svg`), svg);
        }

        // Generate interactive HTML viewer
        const html = this.generateHTMLViewer(grammar, diagrams, opts);
        await fs.writeFile(path.join(grammarDir, 'railroad.html'), html);

        // Generate syntax markdown
        const syntaxDoc = this.generateSyntaxDocumentation(grammar);
        await fs.writeFile(path.join(grammarDir, 'syntax.md'), syntaxDoc);
    }

    private generateInterfaceDiagram(iface: ParsedInterface, options: DiagramOptions): string {
        const width = 800;
        const lineHeight = 30;
        const propertyHeight = iface.properties.length * lineHeight;
        const height = 150 + propertyHeight;

        const theme = this.getTheme(options.theme!);

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .interface-box { fill: ${theme.boxFill}; stroke: ${theme.boxStroke}; stroke-width: 2; }
      .interface-name { fill: ${theme.textColor}; font-family: monospace; font-size: 18px; font-weight: bold; }
      .property { fill: ${theme.textColor}; font-family: monospace; font-size: 14px; }
      .property-type { fill: ${theme.typeColor}; }
      .optional { fill: ${theme.optionalColor}; }
      .extends { fill: ${theme.extendsColor}; font-style: italic; }
      .arrow { fill: none; stroke: ${theme.arrowColor}; stroke-width: 2; marker-end: url(#arrowhead); }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${theme.arrowColor}" />
    </marker>
  </defs>
  
  <!-- Interface Box -->
  <rect class="interface-box" x="20" y="20" width="${width - 40}" height="${height - 40}" rx="5" />
  
  <!-- Interface Name -->
  <text class="interface-name" x="${width / 2}" y="50" text-anchor="middle">
    interface ${iface.name}
  </text>
  
  ${iface.superTypes && iface.superTypes.length > 0 ? `
  <!-- Extends -->
  <text class="extends" x="${width / 2}" y="70" text-anchor="middle">
    extends ${iface.superTypes.join(', ')}
  </text>
  ` : ''}
  
  <!-- Properties -->
  <line x1="20" y1="80" x2="${width - 20}" y2="80" stroke="${theme.lineColor}" stroke-width="1" />
  
  ${iface.properties.map((prop, index) => `
  <g transform="translate(40, ${100 + index * lineHeight})">
    <text class="property">
      ${prop.name}${prop.optional ? '?' : ''}:
      <tspan class="property-type"> ${prop.type}${prop.array ? '[]' : ''}</tspan>
      ${prop.optional ? '<tspan class="optional"> (optional)</tspan>' : ''}
    </text>
  </g>
  `).join('')}
</svg>`;
    }

    private generateTypeDiagram(type: ParsedType, options: DiagramOptions): string {
        const values = type.unionTypes || [];
        const width = 600;
        const valueWidth = 120;
        const valueHeight = 40;
        const padding = 20;
        const cols = Math.min(4, values.length);
        const rows = Math.ceil(values.length / cols);
        const height = 100 + rows * (valueHeight + padding);

        const theme = this.getTheme(options.theme!);

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .type-box { fill: ${theme.boxFill}; stroke: ${theme.boxStroke}; stroke-width: 2; }
      .type-name { fill: ${theme.textColor}; font-family: monospace; font-size: 18px; font-weight: bold; }
      .value-box { fill: ${theme.valueFill}; stroke: ${theme.valueStroke}; stroke-width: 1; rx: 3; }
      .value-text { fill: ${theme.textColor}; font-family: monospace; font-size: 12px; }
      .union-line { stroke: ${theme.lineColor}; stroke-width: 1; fill: none; }
    </style>
  </defs>
  
  <!-- Type Name -->
  <text class="type-name" x="${width / 2}" y="30" text-anchor="middle">
    type ${type.name}
  </text>
  
  <!-- Union Symbol -->
  <text class="type-name" x="${width / 2}" y="55" text-anchor="middle" font-size="14">
    =
  </text>
  
  <!-- Values -->
  ${values.map((value, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = (width - cols * (valueWidth + padding)) / 2 + col * (valueWidth + padding);
    const y = 80 + row * (valueHeight + padding);
    
    return `
  <g transform="translate(${x}, ${y})">
    <rect class="value-box" width="${valueWidth}" height="${valueHeight}" />
    <text class="value-text" x="${valueWidth / 2}" y="${valueHeight / 2 + 5}" text-anchor="middle">
      '${value}'
    </text>
  </g>
  
  ${index < values.length - 1 && col < cols - 1 ? `
  <text x="${x + valueWidth + padding / 2}" y="${y + valueHeight / 2 + 5}" text-anchor="middle" class="type-name">
    |
  </text>
  ` : ''}`;
  }).join('')}
</svg>`;
    }

    private generateHTMLViewer(grammar: ParsedGrammar, diagrams: Map<string, string>, options: DiagramOptions): string {
        const theme = this.getTheme(options.theme!);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${grammar.projectName} Grammar Railroad Diagrams</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: ${theme.background};
            color: ${theme.textColor};
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            color: ${theme.headingColor};
        }
        .navigation {
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            height: 100vh;
            background: ${theme.sidebarBg};
            border-right: 1px solid ${theme.borderColor};
            overflow-y: auto;
            padding: 20px;
        }
        .content {
            margin-left: 290px;
            padding: 20px;
        }
        .nav-section {
            margin-bottom: 30px;
        }
        .nav-section h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: ${theme.mutedColor};
            margin-bottom: 10px;
        }
        .nav-item {
            display: block;
            padding: 5px 10px;
            color: ${theme.linkColor};
            text-decoration: none;
            border-radius: 3px;
            margin-bottom: 2px;
        }
        .nav-item:hover {
            background: ${theme.hoverBg};
        }
        .nav-item.active {
            background: ${theme.activeBg};
            color: ${theme.activeColor};
        }
        .diagram-container {
            background: white;
            border: 1px solid ${theme.borderColor};
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 30px;
            overflow-x: auto;
        }
        .diagram-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: ${theme.headingColor};
        }
        .search-box {
            width: 100%;
            padding: 8px;
            border: 1px solid ${theme.borderColor};
            border-radius: 3px;
            margin-bottom: 20px;
            background: ${theme.inputBg};
            color: ${theme.textColor};
        }
        .description {
            color: ${theme.mutedColor};
            margin-bottom: 15px;
            font-style: italic;
        }
        @media (max-width: 768px) {
            .navigation {
                display: none;
            }
            .content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="navigation">
        <h2>${grammar.projectName}</h2>
        <input type="text" class="search-box" placeholder="Search..." onkeyup="filterDiagrams(this.value)">
        
        <div class="nav-section">
            <h3>Interfaces</h3>
            ${grammar.interfaces.map(iface => 
                `<a href="#${iface.name}" class="nav-item" onclick="scrollToDiagram('${iface.name}')">${iface.name}</a>`
            ).join('\n            ')}
        </div>
        
        <div class="nav-section">
            <h3>Types</h3>
            ${grammar.types.map(type => 
                `<a href="#${type.name}" class="nav-item" onclick="scrollToDiagram('${type.name}')">${type.name}</a>`
            ).join('\n            ')}
        </div>
    </div>
    
    <div class="content">
        <h1>${grammar.projectName} Grammar Railroad Diagrams</h1>
        <p class="description">
            Visual representation of the grammar structure. Click on any item in the navigation to jump to its diagram.
        </p>
        
        <h2>Interfaces</h2>
        ${grammar.interfaces.map(iface => `
        <div class="diagram-container" id="${iface.name}" data-name="${iface.name.toLowerCase()}">
            <div class="diagram-title">${iface.name}</div>
            ${this.getInterfaceDescription(iface)}
            ${diagrams.get(iface.name)}
        </div>
        `).join('\n        ')}
        
        <h2>Types</h2>
        ${grammar.types.map(type => `
        <div class="diagram-container" id="${type.name}" data-name="${type.name.toLowerCase()}">
            <div class="diagram-title">${type.name}</div>
            ${this.getTypeDescription(type)}
            ${diagrams.get(type.name)}
        </div>
        `).join('\n        ')}
    </div>
    
    <script>
        function scrollToDiagram(name) {
            const element = document.getElementById(name);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Update active navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                event.target.classList.add('active');
            }
        }
        
        function filterDiagrams(query) {
            const lowerQuery = query.toLowerCase();
            document.querySelectorAll('.diagram-container').forEach(container => {
                const name = container.getAttribute('data-name');
                container.style.display = name.includes(lowerQuery) ? 'block' : 'none';
            });
            
            document.querySelectorAll('.nav-item').forEach(item => {
                const name = item.textContent.toLowerCase();
                item.style.display = name.includes(lowerQuery) ? 'block' : 'none';
            });
        }
        
        // Highlight current section on scroll
        window.addEventListener('scroll', () => {
            const containers = document.querySelectorAll('.diagram-container');
            let current = '';
            
            containers.forEach(container => {
                const rect = container.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    current = container.id;
                }
            });
            
            if (current) {
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.toggle('active', item.getAttribute('href') === '#' + current);
                });
            }
        });
    </script>
</body>
</html>`;
    }

    private generateSyntaxDocumentation(grammar: ParsedGrammar): string {
        return `# ${grammar.projectName} Syntax Guide

## Overview

This document describes the syntax of the ${grammar.projectName} modeling language.

## Interfaces

${grammar.interfaces.map(iface => `
### ${iface.name}

${this.getInterfaceDescription(iface)}

**Syntax:**
\`\`\`
${iface.name} <name> {
${iface.properties.map(prop => 
    `    ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}${prop.array ? '[]' : ''}`
).join('\n')}
}
\`\`\`

**Example:**
\`\`\`
${iface.name} example${iface.name} {
${iface.properties.filter(p => !p.optional).map(prop => 
    `    ${prop.name}: ${this.getExampleValue(prop.type, prop.array)}`
).join('\n')}
}
\`\`\`
`).join('\n')}

## Types

${grammar.types.map(type => `
### ${type.name}

${this.getTypeDescription(type)}

**Definition:** \`${type.definition}\`

${type.unionTypes ? `**Values:** ${type.unionTypes.map(v => `\`'${v}'\``).join(' | ')}` : ''}
`).join('\n')}

## Grammar Rules

### Identifiers
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Case-sensitive

### References
- Use \`@\` prefix to reference other elements
- Example: \`source: @node1\`

### Arrays
- Denoted by \`[]\` after the type
- Example: \`children: Node[]\`

### Optional Properties
- Denoted by \`?\` after the property name
- Example: \`description?: string\`

### Comments
- Single-line: \`// comment\`
- Multi-line: \`/* comment */\`
`;
    }

    private getTheme(theme: 'light' | 'dark') {
        return theme === 'dark' ? {
            background: '#1e1e1e',
            boxFill: '#2d2d2d',
            boxStroke: '#4a4a4a',
            textColor: '#d4d4d4',
            typeColor: '#4ec9b0',
            optionalColor: '#ce9178',
            extendsColor: '#c586c0',
            arrowColor: '#569cd6',
            lineColor: '#4a4a4a',
            valueFill: '#252526',
            valueStroke: '#3e3e42',
            headingColor: '#e1e1e1',
            sidebarBg: '#252526',
            borderColor: '#3e3e42',
            mutedColor: '#858585',
            linkColor: '#3794ff',
            hoverBg: '#2a2d2e',
            activeBg: '#094771',
            activeColor: '#ffffff',
            inputBg: '#3c3c3c'
        } : {
            background: '#ffffff',
            boxFill: '#f5f5f5',
            boxStroke: '#cccccc',
            textColor: '#333333',
            typeColor: '#0066cc',
            optionalColor: '#666666',
            extendsColor: '#9933cc',
            arrowColor: '#0066cc',
            lineColor: '#cccccc',
            valueFill: '#f9f9f9',
            valueStroke: '#dddddd',
            headingColor: '#1a1a1a',
            sidebarBg: '#f8f8f8',
            borderColor: '#e1e1e1',
            mutedColor: '#666666',
            linkColor: '#0066cc',
            hoverBg: '#f0f0f0',
            activeBg: '#e3f2fd',
            activeColor: '#1976d2',
            inputBg: '#ffffff'
        };
    }

    private getInterfaceDescription(iface: ParsedInterface): string {
        return `<p class="description">Interface defining the structure of ${iface.name} elements${
            iface.superTypes && iface.superTypes.length > 0 
                ? `, extending ${iface.superTypes.join(', ')}` 
                : ''
        }.</p>`;
    }

    private getTypeDescription(type: ParsedType): string {
        return `<p class="description">Type enumeration with ${
            type.unionTypes?.length || 0
        } possible values.</p>`;
    }

    private getExampleValue(type: string, isArray: boolean): string {
        const base = type === 'string' ? '"example"' : 
                    type === 'number' ? '42' :
                    type === 'boolean' ? 'true' : 
                    '@referenceId';
        return isArray ? `[${base}]` : base;
    }
}