import fs from 'fs-extra';
import * as path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { DocumentationRenderer } from './renderer.js';
import { DocumentationCollector } from './collector.js';

export class DocumentationGenerator {
    private readonly renderer: DocumentationRenderer;
    private readonly collector: DocumentationCollector;

    constructor(
        private readonly config: any = {},
        private readonly outputDir: string = '.'
    ) {
        this.renderer = new DocumentationRenderer(config);
        this.collector = new DocumentationCollector(config);
    }

    async generate(): Promise<void> {
        console.log('Generating documentation...');
        
        // Ensure output directory exists
        fs.mkdirSync(this.outputDir, { recursive: true });

        // Collect documentation data
        const docData = await this.collector.collect();

        // Generate overview documentation
        await this.generateOverview(docData);

        // Generate API documentation
        await this.generateAPI(docData);

        // Generate architecture documentation
        await this.generateArchitecture(docData);

        // Generate examples documentation
        await this.generateExamples(docData);

        console.log(`Documentation generated in ${this.outputDir}`);
    }

    private async generateOverview(docData: any): Promise<void> {
        const content = await this.renderer.renderOverview(docData);
        const outputPath = path.join(this.outputDir, 'README.md');
        fs.writeFileSync(outputPath, content);
    }

    private async generateAPI(docData: any): Promise<void> {
        const content = await this.renderer.renderAPI(docData);
        const outputPath = path.join(this.outputDir, 'api.md');
        fs.writeFileSync(outputPath, content);
    }

    private async generateArchitecture(docData: any): Promise<void> {
        const content = await this.renderer.renderArchitecture(docData);
        const outputPath = path.join(this.outputDir, 'architecture.md');
        fs.writeFileSync(outputPath, content);
    }

    private async generateExamples(docData: any): Promise<void> {
        const content = await this.renderer.renderExamples(docData);
        const outputPath = path.join(this.outputDir, 'examples.md');
        fs.writeFileSync(outputPath, content);
    }
}