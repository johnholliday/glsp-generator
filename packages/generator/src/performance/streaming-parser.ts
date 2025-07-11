import { Transform /* , Readable */ } from 'stream';
import fs from 'fs-extra';
import { PerformanceMonitor } from './monitor.js';
import { PerformanceConfig, StreamingOptions } from './types';
import { GrammarAST, ParsedGrammar } from '../types/grammar';

/**
 * Streaming grammar parser for large files
 */
export class StreamingGrammarParser {
    private monitor: PerformanceMonitor;
    private options: StreamingOptions;

    constructor(
        private _config: PerformanceConfig = {},
        monitor?: PerformanceMonitor
    ) {
        this.monitor = monitor || new PerformanceMonitor();
        this.options = {
            chunkSize: 64 * 1024, // 64KB chunks
            maxConcurrency: 4,
            bufferSize: 1024 * 1024, // 1MB buffer
            ...this._config
        };
    }

    /**
     * Parse a large grammar file using streaming
     */
    async parseFile(filePath: string): Promise<GrammarAST> {
        const endTimer = this.monitor.startOperation('streaming-parse');

        try {
            const chunks: string[] = [];
            const stream = fs.createReadStream(filePath, {
                encoding: 'utf8',
                highWaterMark: this.options.chunkSize
            });

            return new Promise((resolve, reject) => {
                stream.on('data', (chunk: string | Buffer) => {
                    chunks.push(chunk.toString());
                });

                stream.on('end', () => {
                    try {
                        const content = chunks.join('');
                        const ast = this.parseGrammarContent(content, filePath);
                        resolve(ast);
                    } catch (error) {
                        reject(error);
                    }
                });

                stream.on('error', reject);
            });
        } finally {
            endTimer();
        }
    }

    /**
     * Parse grammar content into AST
     */
    private parseGrammarContent(content: string, filePath: string): GrammarAST {
        // Extract project name from file path
        const projectName = this.extractProjectName(filePath);

        // Simple grammar parsing (in real implementation, use Langium)
        const lines = content.split('\n');
        const interfaces: any[] = [];
        const types: any[] = [];
        const rules: any[] = [];

        let currentInterface: any = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Parse interface definitions
            if (line.startsWith('interface ')) {
                if (currentInterface) {
                    interfaces.push(currentInterface);
                }
                const name = line.replace('interface ', '').replace(' {', '');
                currentInterface = {
                    name,
                    properties: [],
                    superTypes: []
                };
            } else if (currentInterface && line.includes(':')) {
                // Parse property
                const [propName, propType] = line.split(':').map(s => s.trim());
                if (propName && propType) {
                    currentInterface.properties.push({
                        name: propName.replace(/[?;]/g, ''),
                        type: propType.replace(/[;]/g, ''),
                        optional: propName.includes('?'),
                        array: propType.includes('[]')
                    });
                }
            } else if (line === '}' && currentInterface) {
                interfaces.push(currentInterface);
                currentInterface = null;
            }

            // Parse type definitions
            if (line.startsWith('type ')) {
                const match = line.match(/type\s+(\w+)\s*=\s*(.+);?/);
                if (match) {
                    types.push({
                        name: match[1],
                        definition: match[2],
                        unionTypes: match[2].includes('|') ?
                            match[2].split('|').map(t => t.trim().replace(/'/g, '')) :
                            undefined
                    });
                }
            }

            // Parse grammar rules
            if (line.includes('returns') || line.includes(':')) {
                const ruleName = line.split(':')[0]?.trim();
                if (ruleName && !line.startsWith('//')) {
                    rules.push({
                        name: ruleName,
                        definition: line,
                        type: 'rule',
                        properties: [],
                        references: []
                    });
                }
            }
        }

        return {
            projectName,
            grammarName: projectName,
            rules,
            interfaces,
            types,
            imports: [],
            metadata: {
                ruleCount: rules.length,
                interfaceCount: interfaces.length,
                parseTime: Date.now(),
                typeCount: types.length,
                hasComplexTypes: false,
                hasCircularReferences: false
            }
        };
    }

    /**
     * Extract project name from file path
     */
    private extractProjectName(filePath: string): string {
        const fileName = filePath.split(/[/\\]/).pop() || 'unknown';
        return fileName.replace(/\.(langium|grammar)$/, '').replace(/[-_]/g, '');
    }

    /**
     * Create streaming transform for processing chunks
     */
    createParseTransform(): Transform {
        const self = this;
        return new Transform({
            objectMode: true,
            transform(chunk: any, _encoding: string, callback: Function) {
                try {
                    // Process chunk
                    const processed = self.processChunk(chunk);
                    callback(null, processed);
                } catch (error) {
                    callback(error);
                }
            }
        });
    }

    /**
     * Process individual chunk
     */
    private processChunk(chunk: any): any {
        // Implement chunk processing logic
        return chunk;
    }

    /**
     * Get streaming statistics
     */
    getStats() {
        return {
            chunkSize: this.options.chunkSize,
            maxConcurrency: this.options.maxConcurrency,
            bufferSize: this.options.bufferSize
        };
    }
}

/**
 * Streaming grammar converter for large ASTs
 */
export class StreamingGrammarConverter {
    private monitor: PerformanceMonitor;

    constructor(monitor?: PerformanceMonitor) {
        this.monitor = monitor || new PerformanceMonitor();
    }

    /**
     * Convert parsed grammar to AST using streaming
     */
    async convertToAST(grammar: ParsedGrammar): Promise<GrammarAST> {
        const endTimer = this.monitor.startOperation('streaming-convert');

        try {
            return {
                projectName: grammar.projectName,
                grammarName: grammar.projectName,
                rules: [],
                interfaces: grammar.interfaces,
                types: grammar.types,
                imports: [],
                metadata: {
                    ruleCount: 0,
                    interfaceCount: grammar.interfaces.length,
                    parseTime: Date.now(),
                    typeCount: grammar.types.length,
                    hasComplexTypes: false,
                    hasCircularReferences: false
                }
            };
        } finally {
            endTimer();
        }
    }
}