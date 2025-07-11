import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { ReadmeGenerator } from './readme-generator.js';
import { APIDocumentationGenerator } from './api-generator.js';
import { RailroadDiagramGenerator } from './railroad-generator.js';
import { ExampleModelGenerator } from './example-generator.js';
import { DocumentationOptions, DocumentationResult } from './types.js';

export class DocumentationGenerator {
    private readmeGenerator: ReadmeGenerator;
    private apiGenerator: APIDocumentationGenerator;
    private railroadGenerator: RailroadDiagramGenerator;
    private exampleGenerator: ExampleModelGenerator;

    constructor() {
        this.readmeGenerator = new ReadmeGenerator();
        this.apiGenerator = new APIDocumentationGenerator();
        this.railroadGenerator = new RailroadDiagramGenerator();
        this.exampleGenerator = new ExampleModelGenerator();
    }

    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options?: DocumentationOptions
    ): Promise<DocumentationResult> {
        const opts = this.normalizeOptions(options);
        const filesGenerated: string[] = [];
        const errors: string[] = [];

        console.log(chalk.blue('📚 Generating documentation...'));

        try {
            // Ensure documentation directories exist
            if (opts.api || opts.diagrams || opts.examples) {
                await fs.ensureDir(path.join(outputDir, 'docs'));
            }

            // Generate README
            if (opts.readme) {
                console.log(chalk.gray('  • Generating README.md...'));
                try {
                    await this.readmeGenerator.generate(grammar, config, outputDir);
                    filesGenerated.push('README.md');
                } catch (error) {
                    errors.push(`README generation failed: ${error}`);
                }
            }

            // Generate API documentation
            if (opts.api) {
                console.log(chalk.gray('  • Generating API documentation...'));
                try {
                    await this.apiGenerator.generate(grammar, config, outputDir);
                    filesGenerated.push(
                        'docs/api/index.md',
                        'docs/api/interfaces.md',
                        'docs/api/types.md',
                        'docs/api/server.md',
                        'docs/api/client.md'
                    );
                } catch (error) {
                    errors.push(`API documentation generation failed: ${error}`);
                }
            }

            // Generate railroad diagrams
            if (opts.diagrams) {
                console.log(chalk.gray('  • Generating railroad diagrams...'));
                try {
                    await this.railroadGenerator.generate(grammar, outputDir, {
                        theme: opts.theme,
                        interactive: true,
                        showTypes: true,
                        showOptional: true
                    });
                    filesGenerated.push(
                        'docs/grammar/railroad.html',
                        'docs/grammar/syntax.md',
                        ...grammar.interfaces.map(i => `docs/grammar/diagrams/${i.name}.svg`),
                        ...grammar.types.map(t => `docs/grammar/diagrams/${t.name}.svg`)
                    );
                } catch (error) {
                    errors.push(`Railroad diagram generation failed: ${error}`);
                }
            }

            // Generate example models
            if (opts.examples) {
                console.log(chalk.gray('  • Generating example models...'));
                try {
                    await this.exampleGenerator.generate(grammar, outputDir);
                    filesGenerated.push(
                        'docs/examples/basic.model',
                        'docs/examples/intermediate.model',
                        'docs/examples/advanced.model',
                        'docs/examples/real-world.model',
                        'docs/examples/tutorial.md',
                        'docs/examples/validation-examples.model'
                    );
                } catch (error) {
                    errors.push(`Example generation failed: ${error}`);
                }
            }

            // Generate additional files
            if (opts.screenshots) {
                await this.generateScreenshotPlaceholders(outputDir);
                filesGenerated.push(
                    'docs/images/screenshot.png',
                    'docs/images/architecture.svg'
                );
            }

            // Generate documentation index only if we have docs directory
            if (opts.api || opts.diagrams || opts.examples) {
                await this.generateDocumentationIndex(grammar, outputDir, filesGenerated);
                filesGenerated.push('docs/index.md');
            }

            // Generate CONTRIBUTING.md
            await this.generateContributingGuide(grammar, outputDir);
            filesGenerated.push('CONTRIBUTING.md');

            // Generate LICENSE if not exists
            if (!await fs.pathExists(path.join(outputDir, 'LICENSE'))) {
                await this.generateLicense(outputDir);
                filesGenerated.push('LICENSE');
            }

            console.log(chalk.green(`✅ Documentation generated successfully!`));
            console.log(chalk.gray(`   Generated ${filesGenerated.length} files`));

            return {
                success: errors.length === 0,
                filesGenerated,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error(chalk.red('❌ Documentation generation failed:'), error);
            return {
                success: false,
                filesGenerated,
                errors: [`Fatal error: ${error}`]
            };
        }
    }

    private normalizeOptions(options?: DocumentationOptions): Required<DocumentationOptions> {
        return {
            readme: options?.readme ?? true,
            api: options?.api ?? true,
            diagrams: options?.diagrams ?? true,
            examples: options?.examples ?? true,
            theme: options?.theme ?? 'light',
            screenshots: options?.screenshots ?? true,
            outputDir: options?.outputDir ?? '.'
        };
    }

    private async generateDocumentationIndex(
        grammar: ParsedGrammar,
        outputDir: string,
        generatedFiles: string[]
    ): Promise<void> {
        const content = `# ${grammar.projectName} Documentation

Welcome to the ${grammar.projectName} documentation!

## Documentation Structure

${generatedFiles.includes('README.md') ? '- [README](../README.md) - Project overview and getting started' : ''}
${generatedFiles.includes('docs/api/index.md') ? '- [API Documentation](./api/) - Complete API reference' : ''}
${generatedFiles.includes('docs/grammar/railroad.html') ? '- [Grammar Diagrams](./grammar/railroad.html) - Visual grammar representation' : ''}
${generatedFiles.includes('docs/grammar/syntax.md') ? '- [Syntax Guide](./grammar/syntax.md) - Language syntax reference' : ''}
${generatedFiles.includes('docs/examples/tutorial.md') ? '- [Tutorial](./examples/tutorial.md) - Step-by-step guide' : ''}
${generatedFiles.includes('docs/examples/basic.model') ? '- [Examples](./examples/) - Sample model files' : ''}

## Quick Links

### For Users
- [Getting Started](../README.md#getting-started)
- [Basic Examples](./examples/basic.model)
- [Tutorial](./examples/tutorial.md)

### For Developers
- [API Reference](./api/)
- [Contributing Guide](../CONTRIBUTING.md)
- [Advanced Examples](./examples/advanced.model)

## Model Statistics

- **Interfaces**: ${grammar.interfaces.length}
- **Types**: ${grammar.types.length}
- **Total Properties**: ${grammar.interfaces.reduce((sum, i) => sum + (i.properties?.length || 0), 0)}

## Getting Help

- [Issue Tracker](https://github.com/your-org/${grammar.projectName}/issues)
- [Discussions](https://github.com/your-org/${grammar.projectName}/discussions)
- [Documentation](https://your-org.github.io/${grammar.projectName}/)

---

Generated on ${new Date().toLocaleDateString()}
`;

        await fs.writeFile(path.join(outputDir, 'docs', 'index.md'), content);
    }

    private async generateScreenshotPlaceholders(outputDir: string): Promise<void> {
        const imagesDir = path.join(outputDir, 'docs', 'images');
        await fs.ensureDir(imagesDir);

        // Create placeholder SVG for screenshot
        const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f0f0f0"/>
  <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#666">
    Extension Screenshot Placeholder
  </text>
  <text x="400" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999">
    Replace with actual screenshot
  </text>
</svg>`;

        await fs.writeFile(path.join(imagesDir, 'screenshot.svg'), screenshotSvg);

        // Create placeholder architecture diagram
        const architectureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="#f8f8f8"/>
  <g>
    <!-- Client -->
    <rect x="50" y="50" width="200" height="100" fill="#4a90e2" stroke="#357abd" stroke-width="2"/>
    <text x="150" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">
      Client
    </text>
    
    <!-- Server -->
    <rect x="300" y="50" width="200" height="100" fill="#5cb85c" stroke="#449d44" stroke-width="2"/>
    <text x="400" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">
      Server
    </text>
    
    <!-- Model -->
    <rect x="550" y="50" width="200" height="100" fill="#f0ad4e" stroke="#ec971f" stroke-width="2"/>
    <text x="650" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">
      Model
    </text>
    
    <!-- Arrows -->
    <path d="M 250 100 L 300 100" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
    <path d="M 500 100 L 550 100" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  </g>
  
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  
  <text x="400" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#666">
    Architecture Diagram Placeholder
  </text>
  <text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#999">
    Replace with actual architecture diagram
  </text>
</svg>`;

        await fs.writeFile(path.join(imagesDir, 'architecture.svg'), architectureSvg);

        // Also save as PNG placeholders (1x1 transparent pixel)
        const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        await fs.writeFile(path.join(imagesDir, 'screenshot.png'), pngData);
    }

    private async generateContributingGuide(grammar: ParsedGrammar, outputDir: string): Promise<void> {
        const content = `# Contributing to ${grammar.projectName}

Thank you for your interest in contributing to ${grammar.projectName}! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the issue tracker
2. Create a new issue with a clear title and description
3. Include steps to reproduce the issue
4. Add relevant labels

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Run tests (\`yarn test\`)
5. Commit your changes (\`git commit -m 'Add amazing feature'\`)
6. Push to your branch (\`git push origin feature/amazing-feature\`)
7. Open a Pull Request

### Development Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/${grammar.projectName}.git

# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test

# Run in watch mode
yarn watch
\`\`\`

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Write tests for new functionality
- Update documentation as needed
- Keep commits atomic and descriptive

## Model Development

When modifying the language grammar:

1. Update the Langium grammar file
2. Regenerate the language support
3. Update examples and tests
4. Update documentation

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Add integration tests for complex features

## Documentation

- Update README.md for user-facing changes
- Update API documentation for interface changes
- Add examples for new features
- Keep documentation in sync with code

## Release Process

1. Version updates follow semantic versioning
2. Releases are created from the main branch
3. Changelog is updated with each release

## Questions?

Feel free to open an issue or start a discussion if you have questions about contributing.

Thank you for contributing to ${grammar.projectName}!
`;

        await fs.writeFile(path.join(outputDir, 'CONTRIBUTING.md'), content);
    }

    private async generateLicense(outputDir: string): Promise<void> {
        const content = `MIT License

Copyright (c) ${new Date().getFullYear()} Your Organization

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

        await fs.writeFile(path.join(outputDir, 'LICENSE'), content);
    }
}